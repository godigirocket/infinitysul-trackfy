import { MetaInsight, BreakdownInsight } from "@/types";

const API_VERSION = "v19.0";
const BASE_URL = `https://graph.facebook.com/${API_VERSION}`;

export const normalizeAccountId = (id: string): string => {
  if (!id) return id;
  return id.startsWith("act_") ? id : `act_${id}`;
};

// ─────────────────────────────────────────────────────────────────────────────
// Paginate through all pages of a Meta API response
// ─────────────────────────────────────────────────────────────────────────────
async function paginateAll(firstUrl: string): Promise<any[]> {
  let results: any[] = [];
  let url: string | null = firstUrl;

  while (url) {
    const res = await fetch(url);

    // Handle non-2xx without throwing — return what we have
    if (!res.ok && res.status !== 400) {
      const text = await res.text().catch(() => "");
      console.error(`[MetaAPI] HTTP ${res.status}:`, text.slice(0, 300));
      throw new Error(`Meta API HTTP ${res.status}`);
    }

    const json = await res.json() as { data?: any[]; paging?: { next?: string }; error?: any };

    if (json.error) {
      console.error("[MetaAPI] Error:", json.error);
      throw new Error(json.error.message || "An unknown error occurred");
    }

    results = results.concat(json.data || []);
    url = json.paging?.next || null;
  }

  return results;
}

// ─────────────────────────────────────────────────────────────────────────────
// CALL 1 — Campaign / Adset / Ad level insights (no breakdowns)
// ─────────────────────────────────────────────────────────────────────────────
export const fetchMetaInsights = async (
  accountId: string,
  token: string,
  params: {
    period?: string;
    customStart?: string;
    customEnd?: string;
    level?: "campaign" | "adset" | "ad";
    campaignId?: string;
    breakdowns?: string;
  }
): Promise<MetaInsight[]> => {
  const level = params.level || "campaign";

  const isMaximum = params.period === "maximum";

  // Base fields — safe for all levels and periods
  const fieldsArr = [
    "campaign_name",
    "campaign_id",
    "objective",
    "spend",
    "impressions",
    "clicks",
    "actions",
    "date_start",
    "date_stop",
  ];

  // frequency + ctr not available with breakdowns or maximum on ad level
  if (!params.breakdowns && !isMaximum) {
    fieldsArr.push("frequency", "ctr");
  }

  // video fields — safe at campaign/adset, skip at ad+maximum to avoid 500
  if (!(level === "ad" && isMaximum)) {
    fieldsArr.push(
      "video_p25_watched_actions",
      "video_p50_watched_actions",
      "video_p75_watched_actions",
      "video_p100_watched_actions",
      "video_avg_time_watched_actions"
    );
  }

  if (level === "adset" || level === "ad") {
    fieldsArr.push("adset_name", "adset_id");
  }
  if (level === "ad") {
    fieldsArr.push("ad_name", "ad_id");
    // quality_ranking and video_30_sec cause 500 with maximum — skip
    if (!isMaximum) {
      fieldsArr.push("quality_ranking", "video_30_sec_watched_actions");
    }
  }

  const fields = fieldsArr.join(",");
  const id = params.campaignId || normalizeAccountId(accountId);

  let urlParams = `fields=${fields}&access_token=${token}&limit=500&level=${level}`;

  if (params.customStart && params.customEnd) {
    urlParams += `&time_range=${JSON.stringify({ since: params.customStart, until: params.customEnd })}`;
  } else if (params.period && params.period !== "custom") {
    urlParams += `&date_preset=${params.period}`;
  }

  // time_increment=1 = daily rows. NOT compatible with: breakdowns, maximum period
  if (!params.breakdowns && !isMaximum) {
    urlParams += "&time_increment=1";
  }

  if (params.breakdowns) {
    urlParams += `&breakdowns=${params.breakdowns}`;
  }

  const url = `${BASE_URL}/${id}/insights?${urlParams}`;
  return paginateAll(url);
};

// ─────────────────────────────────────────────────────────────────────────────
// CALL 2 — Hourly heatmap (advertiser timezone = more accurate for bidding)
// Uses both timezone variants and merges, so whichever the account supports works
// ─────────────────────────────────────────────────────────────────────────────
export const fetchHourlyInsights = async (
  accountId: string,
  token: string,
  params: { period?: string; customStart?: string; customEnd?: string }
): Promise<any[]> => {
  const id = normalizeAccountId(accountId);

  const fields = "spend,impressions,clicks,actions,date_start";

  const buildUrl = (breakdown: string) => {
    let p = `fields=${fields}&access_token=${token}&limit=500&level=account&breakdowns=${breakdown}`;
    if (params.customStart && params.customEnd) {
      p += `&time_range=${JSON.stringify({ since: params.customStart, until: params.customEnd })}`;
    } else if (params.period && params.period !== "custom") {
      p += `&date_preset=${params.period}`;
    }
    return `${BASE_URL}/${id}/insights?${p}`;
  };

  // Try advertiser timezone first (more accurate), fall back to audience timezone
  const [advertiserRes, audienceRes] = await Promise.allSettled([
    paginateAll(buildUrl("hourly_stats_aggregated_by_advertiser_time_zone")),
    paginateAll(buildUrl("hourly_stats_aggregated_by_audience_time_zone")),
  ]);

  // Prefer advertiser timezone; if empty or failed, use audience timezone
  const advertiserData = advertiserRes.status === "fulfilled" ? advertiserRes.value : [];
  const audienceData = audienceRes.status === "fulfilled" ? audienceRes.value : [];

  if (advertiserData.length > 0) {
    return advertiserData.map(r => ({
      ...r,
      _hourly_field: r.hourly_stats_aggregated_by_advertiser_time_zone,
    }));
  }

  return audienceData.map(r => ({
    ...r,
    _hourly_field: r.hourly_stats_aggregated_by_audience_time_zone,
  }));
};

// ─────────────────────────────────────────────────────────────────────────────
// CALL 3 — Audience breakdowns (age, gender, platform — separate calls)
// ─────────────────────────────────────────────────────────────────────────────
export const fetchBreakdowns = async (
  accountId: string,
  token: string,
  params: { period?: string; customStart?: string; customEnd?: string }
): Promise<{
  age: BreakdownInsight[];
  gender: BreakdownInsight[];
  placement: BreakdownInsight[];
  region: BreakdownInsight[];
}> => {
  const id = normalizeAccountId(accountId);
  // Breakdown queries: minimal fields to avoid incompatibility errors
  const fields = "spend,impressions,clicks,actions,date_start";

  const buildUrl = (breakdown: string) => {
    let p = `fields=${fields}&access_token=${token}&limit=500&level=account&breakdowns=${breakdown}`;
    if (params.customStart && params.customEnd) {
      p += `&time_range=${JSON.stringify({ since: params.customStart, until: params.customEnd })}`;
    } else if (params.period && params.period !== "custom") {
      p += `&date_preset=${params.period}`;
    }
    return `${BASE_URL}/${id}/insights?${p}`;
  };

  const [ageRes, genderRes, placementRes, regionRes] = await Promise.allSettled([
    paginateAll(buildUrl("age")),
    paginateAll(buildUrl("gender")),
    paginateAll(buildUrl("publisher_platform,platform_position")),
    paginateAll(buildUrl("region")),
  ]);

  return {
    age: ageRes.status === "fulfilled" ? ageRes.value : [],
    gender: genderRes.status === "fulfilled" ? genderRes.value : [],
    placement: placementRes.status === "fulfilled" ? placementRes.value : [],
    region: regionRes.status === "fulfilled" ? regionRes.value : [],
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// CALL 4 — Creatives HD
// Fetches via /ads → creative object → image_url (original resolution)
// ─────────────────────────────────────────────────────────────────────────────
export const fetchCreativesHD = async (accountId: string, token: string): Promise<Record<string, string>> => {
  const id = normalizeAccountId(accountId);

  // Get all ads with their creative IDs and direct image fields
  const adsUrl = `${BASE_URL}/${id}/ads?fields=id,name,creative{id,name,image_url,thumbnail_url,object_story_spec,asset_feed_spec}&limit=500&access_token=${token}`;

  let ads: any[] = [];
  try {
    ads = await paginateAll(adsUrl);
  } catch (e) {
    console.warn("[MetaAPI] fetchCreativesHD ads fetch failed:", e);
    return {};
  }

  const urlMap: Record<string, string> = {};

  for (const ad of ads) {
    const creative = ad.creative;
    if (!creative) continue;

    // image_url on the creative object = original resolution
    let hdUrl = creative.image_url;

    // Fallback: check object_story_spec for image hash or link data
    if (!hdUrl && creative.object_story_spec) {
      const spec = creative.object_story_spec;
      hdUrl = spec.link_data?.image_url
        || spec.photo_data?.url
        || spec.video_data?.image_url;
    }

    // Last resort: thumbnail
    if (!hdUrl) hdUrl = creative.thumbnail_url;

    if (hdUrl) urlMap[ad.id] = hdUrl;
  }

  return urlMap;
};

// ─────────────────────────────────────────────────────────────────────────────
// fetchAdThumbnails — single ad fallback (used by CreativeCard)
// ─────────────────────────────────────────────────────────────────────────────
export const fetchAdThumbnails = async (id: string, token: string): Promise<string | null> => {
  // Path 1: creative object directly on the ad
  try {
    const res = await fetch(`${BASE_URL}/${id}?fields=creative{id,image_url,thumbnail_url,object_story_spec}&access_token=${token}`);
    const json = await res.json();
    const c = json.creative;
    if (c) {
      const url = c.image_url
        || c.object_story_spec?.link_data?.image_url
        || c.object_story_spec?.photo_data?.url
        || c.thumbnail_url;
      if (url) return url;
    }
  } catch (e) {}

  // Path 2: adcreatives edge
  try {
    const res = await fetch(`${BASE_URL}/${id}?fields=adcreatives{image_url,thumbnail_url}&access_token=${token}`);
    const json = await res.json();
    const c = json.adcreatives?.data?.[0];
    if (c) return c.image_url || c.thumbnail_url || null;
  } catch (e) {}

  return null;
};

// ─────────────────────────────────────────────────────────────────────────────
// fetchAccountStructure — hierarchy for filters/CRM
// ─────────────────────────────────────────────────────────────────────────────
export const fetchAccountStructure = async (accountId: string, token: string) => {
  const account_id = normalizeAccountId(accountId);

  const [campaigns, adsets, ads] = await Promise.all([
    fetch(`${BASE_URL}/${account_id}/campaigns?fields=name,id,effective_status,objective&limit=1000&access_token=${token}`).then(r => r.json()),
    fetch(`${BASE_URL}/${account_id}/adsets?fields=name,id,effective_status,campaign_id&limit=1000&access_token=${token}`).then(r => r.json()),
    fetch(`${BASE_URL}/${account_id}/ads?fields=name,id,effective_status,adset_id,campaign_id,creative{id,image_url,thumbnail_url}&limit=1000&access_token=${token}`).then(r => r.json()),
  ]);

  return {
    campaigns: (campaigns.data || []) as any[],
    adsets: (adsets.data || []) as any[],
    ads: (ads.data || []) as any[],
  };
};

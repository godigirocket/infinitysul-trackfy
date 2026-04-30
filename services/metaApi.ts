import { MetaInsight, BreakdownInsight } from "@/types";

const META_BASE = "https://graph.facebook.com";
const API_VERSION = "v19.0";
const BASE_URL = `${META_BASE}/${API_VERSION}`;

export const normalizeAccountId = (id: string): string => {
  if (!id) return id;
  return id.startsWith("act_") ? id : `act_${id}`;
};

// ─────────────────────────────────────────────────────────────────────────────
// All Meta API calls go through /api/meta (server-side proxy)
// ─────────────────────────────────────────────────────────────────────────────
async function metaFetch(url: string, attempt = 0): Promise<any> {
  const res = await fetch("/api/meta", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  });
  const json = await res.json();

  // Retry on 504 / transient errors (max 3 attempts, exponential backoff)
  if (res.status === 504 || json?.error?.is_transient) {
    if (attempt < 2) {
      const delay = (attempt + 1) * 2000; // 2s, 4s
      await new Promise(r => setTimeout(r, delay));
      return metaFetch(url, attempt + 1);
    }
  }

  if (json.error) {
    console.error("[MetaAPI] Error:", json.error);
    throw new Error(json.error.message || "Meta API error");
  }
  return json;
}

async function paginateAll(firstUrl: string, maxPages = 20): Promise<any[]> {
  let results: any[] = [];
  let url: string | null = firstUrl;
  let pages = 0;

  while (url && pages < maxPages) {
    const json = await metaFetch(url);
    results = results.concat(json.data || []);
    url = json.paging?.next || null;
    pages++;
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
  // Short periods (today/yesterday) at ad level can 500 with too many fields
  const isShortPeriod = params.period === "today" || params.period === "yesterday";

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

  // frequency + ctr not available with breakdowns, maximum, or short periods at ad level
  if (!params.breakdowns && !isMaximum && !(isShortPeriod && level === "ad")) {
    fieldsArr.push("frequency", "ctr");
  }

  // video fields — skip at ad+maximum and ad+short to avoid 500
  if (!(level === "ad" && (isMaximum || isShortPeriod))) {
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
    // quality_ranking and video_30_sec cause 500 with maximum or short periods
    if (!isMaximum && !isShortPeriod) {
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
  const urlMap: Record<string, string> = {};

  // Fetch ads with creative fields — use thumbnail_url as primary (works for video+image)
  // Also request previews for video ads that don't have image_url
  let ads: any[] = [];
  try {
    const adsUrl = `${BASE_URL}/${id}/ads?fields=id,creative{id,image_url,thumbnail_url,object_story_spec,effective_object_story_id}&limit=100&access_token=${token}`;
    ads = await paginateAll(adsUrl, 10);
  } catch (e) {
    try {
      // Minimal fallback
      const minUrl = `${BASE_URL}/${id}/ads?fields=id,creative{id,thumbnail_url,image_url}&limit=50&access_token=${token}`;
      ads = await paginateAll(minUrl, 10);
    } catch (e2) {
      console.warn("[MetaAPI] fetchCreativesHD failed:", e2);
      return {};
    }
  }

  for (const ad of ads) {
    const creative = ad.creative;
    if (!creative) continue;

    // Priority: image_url (static) > object_story_spec image > thumbnail_url (video preview)
    let hdUrl = creative.image_url;

    if (!hdUrl && creative.object_story_spec) {
      const spec = creative.object_story_spec;
      hdUrl = spec.link_data?.image_url
        || spec.photo_data?.url
        || spec.video_data?.image_url;
    }

    // thumbnail_url works for BOTH image and video ads — use as fallback
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
    const json = await metaFetch(`${BASE_URL}/${id}?fields=creative{id,image_url,thumbnail_url,object_story_spec}&access_token=${token}`);
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
    const json = await metaFetch(`${BASE_URL}/${id}?fields=adcreatives{image_url,thumbnail_url}&access_token=${token}`);
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
    metaFetch(`${BASE_URL}/${account_id}/campaigns?fields=name,id,effective_status,objective,daily_budget,lifetime_budget,budget_remaining,start_time,stop_time&limit=1000&access_token=${token}`),
    metaFetch(`${BASE_URL}/${account_id}/adsets?fields=name,id,effective_status,campaign_id,daily_budget,lifetime_budget,targeting,optimization_goal,billing_event&limit=1000&access_token=${token}`),
    metaFetch(`${BASE_URL}/${account_id}/ads?fields=name,id,effective_status,adset_id,campaign_id,creative{id,image_url,thumbnail_url}&limit=1000&access_token=${token}`),
  ]);

  return {
    campaigns: (campaigns.data || []) as any[],
    adsets: (adsets.data || []) as any[],
    ads: (ads.data || []) as any[],
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// WRITE OPERATIONS — update campaign / adset / ad via Meta Graph API
// All writes go through /api/meta with payload (form-encoded)
// ─────────────────────────────────────────────────────────────────────────────

async function metaWrite(objectId: string, token: string, fields: Record<string, string>): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch("/api/meta", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url: `${BASE_URL}/${objectId}`,
        payload: { access_token: token, ...fields },
      }),
    });
    const json = await res.json();
    if (json.error) return { success: false, error: json.error.message };
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e?.message || "Network error" };
  }
}

export const updateCampaign = (id: string, token: string, fields: {
  name?: string;
  status?: "ACTIVE" | "PAUSED" | "ARCHIVED";
  daily_budget?: number; // in cents
}) => {
  const payload: Record<string, string> = {};
  if (fields.name) payload.name = fields.name;
  if (fields.status) payload.status = fields.status;
  if (fields.daily_budget !== undefined) payload.daily_budget = String(fields.daily_budget);
  return metaWrite(id, token, payload);
};

export const updateAdset = (id: string, token: string, fields: {
  name?: string;
  status?: "ACTIVE" | "PAUSED" | "ARCHIVED";
  daily_budget?: number;
}) => {
  const payload: Record<string, string> = {};
  if (fields.name) payload.name = fields.name;
  if (fields.status) payload.status = fields.status;
  if (fields.daily_budget !== undefined) payload.daily_budget = String(fields.daily_budget);
  return metaWrite(id, token, payload);
};

export const updateAd = (id: string, token: string, fields: {
  name?: string;
  status?: "ACTIVE" | "PAUSED" | "ARCHIVED";
}) => {
  const payload: Record<string, string> = {};
  if (fields.name) payload.name = fields.name;
  if (fields.status) payload.status = fields.status;
  return metaWrite(id, token, payload);
};

// Batch status update
export const batchUpdateStatus = async (
  ids: string[],
  token: string,
  status: "ACTIVE" | "PAUSED" | "ARCHIVED"
): Promise<{ id: string; success: boolean; error?: string }[]> => {
  const results = await Promise.allSettled(
    ids.map(id => metaWrite(id, token, { status }))
  );
  return results.map((r, i) => ({
    id: ids[i],
    success: r.status === "fulfilled" ? r.value.success : false,
    error: r.status === "fulfilled" ? r.value.error : (r as PromiseRejectedResult).reason?.message,
  }));
};

// Fetch ads with full creative details for the creatives hub
export const fetchAdsWithCreatives = async (accountId: string, token: string): Promise<any[]> => {
  const id = normalizeAccountId(accountId);
  try {
    const url = `${BASE_URL}/${id}/ads?fields=id,name,effective_status,adset_id,campaign_id,creative{id,name,thumbnail_url,image_url,video_id,object_story_spec,body,title,call_to_action_type}&limit=50&access_token=${token}`;
    return await paginateAll(url, 10);
  } catch (e) {
    console.warn("[MetaAPI] fetchAdsWithCreatives failed:", e);
    return [];
  }
};

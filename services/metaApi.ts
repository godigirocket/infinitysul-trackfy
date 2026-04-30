import { MetaInsight, BreakdownInsight } from "@/types";

const BASE = "https://graph.facebook.com/v19.0";
const PROXY = "/api/meta";

// ── Core fetch via proxy ──────────────────────────────────────────────────
async function metaGet(url: string, attempt = 0): Promise<any> {
  const res = await fetch(PROXY, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  });
  const json = await res.json();

  // Retry transient / 504
  if ((res.status === 504 || json?.error?.is_transient) && attempt < 2) {
    await new Promise(r => setTimeout(r, (attempt + 1) * 2000));
    return metaGet(url, attempt + 1);
  }

  if (json.error) {
    console.error("[MetaAPI]", json.error);
    throw new Error(json.error.message || "Meta API error");
  }
  return json;
}

async function metaPost(objectId: string, token: string, fields: Record<string, string>): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch(PROXY, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url: `${BASE}/${objectId}`,
        method: "POST",
        payload: { access_token: token, ...fields },
      }),
    });
    const json = await res.json();
    if (json.error) return { success: false, error: json.error.message };
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e?.message };
  }
}

async function paginate(firstUrl: string, maxPages = 15): Promise<any[]> {
  let results: any[] = [];
  let url: string | null = firstUrl;
  let pages = 0;
  while (url && pages < maxPages) {
    const json = await metaGet(url);
    results = results.concat(json.data || []);
    url = json.paging?.next || null;
    pages++;
  }
  return results;
}

export const normalizeAccountId = (id: string) =>
  id && !id.startsWith("act_") ? `act_${id}` : id;

// ── INSIGHTS ─────────────────────────────────────────────────────────────
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
  const isMax = params.period === "maximum";
  const isShort = params.period === "today" || params.period === "yesterday";

  const fields = [
    "campaign_name", "campaign_id", "objective",
    "spend", "impressions", "clicks", "actions", "date_start", "date_stop",
  ];

  if (!params.breakdowns && !isMax && !(isShort && level === "ad")) {
    fields.push("frequency", "ctr");
  }
  if (!(level === "ad" && (isMax || isShort))) {
    fields.push("video_p25_watched_actions", "video_p50_watched_actions",
      "video_p75_watched_actions", "video_p100_watched_actions");
  }
  if (level === "adset" || level === "ad") fields.push("adset_name", "adset_id");
  if (level === "ad") {
    fields.push("ad_name", "ad_id");
    if (!isMax && !isShort) fields.push("quality_ranking");
  }

  const id = params.campaignId || normalizeAccountId(accountId);
  let q = `fields=${fields.join(",")}&access_token=${token}&limit=500&level=${level}`;

  if (params.customStart && params.customEnd) {
    q += `&time_range=${JSON.stringify({ since: params.customStart, until: params.customEnd })}`;
  } else if (params.period && params.period !== "custom") {
    q += `&date_preset=${params.period}`;
  }
  if (!params.breakdowns && !isMax) q += "&time_increment=1";
  if (params.breakdowns) q += `&breakdowns=${params.breakdowns}`;

  return paginate(`${BASE}/${id}/insights?${q}`);
};

// ── HOURLY HEATMAP ────────────────────────────────────────────────────────
export const fetchHourlyInsights = async (
  accountId: string,
  token: string,
  params: { period?: string; customStart?: string; customEnd?: string }
): Promise<any[]> => {
  // Skip maximum — too much data, causes timeouts
  if (params.period === "maximum") return [];

  const id = normalizeAccountId(accountId);
  const fields = "spend,impressions,clicks,actions,date_start";

  const buildUrl = (bd: string) => {
    let q = `fields=${fields}&access_token=${token}&limit=500&level=account&breakdowns=${bd}`;
    if (params.customStart && params.customEnd) {
      q += `&time_range=${JSON.stringify({ since: params.customStart, until: params.customEnd })}`;
    } else if (params.period && params.period !== "custom") {
      q += `&date_preset=${params.period}`;
    }
    return `${BASE}/${id}/insights?${q}`;
  };

  // Try advertiser TZ first, fall back to audience TZ
  const [advRes, audRes] = await Promise.allSettled([
    paginate(buildUrl("hourly_stats_aggregated_by_advertiser_time_zone"), 5),
    paginate(buildUrl("hourly_stats_aggregated_by_audience_time_zone"), 5),
  ]);

  const advData = advRes.status === "fulfilled" ? advRes.value : [];
  const audData = audRes.status === "fulfilled" ? audRes.value : [];

  const src = advData.length > 0 ? advData : audData;
  const field = advData.length > 0
    ? "hourly_stats_aggregated_by_advertiser_time_zone"
    : "hourly_stats_aggregated_by_audience_time_zone";

  return src.map(r => ({ ...r, _hourly_field: r[field] }));
};

// ── BREAKDOWNS ────────────────────────────────────────────────────────────
export const fetchBreakdowns = async (
  accountId: string,
  token: string,
  params: { period?: string; customStart?: string; customEnd?: string }
): Promise<{ age: BreakdownInsight[]; gender: BreakdownInsight[]; placement: BreakdownInsight[]; region: BreakdownInsight[] }> => {
  const id = normalizeAccountId(accountId);
  const fields = "spend,impressions,clicks,actions,date_start";

  const buildUrl = (bd: string) => {
    let q = `fields=${fields}&access_token=${token}&limit=500&level=account&breakdowns=${bd}`;
    if (params.customStart && params.customEnd) {
      q += `&time_range=${JSON.stringify({ since: params.customStart, until: params.customEnd })}`;
    } else if (params.period && params.period !== "custom") {
      q += `&date_preset=${params.period}`;
    }
    return `${BASE}/${id}/insights?${q}`;
  };

  const [ageR, genR, plcR, regR] = await Promise.allSettled([
    paginate(buildUrl("age"), 5),
    paginate(buildUrl("gender"), 5),
    paginate(buildUrl("publisher_platform,platform_position"), 5),
    paginate(buildUrl("region"), 5),
  ]);

  return {
    age: ageR.status === "fulfilled" ? ageR.value : [],
    gender: genR.status === "fulfilled" ? genR.value : [],
    placement: plcR.status === "fulfilled" ? plcR.value : [],
    region: regR.status === "fulfilled" ? regR.value : [],
  };
};

// ── ACCOUNT STRUCTURE ─────────────────────────────────────────────────────
export const fetchAccountStructure = async (accountId: string, token: string) => {
  const id = normalizeAccountId(accountId);
  const t = `access_token=${token}`;

  const [camps, adsets, ads] = await Promise.all([
    metaGet(`${BASE}/${id}/campaigns?${t}&fields=id,name,effective_status,objective,daily_budget,lifetime_budget,status&limit=1000`),
    metaGet(`${BASE}/${id}/adsets?${t}&fields=id,name,effective_status,campaign_id,daily_budget,lifetime_budget,optimization_goal,status&limit=1000`),
    metaGet(`${BASE}/${id}/ads?${t}&fields=id,name,effective_status,adset_id,campaign_id,creative{id,thumbnail_url,image_url,name}&limit=1000`),
  ]);

  return {
    campaigns: (camps.data || []) as any[],
    adsets: (adsets.data || []) as any[],
    ads: (ads.data || []) as any[],
  };
};

// ── CREATIVES HD ──────────────────────────────────────────────────────────
// For messaging/video campaigns: thumbnail_url is the only reliable field
export const fetchCreativesHD = async (accountId: string, token: string): Promise<Record<string, string>> => {
  const id = normalizeAccountId(accountId);
  const urlMap: Record<string, string> = {};

  let ads: any[] = [];
  try {
    // Request thumbnail_url first — works for ALL ad types (image, video, messaging)
    ads = await paginate(
      `${BASE}/${id}/ads?access_token=${token}&fields=id,creative{id,thumbnail_url,image_url,object_story_spec}&limit=100`,
      10
    );
  } catch {
    try {
      ads = await paginate(
        `${BASE}/${id}/ads?access_token=${token}&fields=id,creative{id,thumbnail_url}&limit=50`,
        10
      );
    } catch (e) {
      console.warn("[MetaAPI] fetchCreativesHD failed:", e);
      return {};
    }
  }

  for (const ad of ads) {
    const c = ad.creative;
    if (!c) continue;
    // thumbnail_url works for video + image + messaging ads
    const url = c.thumbnail_url
      || c.image_url
      || c.object_story_spec?.link_data?.image_url
      || c.object_story_spec?.photo_data?.url;
    if (url) urlMap[ad.id] = url;
  }

  return urlMap;
};

// ── WRITE OPERATIONS ──────────────────────────────────────────────────────
export const updateCampaign = (id: string, token: string, fields: {
  name?: string; status?: "ACTIVE" | "PAUSED" | "ARCHIVED"; daily_budget?: number;
}) => {
  const p: Record<string, string> = {};
  if (fields.name) p.name = fields.name;
  if (fields.status) p.status = fields.status;
  if (fields.daily_budget !== undefined) p.daily_budget = String(fields.daily_budget);
  return metaPost(id, token, p);
};

export const updateAdset = (id: string, token: string, fields: {
  name?: string; status?: "ACTIVE" | "PAUSED" | "ARCHIVED"; daily_budget?: number;
}) => {
  const p: Record<string, string> = {};
  if (fields.name) p.name = fields.name;
  if (fields.status) p.status = fields.status;
  if (fields.daily_budget !== undefined) p.daily_budget = String(fields.daily_budget);
  return metaPost(id, token, p);
};

export const updateAd = (id: string, token: string, fields: {
  name?: string; status?: "ACTIVE" | "PAUSED" | "ARCHIVED";
}) => {
  const p: Record<string, string> = {};
  if (fields.name) p.name = fields.name;
  if (fields.status) p.status = fields.status;
  return metaPost(id, token, p);
};

export const batchUpdateStatus = async (
  ids: string[], token: string, status: "ACTIVE" | "PAUSED" | "ARCHIVED"
) => {
  const results = await Promise.allSettled(ids.map(id => metaPost(id, token, { status })));
  return results.map((r, i) => ({
    id: ids[i],
    success: r.status === "fulfilled" ? r.value.success : false,
    error: r.status === "fulfilled" ? r.value.error : (r as PromiseRejectedResult).reason?.message,
  }));
};

// Legacy alias
export const fetchAdThumbnails = async (id: string, token: string): Promise<string | null> => {
  try {
    const json = await metaGet(`${BASE}/${id}?fields=creative{thumbnail_url,image_url}&access_token=${token}`);
    const c = json.creative;
    return c?.thumbnail_url || c?.image_url || null;
  } catch { return null; }
};

import { MetaInsight } from "@/types";

const API_VERSION = "v19.0";
const BASE_URL = `https://graph.facebook.com/${API_VERSION}`;

const normalizeAccountId = (id: string): string => {
  if (!id) return id;
  return id.startsWith("act_") ? id : `act_${id}`;
};

/**
 * Fetches performance insights from Meta Ads API.
 * NEVER includes object-level fields like adcreatives here — those go in fetchAccountStructure.
 */
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

  // ── ONLY valid Insights API fields ──
  const fieldsArr = [
    "campaign_name",
    "campaign_id",
    "objective",
    "account_currency",
    "spend",
    "impressions",
    "frequency",
    "clicks",
    "ctr",
    "actions",
    "video_p25_watched_actions",
    "video_p50_watched_actions",
    "video_p75_watched_actions",
    "video_p100_watched_actions",
    "video_avg_time_watched_actions",
    "date_start",
  ];

  if (level === "adset" || level === "ad") {
    fieldsArr.push("adset_name", "adset_id");
  }

  if (level === "ad") {
    fieldsArr.push("ad_name", "ad_id", "quality_ranking", "video_30_sec_watched_actions");
  }

  const fields = fieldsArr.join(",");
  const id = params.campaignId || normalizeAccountId(accountId);
  let urlParams = `fields=${fields}&access_token=${token}&limit=1000&level=${level}`;

  if (params.customStart && params.customEnd) {
    const time_range = JSON.stringify({ since: params.customStart, until: params.customEnd });
    urlParams += `&time_range=${time_range}`;
  } else if (params.period && params.period !== "custom") {
    urlParams += `&date_preset=${params.period}`;
  }

  if (!params.breakdowns && params.period !== "maximum") {
    urlParams += "&time_increment=1";
  }

  if (params.breakdowns) {
    urlParams += `&breakdowns=${params.breakdowns}`;
  }

  const url = `${BASE_URL}/${id}/insights?${urlParams}`;
  const response = await fetch(url);
  const json = await response.json();

  if (json.error) {
    console.error(`[MetaAPI] Error level=${level}:`, json.error);
    throw new Error(json.error.message);
  }

  return json.data || [];
};

/**
 * Fetches thumbnail for a specific ad using its object endpoint (NOT insights).
 */
export const fetchAdThumbnails = async (id: string, token: string) => {
  let url = null;

  // Path 1: Ad object → adcreatives edge (prefer image_url for HD)
  try {
    const adRes = await fetch(`${BASE_URL}/${id}?fields=adcreatives{image_url,thumbnail_url,picture,full_picture}&access_token=${token}`);
    const adJson = await adRes.json();
    const creative = adJson.adcreatives?.data?.[0];
    // Prefer full_picture > picture > image_url > thumbnail_url (descending quality)
    url = creative?.full_picture || creative?.picture || creative?.image_url || creative?.thumbnail_url;
  } catch (e) {}

  // Path 2: Ad object → creative field
  if (!url) {
    try {
      const res = await fetch(`${BASE_URL}/${id}?fields=creative{image_url,thumbnail_url,picture,full_picture}&access_token=${token}`);
      const json = await res.json();
      url = json.creative?.full_picture || json.creative?.picture || json.creative?.image_url || json.creative?.thumbnail_url;
    } catch (e) {}
  }

  // Path 3: If it's a campaign/adset, get its first ad's creative
  if (!url) {
    try {
      const res = await fetch(`${BASE_URL}/${id}/ads?fields=adcreatives{image_url,thumbnail_url,picture,full_picture}&limit=1&access_token=${token}`);
      const json = await res.json();
      const creative = json.data?.[0]?.adcreatives?.data?.[0];
      if (creative) url = creative.full_picture || creative.picture || creative.image_url || creative.thumbnail_url;
    } catch (e) {}
  }

  return url || null;
};

/**
 * Fetches account hierarchy (campaigns, adsets, ads) with creative thumbnails on ads.
 * adcreatives is valid on Ad OBJECTS — just not on Insights.
 */
export const fetchAccountStructure = async (accountId: string, token: string) => {
  const account_id = normalizeAccountId(accountId);

  const [campaigns, adsets, ads] = await Promise.all([
    fetch(`${BASE_URL}/${account_id}/campaigns?fields=name,id,effective_status,objective&limit=1000&access_token=${token}`).then(r => r.json()),
    fetch(`${BASE_URL}/${account_id}/adsets?fields=name,id,effective_status,campaign_id&limit=1000&access_token=${token}`).then(r => r.json()),
    fetch(`${BASE_URL}/${account_id}/ads?fields=name,id,effective_status,adset_id,campaign_id,adcreatives{thumbnail_url,image_url,picture,full_picture,body,title}&limit=1000&access_token=${token}`).then(r => r.json()),
  ]);

  return {
    campaigns: (campaigns.data || []) as any[],
    adsets: (adsets.data || []) as any[],
    ads: (ads.data || []) as any[],
  };
};

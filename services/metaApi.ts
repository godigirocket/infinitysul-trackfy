import { MetaInsight } from "@/types";

const API_VERSION = "v19.0";
const BASE_URL = `https://graph.facebook.com/${API_VERSION}`;

export const fetchMetaInsights = async (
  accountId: string,
  token: string,
  params: {
    period?: string;
    customStart?: string;
    customEnd?: string;
    level?: "campaign" | "ad";
    campaignId?: string;
    breakdowns?: string;
  }
): Promise<MetaInsight[]> => {
  const fields = [
    "campaign_name",
    "campaign_id",
    "campaign_status",
    "ad_id",
    "ad_name",
    "spend",
    "impressions",
    "frequency",
    "clicks",
    "ctr",
    "quality_ranking",
    "actions",
    "video_30_sec_watched_actions",
    "video_p25_watched_actions",
    "video_p50_watched_actions",
    "video_p75_watched_actions",
    "video_p100_watched_actions",
    "video_avg_time_watched_actions",
    "date_start",
  ].join(",");

  const id = params.campaignId || accountId;
  let urlParams = `fields=${fields}&access_token=${token}&limit=500`;

  if (params.level) {
    urlParams += `&level=${params.level}`;
  } else {
    urlParams += `&level=campaign`;
  }

  if (params.customStart && params.customEnd) {
    urlParams += `&time_range={'since':'${params.customStart}','until':'${params.customEnd}'}`;
  } else if (params.period && params.period !== "custom") {
    urlParams += `&date_preset=${params.period}`;
  }

  if (params.level === "campaign" || !params.level) {
    if (!params.breakdowns) {
      urlParams += "&time_increment=1";
    }
  }

  if (params.breakdowns) {
    urlParams += `&breakdowns=${params.breakdowns}`;
  }

  const response = await fetch(`${BASE_URL}/${id}/insights?${urlParams}`);
  const json = await response.json();

  if (json.error) {
    throw new Error(json.error.message);
  }

  return json.data || [];
};

export const fetchAdCreatives = async (adId: string, token: string) => {
  const response = await fetch(
    `${BASE_URL}/${adId}?fields=adcreatives{thumbnail_url,body}&access_token=${token}`
  );
  const json = await response.json();
  return json.adcreatives?.data?.[0] || null;
};

export const fetchAdThumbnails = async (campaignId: string, token: string) => {
  const response = await fetch(
    `${BASE_URL}/${campaignId}/ads?fields=adcreatives{thumbnail_url}&limit=1&access_token=${token}`
  );
  const json = await response.json();
  return json.data?.[0]?.adcreatives?.data?.[0]?.thumbnail_url || null;
};

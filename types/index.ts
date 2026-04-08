export interface MetaAction {
  action_type: string;
  value: string;
}

export interface MetaInsight {
  campaign_id: string;
  campaign_name: string;
  adset_id?: string;
  adset_name?: string;
  ad_id?: string;
  ad_name?: string;
  objective?: string;
  account_currency?: string;
  spend: string;
  impressions: string;
  frequency?: string;
  clicks: string;
  unique_clicks?: string;
  ctr: string;
  quality_ranking?: string;
  actions?: MetaAction[];
  video_30_sec_watched_actions?: MetaAction[];
  video_p25_watched_actions?: MetaAction[];
  video_p50_watched_actions?: MetaAction[];
  video_p75_watched_actions?: MetaAction[];
  video_p100_watched_actions?: MetaAction[];
  video_avg_time_watched_actions?: MetaAction[];
  date_start: string;
  hourly_stats_aggregated_by_audience_time_zone?: string;
}

/** A MetaInsight row enriched with a breakdown dimension (age, gender, placement, platform) */
export interface BreakdownInsight extends MetaInsight {
  age?: string;                   // e.g. "35-44"
  gender?: string;                // "male" | "female" | "unknown"
  publisher_platform?: string;    // "facebook" | "instagram" | "audience_network"
  platform_position?: string;     // "feed" | "story" | "reels"
  region?: string;                // e.g. "California" | "São Paulo"
}

export interface CRMLead {
  lead_id: string;
  campaign_id: string;
  status: 'new' | 'contacted' | 'converted' | 'lost';
  sale_value?: number;
  date: string;
}

export interface AppState {
  token: string;
  accountId: string;
  geminiKey: string;
  isDirectorMode: boolean;
  annotations: Record<string, string>;
  campaignTags: Record<string, string[]>;
  crmLeads: CRMLead[];
  period: string;
  customStart: string;
  customEnd: string;
  isCompare: boolean;
  dataA: MetaInsight[];
  dataB: MetaInsight[];
  dataAds: MetaInsight[];
  hourlyDataA: MetaInsight[];
  hourlyDataB: MetaInsight[];
  ageBreakdownA: BreakdownInsight[];
  genderBreakdownA: BreakdownInsight[];
  placementBreakdownA: BreakdownInsight[];
  regionBreakdownA: BreakdownInsight[];
  biData: any[]; // External BI records (CSV/Sheets)
  searchQuery: string;
  statusFilter: string;
  selectedCampaigns: string[];
  selectedAdSets: string[];
  selectedAds: string[];
  statusFilters: string[];
  objectiveFilters: string[];
  placementFilters: string[];
  ageFilters: string[];
  genderFilters: string[];
  isLoading: boolean;
  lastSync: string | null;
  intelProductFilter: string;
  intelCampaignFilter: string;
  intelSignalFilter: string;
  hierarchy: AccountHierarchy | null;
}

export interface AdCreative {
  thumbnail_url: string;
  body: string;
}

export interface KpiTotals {
  spend: number;
  leads: number;
  conversations: number;
  registrations: number;
  impressions: number;
  clicks: number;
}

export interface CampaignIntel {
  campaign_id: string;
  campaign_name: string;
  product: string; // Auto-extracted token from campaign name
  spend: number;
  impressions: number;
  clicks: number;
  leads: number;
  conversations: number;
  cpl: number;
  ctr: number;
  frequency: number;
  signal: 'scale' | 'monitor' | 'optimize';
  signalReason: string;
  cplVsAvg: number; // % difference from account average CPL
  funnelDrop: number; // % drop from clicks to leads
}

export interface IntelFilters {
  products: string[];     // Auto-parsed from campaign names
  campaigns: string[];    // All campaign names
  placements: string[];   // From Meta breakdowns (future)
}

export interface CampaignStatus { id: string; name: string; effective_status: string; objective?: string; }
export interface AdSetStatus { id: string; name: string; effective_status: string; campaign_id: string; }
export interface AdStatus { id: string; name: string; effective_status: string; adset_id: string; campaign_id: string; adcreatives?: { data: any[] }; }

export interface AccountHierarchy {
  campaigns: CampaignStatus[];
  adsets: AdSetStatus[];
  ads: AdStatus[];
}

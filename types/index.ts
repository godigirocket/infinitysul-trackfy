export interface MetaAction {
  action_type: string;
  value: string;
}

export interface MetaInsight {
  campaign_id: string;
  campaign_name: string;
  campaign_status?: string;
  ad_id?: string;
  ad_name?: string;
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
  video_avg_time_watched_actions?: MetaAction[];
  date_start: string;
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
  targetLeads: number;
  targetCPA: number;
  productPrice: number;
  monthlyBudget: number;
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
  hourlyDataA: MetaInsight[];
  hourlyDataB: MetaInsight[];
  searchQuery: string;
  statusFilter: string;
  selectedCampaigns: string[];
  isLoading: boolean;
  lastSync: string | null;
  intelProductFilter: string;  // Dynamic — auto-populated from campaign names
  intelCampaignFilter: string;
  intelSignalFilter: string;   // 'all' | 'scale' | 'monitor' | 'optimize'
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

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
  annotations: Record<string, string>; // date (YYYY-MM-DD): text
  campaignTags: Record<string, string[]>; // campaign_id: tags[]
  crmLeads: CRMLead[];
  period: string; // 'last_30d', 'last_7d', 'today', 'maximum'
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

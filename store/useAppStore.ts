import { create } from "zustand";
import { AppState, MetaInsight, CRMLead, BreakdownInsight, AccountHierarchy } from "@/types";

// Keys that get saved to localStorage
const PERSIST_KEYS = [
  "token", "accountId", "geminiKey", "isDirectorMode",
  "annotations", "campaignTags", "crmLeads",
  "selectedCampaigns", "selectedAdSets", "selectedAds",
  "statusFilters", "objectiveFilters", "placementFilters",
  "ageFilters", "genderFilters",
] as const;

const STORAGE_KEY = "tf-store";

interface AppStore extends AppState {
  creativesHD: Record<string, string>;
  setCreativesHD: (map: Record<string, string>) => void;
  setToken: (token: string) => void;
  setAccountId: (id: string) => void;
  setGeminiKey: (key: string) => void;
  setPeriod: (period: string) => void;
  setCustomRange: (start: string, end: string) => void;
  setIsCompare: (val: boolean) => void;
  setLoading: (val: boolean) => void;
  setData: (dataA: MetaInsight[], dataB?: MetaInsight[]) => void;
  setDataAds: (data: MetaInsight[]) => void;
  setHourlyData: (dataA: MetaInsight[], dataB?: MetaInsight[]) => void;
  setBreakdownData: (a: BreakdownInsight[], g: BreakdownInsight[], p: BreakdownInsight[], r?: BreakdownInsight[]) => void;
  setBiData: (data: any[]) => void;
  setSearchQuery: (query: string) => void;
  setStatusFilter: (status: string) => void;
  setSelectedCampaigns: (ids: string[]) => void;
  setSelectedAdSets: (ids: string[]) => void;
  setSelectedAds: (ids: string[]) => void;
  setStatusFilters: (vals: string[]) => void;
  setObjectiveFilters: (vals: string[]) => void;
  setPlacementFilters: (vals: string[]) => void;
  setAgeFilters: (vals: string[]) => void;
  setGenderFilters: (vals: string[]) => void;
  setIsDirectorMode: (val: boolean) => void;
  setAnnotation: (date: string, text: string) => void;
  setCampaignTag: (campaignId: string, tags: string[]) => void;
  updateCRMLead: (lead: CRMLead) => void;
  setLastSync: (time: string) => void;
  setIntelProductFilter: (val: string) => void;
  setIntelCampaignFilter: (val: string) => void;
  setIntelSignalFilter: (val: string) => void;
  setHierarchy: (hierarchy: AccountHierarchy) => void;
  // Optimistic hierarchy mutations
  updateHierarchyCampaign: (id: string, patch: Partial<any>) => void;
  updateHierarchyAdset: (id: string, patch: Partial<any>) => void;
  updateHierarchyAd: (id: string, patch: Partial<any>) => void;
  drawerCampaignId: string | null;
  setDrawerCampaignId: (id: string | null) => void;
  apiError: string | null;
  setApiError: (err: string | null) => void;
  _hydrate: () => void;
}

export const useAppStore = create<AppStore>()((set, get) => ({
  // ── persisted defaults ──
  token: "",
  accountId: "",
  geminiKey: "",
  isDirectorMode: false,
  annotations: {},
  campaignTags: {},
  crmLeads: [],
  selectedCampaigns: [],
  selectedAdSets: [],
  selectedAds: [],
  statusFilters: [],
  objectiveFilters: [],
  placementFilters: [],
  ageFilters: [],
  genderFilters: [],

  // ── session-only defaults ──
  period: "last_30d",
  customStart: "",
  customEnd: "",
  isCompare: false,
  dataA: [],
  dataB: [],
  dataAds: [],
  hourlyDataA: [],
  hourlyDataB: [],
  ageBreakdownA: [],
  genderBreakdownA: [],
  placementBreakdownA: [],
  regionBreakdownA: [],
  biData: [],
  searchQuery: "",
  statusFilter: "all",
  isLoading: false,
  lastSync: null,
  intelProductFilter: "all",
  intelCampaignFilter: "all",
  intelSignalFilter: "all",
  hierarchy: null,
  apiError: null,
  drawerCampaignId: null,
  creativesHD: {},

  // ── actions ──
  setCreativesHD: (creativesHD) => set({ creativesHD }),
  setDrawerCampaignId: (drawerCampaignId) => set({ drawerCampaignId }),
  setApiError: (apiError) => set({ apiError }),
  setToken: (token) => {
    set({ token });
    _save({ token });
  },
  setAccountId: (accountId) => {
    set({ accountId });
    _save({ accountId });
  },
  setGeminiKey: (geminiKey) => {
    set({ geminiKey });
    _save({ geminiKey });
  },
  setIsDirectorMode: (isDirectorMode) => {
    set({ isDirectorMode });
    _save({ isDirectorMode });
  },
  setAnnotation: (date, text) =>
    set((s) => {
      const annotations = { ...s.annotations, [date]: text };
      _save({ annotations });
      return { annotations };
    }),
  setCampaignTag: (campaignId, tags) =>
    set((s) => {
      const campaignTags = { ...s.campaignTags, [campaignId]: tags };
      _save({ campaignTags });
      return { campaignTags };
    }),
  updateCRMLead: (lead) =>
    set((s) => {
      const idx = s.crmLeads.findIndex((l) => l.lead_id === lead.lead_id);
      const crmLeads = [...s.crmLeads];
      if (idx > -1) crmLeads[idx] = lead; else crmLeads.push(lead);
      _save({ crmLeads });
      return { crmLeads };
    }),
  setPeriod: (period) => set({ period, customStart: "", customEnd: "" }),
  setCustomRange: (customStart, customEnd) => set({ customStart, customEnd, period: "custom" }),
  setIsCompare: (isCompare) => set({ isCompare }),
  setLoading: (isLoading) => set({ isLoading }),
  setData: (dataA, dataB = []) => set({ dataA, dataB }),
  setDataAds: (dataAds) => set({ dataAds }),
  setHourlyData: (hourlyDataA, hourlyDataB = []) => set({ hourlyDataA, hourlyDataB }),
  setBreakdownData: (ageBreakdownA, genderBreakdownA, placementBreakdownA, regionBreakdownA = []) =>
    set({ ageBreakdownA, genderBreakdownA, placementBreakdownA, regionBreakdownA }),
  setBiData: (biData) => set({ biData }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setStatusFilter: (statusFilter) => set({ statusFilter }),
  setSelectedCampaigns: (selectedCampaigns) => { set({ selectedCampaigns }); _save({ selectedCampaigns }); },
  setSelectedAdSets: (selectedAdSets) => { set({ selectedAdSets }); _save({ selectedAdSets }); },
  setSelectedAds: (selectedAds) => { set({ selectedAds }); _save({ selectedAds }); },
  setStatusFilters: (statusFilters) => { set({ statusFilters }); _save({ statusFilters }); },
  setObjectiveFilters: (objectiveFilters) => { set({ objectiveFilters }); _save({ objectiveFilters }); },
  setPlacementFilters: (placementFilters) => { set({ placementFilters }); _save({ placementFilters }); },
  setAgeFilters: (ageFilters) => { set({ ageFilters }); _save({ ageFilters }); },
  setGenderFilters: (genderFilters) => { set({ genderFilters }); _save({ genderFilters }); },
  setLastSync: (lastSync) => set({ lastSync }),
  setIntelProductFilter: (intelProductFilter) => set({ intelProductFilter }),
  setIntelCampaignFilter: (intelCampaignFilter) => set({ intelCampaignFilter }),
  setIntelSignalFilter: (intelSignalFilter) => set({ intelSignalFilter }),
  setHierarchy: (hierarchy) => set({ hierarchy }),
  updateHierarchyCampaign: (id, patch) =>
    set((s) => {
      if (!s.hierarchy) return {};
      return {
        hierarchy: {
          ...s.hierarchy,
          campaigns: s.hierarchy.campaigns.map(c => c.id === id ? { ...c, ...patch } : c),
        },
      };
    }),
  updateHierarchyAdset: (id, patch) =>
    set((s) => {
      if (!s.hierarchy) return {};
      return {
        hierarchy: {
          ...s.hierarchy,
          adsets: s.hierarchy.adsets.map(a => a.id === id ? { ...a, ...patch } : a),
        },
      };
    }),
  updateHierarchyAd: (id, patch) =>
    set((s) => {
      if (!s.hierarchy) return {};
      return {
        hierarchy: {
          ...s.hierarchy,
          ads: s.hierarchy.ads.map(a => a.id === id ? { ...a, ...patch } : a),
        },
      };
    }),

  // ── client-side hydration from localStorage ──
  _hydrate: () => {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw) as Partial<AppStore>;
      const patch: Partial<AppStore> = {};
      for (const key of PERSIST_KEYS) {
        if (saved[key] !== undefined) (patch as any)[key] = saved[key];
      }
      if (Object.keys(patch).length > 0) set(patch as any);
    } catch {}
  },
}));

// Save only persisted keys to localStorage
function _save(patch: Partial<AppStore>) {
  if (typeof window === "undefined") return;
  try {
    const current = useAppStore.getState();
    const toSave: any = {};
    for (const key of PERSIST_KEYS) toSave[key] = (current as any)[key];
    Object.assign(toSave, patch);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
  } catch {}
}

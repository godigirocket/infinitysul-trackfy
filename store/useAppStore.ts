import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { AppState, MetaInsight, CRMLead, BreakdownInsight, AccountHierarchy } from "@/types";

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
  setBreakdownData: (
    ageA: BreakdownInsight[],
    genderA: BreakdownInsight[],
    placementA: BreakdownInsight[],
    regionA?: BreakdownInsight[]
  ) => void;
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
  drawerCampaignId: string | null;
  setDrawerCampaignId: (id: string | null) => void;
  apiError: string | null;
  setApiError: (err: string | null) => void;
}

export const useAppStore = create<AppStore>()(
  persist(
    (set) => ({      token: "",
      accountId: "",
      geminiKey: "",
      isDirectorMode: false,
      annotations: {},
      campaignTags: {},
      crmLeads: [],
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
      selectedCampaigns: [],
      selectedAdSets: [],
      selectedAds: [],
      statusFilters: [],
      objectiveFilters: [],
      placementFilters: [],
      ageFilters: [],
      genderFilters: [],
      isLoading: false,
      lastSync: null,
      intelProductFilter: 'all',
      intelCampaignFilter: 'all',
      intelSignalFilter: 'all',
      hierarchy: null,
      apiError: null,
      drawerCampaignId: null,
      creativesHD: {},
      setCreativesHD: (creativesHD) => set({ creativesHD }),
      setDrawerCampaignId: (drawerCampaignId) => set({ drawerCampaignId }),
      setApiError: (apiError) => set({ apiError }),
      setToken: (token) => set({ token }),
      setAccountId: (accountId) => set({ accountId }),
      setGeminiKey: (geminiKey) => set({ geminiKey }),
      setIsDirectorMode: (isDirectorMode) => set({ isDirectorMode }),
      setAnnotation: (date, text) => set((state) => ({ 
        annotations: { ...state.annotations, [date]: text } 
      })),
      setCampaignTag: (campaignId, tags) => set((state) => ({
        campaignTags: { ...state.campaignTags, [campaignId]: tags }
      })),
      updateCRMLead: (lead) => set((state) => {
        const existing = state.crmLeads.findIndex(l => l.lead_id === lead.lead_id);
        const newList = [...state.crmLeads];
        if (existing > -1) newList[existing] = lead;
        else newList.push(lead);
        return { crmLeads: newList };
      }),
      setPeriod: (period) => set({ period, customStart: "", customEnd: "" }),
      setCustomRange: (customStart, customEnd) =>
        set({ customStart, customEnd, period: "custom" }),
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
      setSelectedCampaigns: (selectedCampaigns) => set({ selectedCampaigns }),
      setSelectedAdSets: (selectedAdSets) => set({ selectedAdSets }),
      setSelectedAds: (selectedAds) => set({ selectedAds }),
      setStatusFilters: (statusFilters) => set({ statusFilters }),
      setObjectiveFilters: (objectiveFilters) => set({ objectiveFilters }),
      setPlacementFilters: (placementFilters) => set({ placementFilters }),
      setAgeFilters: (ageFilters) => set({ ageFilters }),
      setGenderFilters: (genderFilters) => set({ genderFilters }),
      setLastSync: (lastSync) => set({ lastSync }),
      setIntelProductFilter: (intelProductFilter) => set({ intelProductFilter }),
      setIntelCampaignFilter: (intelCampaignFilter) => set({ intelCampaignFilter }),
      setIntelSignalFilter: (intelSignalFilter) => set({ intelSignalFilter }),
      setHierarchy: (hierarchy) => set({ hierarchy }),
    }),
    {
      name: "tf-store",
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      partialize: (state) => ({
        token: state.token,
        accountId: state.accountId,
        geminiKey: state.geminiKey,
        isDirectorMode: state.isDirectorMode,
        annotations: state.annotations,
        campaignTags: state.campaignTags,
        crmLeads: state.crmLeads,
        selectedCampaigns: state.selectedCampaigns,
        selectedAdSets: state.selectedAdSets,
        selectedAds: state.selectedAds,
        statusFilters: state.statusFilters,
        objectiveFilters: state.objectiveFilters,
        placementFilters: state.placementFilters,
        ageFilters: state.ageFilters,
        genderFilters: state.genderFilters,
      }),
    }
  )
);

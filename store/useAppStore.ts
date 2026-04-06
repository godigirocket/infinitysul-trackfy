import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { AppState, MetaInsight, CRMLead } from "@/types";

interface AppStore extends AppState {
  setToken: (token: string) => void;
  setAccountId: (id: string) => void;
  setGeminiKey: (key: string) => void;
  setTargetLeads: (val: number) => void;
  setPeriod: (period: string) => void;
  setCustomRange: (start: string, end: string) => void;
  setIsCompare: (val: boolean) => void;
  setLoading: (val: boolean) => void;
  setData: (dataA: MetaInsight[], dataB?: MetaInsight[]) => void;
  setHourlyData: (dataA: MetaInsight[], dataB?: MetaInsight[]) => void;
  setSearchQuery: (query: string) => void;
  setStatusFilter: (status: string) => void;
  setSelectedCampaigns: (ids: string[]) => void;
  setTargetCPA: (val: number) => void;
  setProductPrice: (val: number) => void;
  setMonthlyBudget: (val: number) => void;
  setIsDirectorMode: (val: boolean) => void;
  setAnnotation: (date: string, text: string) => void;
  setCampaignTag: (campaignId: string, tags: string[]) => void;
  updateCRMLead: (lead: CRMLead) => void;
  setLastSync: (time: string) => void;
}

export const useAppStore = create<AppStore>()(
  persist(
    (set) => ({
      token: "",
      accountId: "",
      geminiKey: "",
      targetLeads: 50,
      targetCPA: 25,
      productPrice: 100,
      monthlyBudget: 5000,
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
      hourlyDataA: [],
      hourlyDataB: [],
      searchQuery: "",
      statusFilter: "all",
      selectedCampaigns: [],
      isLoading: false,
      lastSync: null,

      setToken: (token) => set({ token }),
      setAccountId: (accountId) => set({ accountId }),
      setGeminiKey: (geminiKey) => set({ geminiKey }),
      setTargetLeads: (targetLeads) => set({ targetLeads }),
      setTargetCPA: (targetCPA) => set({ targetCPA }),
      setProductPrice: (productPrice) => set({ productPrice }),
      setMonthlyBudget: (monthlyBudget) => set({ monthlyBudget }),
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
      setHourlyData: (hourlyDataA, hourlyDataB = []) => set({ hourlyDataA, hourlyDataB }),
      setSearchQuery: (searchQuery) => set({ searchQuery }),
      setStatusFilter: (statusFilter) => set({ statusFilter }),
      setSelectedCampaigns: (selectedCampaigns) => set({ selectedCampaigns }),
      setLastSync: (lastSync) => set({ lastSync }),
    }),
    {
      name: "tf-store",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        token: state.token,
        accountId: state.accountId,
        geminiKey: state.geminiKey,
        targetLeads: state.targetLeads,
        targetCPA: state.targetCPA,
        productPrice: state.productPrice,
        monthlyBudget: state.monthlyBudget,
        isDirectorMode: state.isDirectorMode,
        annotations: state.annotations,
        campaignTags: state.campaignTags,
        crmLeads: state.crmLeads,
      }),
    }
  )
);

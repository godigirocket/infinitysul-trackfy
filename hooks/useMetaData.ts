"use client";

import { useEffect } from "react";
import { useAppStore } from "@/store/useAppStore";
import {
  fetchMetaInsights,
  fetchHourlyInsights,
  fetchBreakdowns,
  fetchCreativesHD,
  fetchAccountStructure,
} from "@/services/metaApi";
import { fetchSupabaseLeads } from "@/lib/supabase";

// Global flag — only one fetch runs at a time across all component instances
let isFetching = false;
let lastFetchKey = "";
let currentAbortController: AbortController | null = null;

export async function runRefresh() {
  const { token, accountId, period, customStart, customEnd, isCompare } =
    useAppStore.getState();

  if (!token || !accountId) return;

  const key = `${token}|${accountId}|${period}|${customStart}|${customEnd}|${isCompare}`;
  if (isFetching) return;
  if (key === lastFetchKey) return;

  // Cancel any previous in-flight request
  if (currentAbortController) currentAbortController.abort();
  currentAbortController = new AbortController();

  isFetching = true;
  lastFetchKey = key;

  const s = useAppStore.getState();
  s.setLoading(true);
  s.setApiError(null);

  try {
    const timeParams = { period, customStart, customEnd };

    const [campaignRes, adRes, hourlyRes] = await Promise.allSettled([
      fetchMetaInsights(accountId, token, { ...timeParams, level: "campaign" }),
      fetchMetaInsights(accountId, token, { ...timeParams, level: "ad" }),
      fetchHourlyInsights(accountId, token, timeParams),
    ]);

    const dataA = campaignRes.status === "fulfilled" ? campaignRes.value : [];
    const dataAds = adRes.status === "fulfilled" ? adRes.value : [];
    const hourlyA = hourlyRes.status === "fulfilled" ? hourlyRes.value : [];

    if (dataA.length === 0 && dataAds.length === 0) {
      const err = [campaignRes, adRes].find(
        (r) => r.status === "rejected"
      ) as PromiseRejectedResult | undefined;
      if (err) throw err.reason;
    }

    let dataB: any[] = [];
    let hourlyB: any[] = [];
    if (isCompare && dataA.length > 0) {
      const largerPeriod = period === "last_7d" ? "last_14d" : "last_90d";
      const [fullDataRes, fullHourlyRes] = await Promise.allSettled([
        fetchMetaInsights(accountId, token, { period: largerPeriod, level: "campaign" }),
        fetchHourlyInsights(accountId, token, { period: largerPeriod }),
      ]);
      const minDateA = [...new Set(dataA.map((d) => d.date_start))].sort()[0];
      if (minDateA) {
        if (fullDataRes.status === "fulfilled")
          dataB = fullDataRes.value.filter(
            (d) => new Date(d.date_start) < new Date(minDateA)
          );
        if (fullHourlyRes.status === "fulfilled")
          hourlyB = fullHourlyRes.value.filter(
            (d) => new Date(d.date_start) < new Date(minDateA)
          );
      }
    }

    const [breakdownsRes, creativesRes, hierarchyRes, supabaseRes] =
      await Promise.allSettled([
        fetchBreakdowns(accountId, token, timeParams),
        fetchCreativesHD(accountId, token),
        fetchAccountStructure(accountId, token),
        fetchSupabaseLeads().catch(() => []),
      ]);

    const store = useAppStore.getState();
    store.setData(dataA, dataB);
    store.setDataAds(dataAds);
    store.setHourlyData(hourlyA, hourlyB);

    if (breakdownsRes.status === "fulfilled") {
      const bd = breakdownsRes.value;
      store.setBreakdownData(bd.age, bd.gender, bd.placement, bd.region);
    } else {
      store.setBreakdownData([], [], [], []);
    }

    if (creativesRes.status === "fulfilled") store.setCreativesHD(creativesRes.value);
    if (hierarchyRes.status === "fulfilled") store.setHierarchy(hierarchyRes.value as any);

    if (supabaseRes.status === "fulfilled") {
      const leads = supabaseRes.value as any[];
      if (leads.length > 0) {
        const cur = useAppStore.getState();
        const existingIds = new Set(cur.crmLeads.map((l) => l.lead_id));
        const newLeads = leads.filter((l: any) => !existingIds.has(l.lead_id));
        if (newLeads.length > 0)
          useAppStore.setState({ crmLeads: [...cur.crmLeads, ...newLeads] });
      }
    }

    useAppStore.getState().setLastSync(new Date().toLocaleTimeString());
  } catch (error: any) {
    // Don't report aborted requests as errors
    if (error?.name === "AbortError") {
      isFetching = false;
      return;
    }
    console.error("[MetaAPI] Fatal error:", error);
    useAppStore
      .getState()
      .setApiError(error?.message || "Erro desconhecido na API do Facebook");
  } finally {
    isFetching = false;
    currentAbortController = null;
    useAppStore.getState().setLoading(false);
  }
}

export function useMetaData() {
  const token = useAppStore((s) => s.token);
  const accountId = useAppStore((s) => s.accountId);
  const period = useAppStore((s) => s.period);
  const customStart = useAppStore((s) => s.customStart);
  const customEnd = useAppStore((s) => s.customEnd);
  const isCompare = useAppStore((s) => s.isCompare);

  useEffect(() => {
    runRefresh();
  }, [token, accountId, period, customStart, customEnd, isCompare]);

  return { refresh: runRefresh };
}

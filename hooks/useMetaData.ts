"use client";

import { useEffect, useCallback } from "react";
import { useAppStore } from "@/store/useAppStore";
import {
  fetchMetaInsights,
  fetchHourlyInsights,
  fetchBreakdowns,
  fetchCreativesHD,
  fetchAccountStructure,
} from "@/services/metaApi";
import { fetchSupabaseLeads } from "@/lib/supabase";

export function useMetaData() {
  const {
    token,
    accountId,
    period,
    customStart,
    customEnd,
    isCompare,
    setLoading,
    setData,
    setDataAds,
    setHourlyData,
    setBreakdownData,
    setLastSync,
    setHierarchy,
    setApiError,
    setCreativesHD,
  } = useAppStore();

  const refresh = useCallback(async () => {
    if (!token || !accountId) return;

    setLoading(true);
    setApiError(null);

    try {
      const timeParams = { period, customStart, customEnd };

      // Run all primary calls in parallel — each isolated so one failure doesn't kill others
      const [campaignRes, adRes, hourlyRes] = await Promise.allSettled([
        fetchMetaInsights(accountId, token, { ...timeParams, level: "campaign" }),
        fetchMetaInsights(accountId, token, { ...timeParams, level: "ad" }),
        fetchHourlyInsights(accountId, token, timeParams),
      ]);

      const dataA = campaignRes.status === "fulfilled" ? campaignRes.value : [];
      const dataAds = adRes.status === "fulfilled" ? adRes.value : [];
      const hourlyA = hourlyRes.status === "fulfilled" ? hourlyRes.value : [];

      // Surface the first real error to the user
      const firstError = [campaignRes, adRes].find(r => r.status === "rejected") as PromiseRejectedResult | undefined;
      if (firstError && dataA.length === 0 && dataAds.length === 0) {
        throw firstError.reason;
      }

      // ── Comparison period ──
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
          if (fullDataRes.status === "fulfilled") {
            dataB = fullDataRes.value.filter((d) => new Date(d.date_start) < new Date(minDateA));
          }
          if (fullHourlyRes.status === "fulfilled") {
            hourlyB = fullHourlyRes.value.filter((d) => new Date(d.date_start) < new Date(minDateA));
          }
        }
      }

      // ── Secondary calls: breakdowns, creatives, hierarchy (all non-blocking) ──
      const [breakdownsRes, creativesRes, hierarchyRes, supabaseRes] = await Promise.allSettled([
        fetchBreakdowns(accountId, token, timeParams),
        fetchCreativesHD(accountId, token),
        fetchAccountStructure(accountId, token),
        fetchSupabaseLeads().catch(() => []),
      ]);

      // ── Commit to store ──
      setData(dataA, dataB);
      setDataAds(dataAds);
      setHourlyData(hourlyA, hourlyB);

      if (breakdownsRes.status === "fulfilled") {
        const bd = breakdownsRes.value;
        setBreakdownData(bd.age, bd.gender, bd.placement, bd.region);
      } else {
        console.warn("[MetaAPI] Breakdowns failed:", (breakdownsRes as PromiseRejectedResult).reason);
        setBreakdownData([], [], [], []);
      }

      if (creativesRes.status === "fulfilled") {
        setCreativesHD(creativesRes.value);
      }

      if (hierarchyRes.status === "fulfilled") {
        setHierarchy(hierarchyRes.value as any);
      }

      // Merge Supabase leads
      if (supabaseRes.status === "fulfilled") {
        const supabaseLeads = supabaseRes.value as any[];
        if (supabaseLeads.length > 0) {
          const store = useAppStore.getState();
          const existingIds = new Set(store.crmLeads.map((l) => l.lead_id));
          const newLeads = supabaseLeads.filter((l: any) => !existingIds.has(l.lead_id));
          if (newLeads.length > 0) {
            useAppStore.setState({ crmLeads: [...store.crmLeads, ...newLeads] });
          }
        }
      }

      setLastSync(new Date().toLocaleTimeString());
    } catch (error: any) {
      console.error("[MetaAPI] Fatal error:", error);
      setApiError(error?.message || "Erro desconhecido na API do Facebook");
    } finally {
      setLoading(false);
    }
  }, [
    token, accountId, period, customStart, customEnd, isCompare,
    setLoading, setData, setDataAds, setHourlyData, setBreakdownData,
    setLastSync, setHierarchy, setApiError, setCreativesHD,
  ]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { refresh };
}

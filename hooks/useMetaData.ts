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

      // ── CALL 1a: Campaign-level insights (daily rows) ──
      const dataA = await fetchMetaInsights(accountId, token, {
        ...timeParams,
        level: "campaign",
      });

      // ── CALL 1b: Comparison period ──
      let dataB: any[] = [];
      if (isCompare) {
        const largerPeriod = period === "last_7d" ? "last_14d" : "last_90d";
        const fullData = await fetchMetaInsights(accountId, token, {
          period: largerPeriod,
          level: "campaign",
        });
        const minDateA = [...new Set(dataA.map((d) => d.date_start))].sort()[0];
        if (minDateA) {
          dataB = fullData.filter((d) => new Date(d.date_start) < new Date(minDateA));
        }
      }

      // ── CALL 1c: Ad-level insights ──
      const dataAds = await fetchMetaInsights(accountId, token, {
        ...timeParams,
        level: "ad",
      });

      // ── CALL 2: Hourly heatmap (advertiser + audience timezone, merged) ──
      const hourlyA = await fetchHourlyInsights(accountId, token, timeParams);

      let hourlyB: any[] = [];
      if (isCompare) {
        const largerPeriod = period === "last_7d" ? "last_14d" : "last_90d";
        const fullHourly = await fetchHourlyInsights(accountId, token, { period: largerPeriod });
        const minDateA = [...new Set(dataA.map((d) => d.date_start))].sort()[0];
        if (minDateA) {
          hourlyB = fullHourly.filter((d) => new Date(d.date_start) < new Date(minDateA));
        }
      }

      // ── CALL 3 + 4 + hierarchy in parallel (non-blocking) ──
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
        console.warn("[MetaAPI] Breakdowns failed:", breakdownsRes.reason);
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

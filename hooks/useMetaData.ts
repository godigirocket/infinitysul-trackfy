"use client";

import { useEffect, useCallback } from "react";
import { useAppStore } from "@/store/useAppStore";
import { fetchMetaInsights, fetchAccountStructure } from "@/services/metaApi";
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
    setApiError
  } = useAppStore();

  const refresh = useCallback(async () => {
    if (!token || !accountId) return;

    setLoading(true);
    setApiError(null);
    try {
      // ── 1. Campaign-level insights ──
      const dataA = await fetchMetaInsights(accountId, token, {
        period,
        customStart,
        customEnd,
        level: "campaign",
      });

      // ── 2. Comparison period (Period B) ──
      let dataB: any[] = [];
      if (isCompare) {
        const largerPeriod = period === "last_7d" ? "last_14d" : "last_90d";
        const fullData = await fetchMetaInsights(accountId, token, { period: largerPeriod, level: "campaign" });
        const minDateA = [...new Set(dataA.map((d) => d.date_start))].sort()[0];
        if (minDateA) {
          dataB = fullData.filter((d) => new Date(d.date_start) < new Date(minDateA));
        }
      }

      // ── 3. Ad-level data ──
      const dataAds = await fetchMetaInsights(accountId, token, {
        period,
        customStart,
        customEnd,
        level: "ad",
      });

      // ── 4. Hourly data ──
      const hourlyA = await fetchMetaInsights(accountId, token, {
        period,
        customStart,
        customEnd,
        breakdowns: "hourly_stats_aggregated_by_audience_time_zone",
      });

      let hourlyB: any[] = [];
      if (isCompare) {
        const largerPeriod = period === "last_7d" ? "last_14d" : "last_90d";
        const fullHourly = await fetchMetaInsights(accountId, token, {
          period: largerPeriod,
          breakdowns: "hourly_stats_aggregated_by_audience_time_zone",
        });
        const minDateA = [...new Set(dataA.map((d) => d.date_start))].sort()[0];
        if (minDateA) {
          hourlyB = fullHourly.filter((d) => new Date(d.date_start) < new Date(minDateA));
        }
      }

      // ── 5. Breakdowns & Hierarchy (parallel, non-blocking) ──
      const [ageRes, genderRes, regionRes, placementRes, hierarchyRes] = await Promise.allSettled([
        fetchMetaInsights(accountId, token, { period, customStart, customEnd, breakdowns: "age" }),
        fetchMetaInsights(accountId, token, { period, customStart, customEnd, breakdowns: "gender" }),
        fetchMetaInsights(accountId, token, { period, customStart, customEnd, breakdowns: "region" }),
        fetchMetaInsights(accountId, token, { period, customStart, customEnd, breakdowns: "publisher_platform" }),
        fetchAccountStructure(accountId, token),
      ]);

      // ── 6. Supabase Leads (non-blocking) ──
      let supabaseLeads: any[] = [];
      try {
        supabaseLeads = await fetchSupabaseLeads();
      } catch (e) {
        console.warn("[Supabase] Lead fetch skipped:", e);
      }

      // ── Commit to store ──
      setData(dataA, dataB);
      setDataAds(dataAds);
      setHourlyData(hourlyA, hourlyB);
      setBreakdownData(
        ageRes.status === "fulfilled" ? ageRes.value as any[] : [],
        genderRes.status === "fulfilled" ? genderRes.value as any[] : [],
        placementRes.status === "fulfilled" ? placementRes.value as any[] : [],
        regionRes.status === "fulfilled" ? regionRes.value as any[] : [],
      );

      if (hierarchyRes.status === "fulfilled") {
        setHierarchy(hierarchyRes.value as any);
      }

      // Merge Supabase leads into CRM store
      if (supabaseLeads.length > 0) {
        const store = useAppStore.getState();
        const existingIds = new Set(store.crmLeads.map(l => l.lead_id));
        const newLeads = supabaseLeads.filter((l: any) => !existingIds.has(l.lead_id));
        if (newLeads.length > 0) {
          useAppStore.setState({ crmLeads: [...store.crmLeads, ...newLeads] });
        }
      }

      setLastSync(new Date().toLocaleTimeString());

    } catch (error: any) {
      console.error("Meta API Error:", error);
      setApiError(error?.message || "Erro desconhecido na API do Facebook");
    } finally {
      setLoading(false);
    }
  }, [token, accountId, period, customStart, customEnd, isCompare,
      setLoading, setData, setDataAds, setHourlyData, setBreakdownData, setLastSync, setHierarchy, setApiError]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { refresh };
}

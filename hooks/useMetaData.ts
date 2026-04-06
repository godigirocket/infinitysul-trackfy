"use client";

import { useEffect, useCallback } from "react";
import { useAppStore } from "@/store/useAppStore";
import { fetchMetaInsights } from "@/services/metaApi";

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
    setHourlyData,
    setLastSync 
  } = useAppStore();

  const refresh = useCallback(async () => {
    if (!token || !accountId) return;

    setLoading(true);
    try {
      // Fetch Daily Insights (Current Period A)
      const dataA = await fetchMetaInsights(accountId, token, {
        period,
        customStart,
        customEnd,
      });

      let dataB: any[] = [];
      if (isCompare) {
        const largerPeriod = period === "last_7d" ? "last_14d" : "last_90d";
        const fullData = await fetchMetaInsights(accountId, token, {
          period: largerPeriod,
        });
        const minDateA = [...new Set(dataA.map((d) => d.date_start))].sort()[0];
        if (minDateA) {
          dataB = fullData.filter((d) => new Date(d.date_start) < new Date(minDateA));
        }
      }

      // Fetch Hourly Insights (for Peak Analysis)
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

      setData(dataA, dataB);
      setHourlyData(hourlyA, hourlyB);
      setLastSync(new Date().toLocaleTimeString());
    } catch (error) {
      console.error("Meta API Error:", error);
    } finally {
      setLoading(false);
    }
  }, [token, accountId, period, customStart, customEnd, isCompare, setLoading, setData, setHourlyData, setLastSync]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { refresh };
}

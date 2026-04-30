"use client";

import { useEffect } from "react";
import { useAppStore } from "@/store/useAppStore";
import {
  fetchMetaInsights, fetchHourlyInsights, fetchBreakdowns,
  fetchCreativesHD, fetchAccountStructure,
} from "@/services/metaApi";

let isFetching = false;
let lastFetchKey = "";

export function clearFetchCache() {
  lastFetchKey = "";
  isFetching = false;
}

export async function runRefresh() {
  const { token, accountId, period, customStart, customEnd, isCompare } =
    useAppStore.getState();

  if (!token || !accountId) return;

  // Resolve non-standard periods (last_2d, last_3d) to date ranges
  let resolvedPeriod = period;
  let resolvedStart = customStart;
  let resolvedEnd = customEnd;

  if (period === "last_2d" || period === "last_3d") {
    const days = period === "last_2d" ? 2 : 3;
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - (days - 1));
    resolvedPeriod = "custom";
    resolvedStart = start.toISOString().split("T")[0];
    resolvedEnd = end.toISOString().split("T")[0];
  }

  const key = `${token}|${accountId}|${resolvedPeriod}|${resolvedStart}|${resolvedEnd}|${isCompare}`;
  if (isFetching || key === lastFetchKey) return;

  isFetching = true;
  lastFetchKey = key;

  const store = useAppStore.getState();
  store.setLoading(true);
  store.setApiError(null);

  try {
    const tp = { period: resolvedPeriod, customStart: resolvedStart, customEnd: resolvedEnd };

    // Primary: campaign + ad insights + hourly (parallel)
    const [campRes, adRes, hourlyRes] = await Promise.allSettled([
      fetchMetaInsights(accountId, token, { ...tp, level: "campaign" }),
      fetchMetaInsights(accountId, token, { ...tp, level: "ad" }),
      fetchHourlyInsights(accountId, token, tp),
    ]);

    const dataA = campRes.status === "fulfilled" ? campRes.value : [];
    const dataAds = adRes.status === "fulfilled" ? adRes.value : [];
    const hourlyA = hourlyRes.status === "fulfilled" ? hourlyRes.value : [];

    // Surface error only if both primary calls failed
    if (dataA.length === 0 && dataAds.length === 0) {
      const err = [campRes, adRes].find(r => r.status === "rejected") as PromiseRejectedResult | undefined;
      if (err) throw err.reason;
    }

    // Comparison period
    let dataB: any[] = [];
    if (isCompare && dataA.length > 0) {
      const lp = resolvedPeriod === "last_7d" ? "last_14d" : "last_90d";
      const fullRes = await fetchMetaInsights(accountId, token, { period: lp, level: "campaign" }).catch(() => []);
      const minDate = [...new Set(dataA.map(d => d.date_start))].sort()[0];
      if (minDate) dataB = fullRes.filter(d => new Date(d.date_start) < new Date(minDate));
    }

    // Secondary: breakdowns + creatives + hierarchy (parallel, non-blocking)
    const [bdRes, crRes, hierRes] = await Promise.allSettled([
      fetchBreakdowns(accountId, token, tp),
      fetchCreativesHD(accountId, token),
      fetchAccountStructure(accountId, token),
    ]);

    const s = useAppStore.getState();
    s.setData(dataA, dataB);
    s.setDataAds(dataAds);
    s.setHourlyData(hourlyA, []);

    if (bdRes.status === "fulfilled") {
      const bd = bdRes.value;
      s.setBreakdownData(bd.age, bd.gender, bd.placement, bd.region);
    } else {
      s.setBreakdownData([], [], [], []);
    }

    if (crRes.status === "fulfilled") s.setCreativesHD(crRes.value);
    if (hierRes.status === "fulfilled") s.setHierarchy(hierRes.value as any);

    useAppStore.getState().setLastSync(new Date().toLocaleTimeString());
  } catch (err: any) {
    console.error("[MetaAPI]", err);
    useAppStore.getState().setApiError(err?.message || "Erro na API do Facebook");
  } finally {
    isFetching = false;
    useAppStore.getState().setLoading(false);
  }
}

export function useMetaData() {
  const token = useAppStore(s => s.token);
  const accountId = useAppStore(s => s.accountId);
  const period = useAppStore(s => s.period);
  const customStart = useAppStore(s => s.customStart);
  const customEnd = useAppStore(s => s.customEnd);
  const isCompare = useAppStore(s => s.isCompare);

  useEffect(() => {
    if (token && accountId) runRefresh();
  }, [token, accountId, period, customStart, customEnd, isCompare]);

  return { refresh: runRefresh };
}

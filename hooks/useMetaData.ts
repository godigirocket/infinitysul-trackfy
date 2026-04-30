"use client";

import { useEffect } from "react";
import { useAppStore } from "@/store/useAppStore";
import {
  fetchMetaInsights, fetchHourlyInsights, fetchBreakdowns,
  fetchCreativesHD, fetchAccountStructure,
} from "@/services/metaApi";
import { readCache, writeCache, isCacheFresh } from "@/lib/syncCache";

let isFetching = false;
let lastFetchKey = "";

export function clearFetchCache() {
  lastFetchKey = "";
  isFetching = false;
}

/** Resolve non-standard period strings to {period, customStart, customEnd} */
function resolveTimeParams(period: string, customStart: string, customEnd: string) {
  if (period === "last_2d" || period === "last_3d") {
    const days = period === "last_2d" ? 2 : 3;
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - (days - 1));
    return {
      period: "custom",
      customStart: start.toISOString().split("T")[0],
      customEnd: end.toISOString().split("T")[0],
    };
  }
  return { period, customStart, customEnd };
}

/** Load cached data into store immediately — zero latency */
function loadFromCache(accountId: string, tp: ReturnType<typeof resolveTimeParams>) {
  const periodKey = tp.period === "custom" ? `${tp.customStart}_${tp.customEnd}` : tp.period;
  const store = useAppStore.getState();

  const dataA = readCache(accountId, periodKey, "campaign");
  const dataAds = readCache(accountId, periodKey, "ad");
  const hourlyA = readCache(accountId, periodKey, "hourly");
  const breakdowns = readCache(accountId, periodKey, "breakdowns");
  const creatives = readCache(accountId, periodKey, "creatives");
  const hierarchy = readCache(accountId, periodKey, "hierarchy");

  if (dataA) store.setData(dataA, []);
  if (dataAds) store.setDataAds(dataAds);
  if (hourlyA) store.setHourlyData(hourlyA, []);
  if (breakdowns) store.setBreakdownData(breakdowns.age || [], breakdowns.gender || [], breakdowns.placement || [], breakdowns.region || []);
  if (creatives) store.setCreativesHD(creatives);
  if (hierarchy) store.setHierarchy(hierarchy);

  return !!(dataA || dataAds); // true if we had any cached data
}

export async function runRefresh(force = false) {
  const { token, accountId, period, customStart, customEnd, isCompare } =
    useAppStore.getState();

  if (!token || !accountId) return;

  const tp = resolveTimeParams(period, customStart, customEnd);
  const periodKey = tp.period === "custom" ? `${tp.customStart}_${tp.customEnd}` : tp.period;
  const key = `${token}|${accountId}|${periodKey}|${isCompare}`;

  if (isFetching) return;
  if (!force && key === lastFetchKey) return;

  // Load cache immediately before any API call
  const hadCache = loadFromCache(accountId, tp);

  // If cache is fresh and not forced, skip API call
  if (!force && hadCache && isCacheFresh(accountId, periodKey, "campaign")) {
    lastFetchKey = key;
    const age = Math.floor((Date.now() - (Date.now() - 60000)) / 1000); // approximate
    useAppStore.getState().setLastSync("cache");
    return;
  }

  isFetching = true;
  lastFetchKey = key;

  const store = useAppStore.getState();
  // Only show loading if we have no cached data
  if (!hadCache) store.setLoading(true);
  store.setApiError(null);

  try {
    const tp2 = { period: tp.period, customStart: tp.customStart, customEnd: tp.customEnd };

    // Primary calls in parallel
    const [campRes, adRes, hourlyRes] = await Promise.allSettled([
      fetchMetaInsights(accountId, token, { ...tp2, level: "campaign" }),
      fetchMetaInsights(accountId, token, { ...tp2, level: "ad" }),
      fetchHourlyInsights(accountId, token, tp2),
    ]);

    const dataA = campRes.status === "fulfilled" ? campRes.value : [];
    const dataAds = adRes.status === "fulfilled" ? adRes.value : [];
    const hourlyA = hourlyRes.status === "fulfilled" ? hourlyRes.value : [];

    // Surface error only if both primary calls failed AND we have no cache
    if (dataA.length === 0 && dataAds.length === 0 && !hadCache) {
      const err = [campRes, adRes].find(r => r.status === "rejected") as PromiseRejectedResult | undefined;
      if (err) throw err.reason;
    }

    // Write to cache
    if (dataA.length > 0) writeCache(accountId, periodKey, "campaign", dataA);
    if (dataAds.length > 0) writeCache(accountId, periodKey, "ad", dataAds);
    if (hourlyA.length > 0) writeCache(accountId, periodKey, "hourly", hourlyA);

    // Update store
    const s = useAppStore.getState();
    if (dataA.length > 0) s.setData(dataA, []);
    if (dataAds.length > 0) s.setDataAds(dataAds);
    if (hourlyA.length > 0) s.setHourlyData(hourlyA, []);

    // Secondary calls — non-blocking
    const [bdRes, crRes, hierRes] = await Promise.allSettled([
      fetchBreakdowns(accountId, token, tp2),
      fetchCreativesHD(accountId, token),
      fetchAccountStructure(accountId, token),
    ]);

    const s2 = useAppStore.getState();

    if (bdRes.status === "fulfilled") {
      const bd = bdRes.value;
      s2.setBreakdownData(bd.age, bd.gender, bd.placement, bd.region);
      writeCache(accountId, periodKey, "breakdowns", bd);
    }
    if (crRes.status === "fulfilled") {
      s2.setCreativesHD(crRes.value);
      writeCache(accountId, periodKey, "creatives", crRes.value);
    }
    if (hierRes.status === "fulfilled") {
      s2.setHierarchy(hierRes.value as any);
      writeCache(accountId, periodKey, "hierarchy", hierRes.value);
    }

    useAppStore.getState().setLastSync(new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }));
  } catch (err: any) {
    console.error("[MetaAPI]", err);
    // Only show error if we have no data at all
    if (!hadCache) {
      useAppStore.getState().setApiError(err?.message || "Erro na API do Facebook");
    }
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

  return { refresh: () => runRefresh(true) };
}

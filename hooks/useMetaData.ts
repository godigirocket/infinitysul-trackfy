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
let lastForceTime = 0;
const FORCE_COOLDOWN_MS = 120_000; // 120s minimum between forced syncs
const CACHE_TTL_MINUTES = 10;

export function clearFetchCache() {
  lastFetchKey = "";
  isFetching = false;
}

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

function loadFromCache(accountId: string, periodKey: string) {
  const store = useAppStore.getState();
  const dataA      = readCache(accountId, periodKey, "campaign");
  const dataAds    = readCache(accountId, periodKey, "ad");
  const hourlyA    = readCache(accountId, periodKey, "hourly");
  const breakdowns = readCache(accountId, periodKey, "breakdowns");
  const creatives  = readCache(accountId, periodKey, "creatives");
  const hierarchy  = readCache(accountId, periodKey, "hierarchy");

  if (dataA)      store.setData(dataA, []);
  if (dataAds)    store.setDataAds(dataAds);
  if (hourlyA)    store.setHourlyData(hourlyA, []);
  if (breakdowns) store.setBreakdownData(breakdowns.age || [], breakdowns.gender || [], breakdowns.placement || [], breakdowns.region || []);
  if (creatives)  store.setCreativesHD(creatives);
  if (hierarchy)  store.setHierarchy(hierarchy);

  return !!(dataA || dataAds || hierarchy);
}

/** Sleep helper */
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

export async function runRefresh(force = false) {
  const { token, accountId, period, customStart, customEnd } = useAppStore.getState();
  if (!token || !accountId) return;

  // Hard rate limit on forced syncs
  if (force) {
    const now = Date.now();
    if (now - lastForceTime < FORCE_COOLDOWN_MS) {
      const wait = Math.ceil((FORCE_COOLDOWN_MS - (now - lastForceTime)) / 1000);
      useAppStore.getState().setApiError(`Aguarde ${wait}s antes de sincronizar novamente.`);
      setTimeout(() => useAppStore.getState().setApiError(null), 3000);
      return;
    }
    lastForceTime = now;
  }

  if (isFetching) return;

  const tp = resolveTimeParams(period, customStart, customEnd);
  const periodKey = tp.period === "custom" ? `${tp.customStart}_${tp.customEnd}` : tp.period;
  const key = `${token}|${accountId}|${periodKey}`;

  if (!force && key === lastFetchKey) return;

  // Always load cache first — instant display
  const hadCache = loadFromCache(accountId, periodKey);

  // Skip API if cache is fresh and not forced
  if (!force && hadCache && isCacheFresh(accountId, periodKey, "campaign")) {
    lastFetchKey = key;
    useAppStore.getState().setLastSync("cache");
    return;
  }

  isFetching = true;
  lastFetchKey = key;

  const store = useAppStore.getState();
  if (!hadCache) store.setLoading(true);
  store.setApiError(null);

  try {
    const tp2 = { period: tp.period, customStart: tp.customStart, customEnd: tp.customEnd };

    // ── Step 1: Primary insights (campaign + ad) — sequential to avoid rate limit ──
    const campRes = await fetchMetaInsights(accountId, token, { ...tp2, level: "campaign" }).catch(() => []);
    await sleep(500); // 500ms gap between calls
    const adRes = await fetchMetaInsights(accountId, token, { ...tp2, level: "ad" }).catch(() => []);

    if (campRes.length > 0) {
      writeCache(accountId, periodKey, "campaign", campRes);
      useAppStore.getState().setData(campRes, []);
    }
    if (adRes.length > 0) {
      writeCache(accountId, periodKey, "ad", adRes);
      useAppStore.getState().setDataAds(adRes);
    }

    // ── Step 2: Hierarchy (campaigns/adsets/ads) — needed for campaign manager ──
    await sleep(800);
    const hierRes = await fetchAccountStructure(accountId, token).catch(() => null);
    if (hierRes) {
      useAppStore.getState().setHierarchy(hierRes as any);
      writeCache(accountId, periodKey, "hierarchy", hierRes);
    }

    // ── Step 3: Hourly data ──
    await sleep(800);
    const hourlyRes = await fetchHourlyInsights(accountId, token, tp2).catch(() => []);
    if (hourlyRes.length > 0) {
      writeCache(accountId, periodKey, "hourly", hourlyRes);
      useAppStore.getState().setHourlyData(hourlyRes, []);
    }

    // ── Step 4: Creatives (most likely to hit rate limit — do last with longer delay) ──
    await sleep(1000);
    const crRes = await fetchCreativesHD(accountId, token).catch(() => null);
    if (crRes && Object.keys(crRes).length > 0) {
      useAppStore.getState().setCreativesHD(crRes);
      writeCache(accountId, periodKey, "creatives", crRes);
    }

    // ── Step 5: Breakdowns (optional, skip if rate limited) ──
    await sleep(500);
    const bdRes = await fetchBreakdowns(accountId, token, tp2).catch(() => null);
    if (bdRes) {
      useAppStore.getState().setBreakdownData(bdRes.age, bdRes.gender, bdRes.placement, bdRes.region);
      writeCache(accountId, periodKey, "breakdowns", bdRes);
    }

    useAppStore.getState().setLastSync(
      new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
    );
  } catch (err: any) {
    console.error("[MetaAPI]", err);
    if (!hadCache) {
      useAppStore.getState().setApiError(err?.message || "Erro na API do Facebook");
    }
  } finally {
    isFetching = false;
    useAppStore.getState().setLoading(false);
  }
}

export function useMetaData() {
  const token      = useAppStore(s => s.token);
  const accountId  = useAppStore(s => s.accountId);
  const period     = useAppStore(s => s.period);
  const customStart = useAppStore(s => s.customStart);
  const customEnd  = useAppStore(s => s.customEnd);

  useEffect(() => {
    if (token && accountId) runRefresh();
  }, [token, accountId, period, customStart, customEnd]);

  return { refresh: () => runRefresh(true) };
}

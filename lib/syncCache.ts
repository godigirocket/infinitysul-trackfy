/**
 * Sync cache — persists Meta API data to localStorage.
 * Dashboard reads from cache instantly; background sync updates it.
 * Cache is keyed by accountId + period so different accounts/periods don't collide.
 */

const CACHE_VERSION = "v2";
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

export interface CacheEntry {
  key: string;
  data: any;
  timestamp: number;
  version: string;
}

function cacheKey(accountId: string, period: string, type: string): string {
  return `tf-cache:${CACHE_VERSION}:${accountId}:${period}:${type}`;
}

export function writeCache(accountId: string, period: string, type: string, data: any): void {
  if (typeof window === "undefined") return;
  try {
    const entry: CacheEntry = {
      key: cacheKey(accountId, period, type),
      data,
      timestamp: Date.now(),
      version: CACHE_VERSION,
    };
    localStorage.setItem(entry.key, JSON.stringify(entry));
  } catch (e) {
    // Storage full — clear old cache entries
    clearOldCache();
  }
}

export function readCache<T = any>(accountId: string, period: string, type: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(cacheKey(accountId, period, type));
    if (!raw) return null;
    const entry: CacheEntry = JSON.parse(raw);
    if (entry.version !== CACHE_VERSION) return null;
    // Return stale data — freshness is handled by background sync
    return entry.data as T;
  } catch {
    return null;
  }
}

export function isCacheFresh(accountId: string, period: string, type: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    const raw = localStorage.getItem(cacheKey(accountId, period, type));
    if (!raw) return false;
    const entry: CacheEntry = JSON.parse(raw);
    return Date.now() - entry.timestamp < CACHE_TTL_MS;
  } catch {
    return false;
  }
}

export function getCacheAge(accountId: string, period: string, type: string): number | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(cacheKey(accountId, period, type));
    if (!raw) return null;
    const entry: CacheEntry = JSON.parse(raw);
    return Math.floor((Date.now() - entry.timestamp) / 1000);
  } catch {
    return null;
  }
}

function clearOldCache(): void {
  try {
    const keys = Object.keys(localStorage).filter(k => k.startsWith("tf-cache:"));
    // Remove oldest half
    const entries = keys.map(k => {
      try { return { k, t: JSON.parse(localStorage.getItem(k) || "{}").timestamp || 0 }; }
      catch { return { k, t: 0 }; }
    }).sort((a, b) => a.t - b.t);
    entries.slice(0, Math.floor(entries.length / 2)).forEach(e => localStorage.removeItem(e.k));
  } catch {}
}

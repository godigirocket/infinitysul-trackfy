"use client";

import { useEffect } from "react";
import { useAppStore } from "@/store/useAppStore";
import { runRefresh, clearFetchCache } from "@/hooks/useMetaData";

export function StoreHydration() {
  useEffect(() => {
    // 1. Load persisted token/accountId from localStorage
    useAppStore.getState()._hydrate();

    // 2. Small delay to ensure React state update from _hydrate propagates
    //    before runRefresh reads from the store
    const timer = setTimeout(() => {
      clearFetchCache();
      runRefresh();
    }, 50);

    return () => clearTimeout(timer);
  }, []);

  return null;
}

export function useStoreHydrated() {
  return true;
}

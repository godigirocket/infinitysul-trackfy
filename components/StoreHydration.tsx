"use client";

import { useEffect } from "react";
import { useAppStore } from "@/store/useAppStore";

export function StoreHydration() {
  useEffect(() => {
    useAppStore.getState()._hydrate();
  }, []);
  return null;
}

export function useStoreHydrated() {
  return true;
}

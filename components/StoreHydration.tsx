"use client";

import { useEffect } from "react";
import { useAppStore } from "@/store/useAppStore";

/**
 * Triggers Zustand persist rehydration on the client only.
 * Prevents React hydration mismatch (#418) caused by localStorage
 * being unavailable during SSR.
 */
export function StoreHydration() {
  useEffect(() => {
    useAppStore.persist.rehydrate();
  }, []);

  return null;
}

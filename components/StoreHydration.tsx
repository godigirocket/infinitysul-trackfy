"use client";

import { useEffect, useState } from "react";
import { useAppStore } from "@/store/useAppStore";

let hydrated = false;

/**
 * Rehydrates Zustand persist store on client only (avoids React #418 hydration mismatch).
 * Exposes a global flag so useMetaData can wait before firing API calls.
 */
export function StoreHydration() {
  useEffect(() => {
    if (!hydrated) {
      useAppStore.persist.rehydrate();
      hydrated = true;
    }
  }, []);

  return null;
}

export function useStoreHydrated() {
  const [ready, setReady] = useState(hydrated);

  useEffect(() => {
    if (hydrated) {
      setReady(true);
      return;
    }
    // Wait for rehydration to finish
    const unsub = useAppStore.persist.onFinishHydration(() => {
      hydrated = true;
      setReady(true);
    });
    // Also trigger rehydration in case StoreHydration hasn't mounted yet
    useAppStore.persist.rehydrate();
    return unsub;
  }, []);

  return ready;
}

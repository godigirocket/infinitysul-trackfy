"use client";

import { useEffect, useState } from "react";
import { useAppStore } from "@/store/useAppStore";
import { runRefresh } from "@/hooks/useMetaData";

// Hydrate synchronously on module load (client only)
// This runs before any React component renders on the client
if (typeof window !== "undefined") {
  useAppStore.getState()._hydrate();
}

export function StoreHydration() {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // Re-hydrate in effect to catch any timing issues
    useAppStore.getState()._hydrate();
    setHydrated(true);
    // Trigger refresh now that token/accountId are loaded
    runRefresh();
  }, []);

  return null;
}

export function useStoreHydrated() {
  return true;
}

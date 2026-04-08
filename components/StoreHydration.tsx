"use client";

// No-op: hydration is now handled by the store itself via SSR-safe localStorage.
// This file is kept to avoid breaking imports.
export function StoreHydration() {
  return null;
}

export function useStoreHydrated() {
  return true;
}

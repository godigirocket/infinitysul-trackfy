"use client";

import { useState, useEffect, ReactNode } from "react";

/**
 * Renders children only on the client after mount.
 * Use for any component that reads from localStorage-backed store
 * to prevent React hydration mismatch (#418).
 */
export function ClientOnly({
  children,
  fallback = null,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  return mounted ? <>{children}</> : <>{fallback}</>;
}

"use client";

import { useAppStore } from "@/store/useAppStore";
import { runRefresh, clearFetchCache } from "@/hooks/useMetaData";
import { useState, useEffect } from "react";
import { RotateCw, Wifi, WifiOff, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

// Updated periods: Hoje, Ontem, 2D, 3D, 7D, 14D, 30D, Máximo
const PERIODS = [
  { label: "Hoje",    value: "today" },
  { label: "Ontem",  value: "yesterday" },
  { label: "2 dias", value: "last_2d" },
  { label: "3 dias", value: "last_3d" },
  { label: "7 dias", value: "last_7d" },
  { label: "14 dias", value: "last_14d" },
  { label: "30 dias", value: "last_30d" },
  { label: "Máximo", value: "maximum" },
];

export function Topbar() {
  const { period, setPeriod, isLoading, apiError, token, accountId } = useAppStore();

  // Use mounted to avoid hydration mismatch — render identical placeholder on server
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  // Connection status — only meaningful after mount (client-only)
  const isConfigured = mounted && !!token && !!accountId;
  const statusLabel = !mounted ? "" : isLoading ? "Sincronizando" : isConfigured ? "Conectado" : "Desconectado";
  const statusColor = !mounted ? "bg-muted" : isLoading ? "bg-warning animate-pulse" : isConfigured ? "bg-success animate-pulse" : "bg-danger";

  const handleSync = () => {
    clearFetchCache();
    runRefresh();
  };

  return (
    <>
      {/* Fixed topbar — same structure on server and client (no conditional JSX tree) */}
      <header className="fixed top-0 right-0 left-64 h-14 bg-[#0a0a0f]/90 backdrop-blur-xl border-b border-white/[0.06] px-6 flex items-center justify-between z-40">

        {/* Left: status badge */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.08]">
            <div className={cn("w-2 h-2 rounded-full transition-colors", statusColor)} />
            <span className="text-[11px] font-semibold text-white/70 min-w-[80px]" suppressHydrationWarning>
              {statusLabel}
            </span>
          </div>

          {/* Configured but no data hint */}
          {mounted && !isConfigured && (
            <a href="/settings" className="flex items-center gap-1.5 text-[11px] text-warning/80 hover:text-warning transition-colors">
              <AlertCircle className="w-3.5 h-3.5" />
              Configure o token
            </a>
          )}
        </div>

        {/* Right: period selector + sync */}
        <div className="flex items-center gap-3">
          {/* Period pills */}
          <div className="flex items-center bg-white/[0.04] rounded-xl border border-white/[0.06] p-1 gap-0.5 overflow-x-auto scrollbar-hide max-w-[520px]">
            {PERIODS.map((p) => (
              <button
                key={p.value}
                onClick={() => setPeriod(p.value)}
                suppressHydrationWarning
                className={cn(
                  "px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all duration-150 whitespace-nowrap flex-shrink-0",
                  mounted && period === p.value
                    ? "bg-accent text-white shadow-md shadow-accent/20"
                    : "text-white/50 hover:text-white hover:bg-white/[0.06]"
                )}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Sync button */}
          <button
            onClick={handleSync}
            disabled={isLoading || !isConfigured}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl text-[11px] font-semibold transition-all",
              isConfigured
                ? "bg-accent hover:bg-accent/90 text-white shadow-md shadow-accent/20 disabled:opacity-60"
                : "bg-white/[0.04] text-white/30 cursor-not-allowed border border-white/[0.06]"
            )}
          >
            <RotateCw className={cn("w-3.5 h-3.5", isLoading && "animate-spin")} />
            <span className="hidden sm:inline">{isLoading ? "Sincronizando..." : "Sincronizar"}</span>
          </button>
        </div>
      </header>

      {/* Error banner — only shown client-side after mount */}
      {mounted && apiError && (
        <div className="fixed top-14 right-0 left-64 z-30 px-6 py-2.5 bg-danger/10 border-b border-danger/20 flex items-center gap-3">
          <AlertCircle className="w-4 h-4 text-danger flex-shrink-0" />
          <span className="text-[11px] font-semibold text-danger">Erro Meta Ads:</span>
          <span className="text-[11px] text-danger/80 font-mono truncate">{apiError}</span>
          <button onClick={() => useAppStore.getState().setApiError(null)} className="ml-auto text-danger/60 hover:text-danger text-xs">✕</button>
        </div>
      )}
    </>
  );
}

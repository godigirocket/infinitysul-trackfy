"use client";

import { useAppStore } from "@/store/useAppStore";
import { runRefresh, clearFetchCache } from "@/hooks/useMetaData";
import { useState, useEffect } from "react";
import { RotateCw, ChevronDown, AlertCircle, Bot } from "lucide-react";
import { cn } from "@/lib/utils";

const PERIODS = [
  { label: "Hoje",    value: "today" },
  { label: "Ontem",  value: "yesterday" },
  { label: "2D",     value: "last_2d" },
  { label: "3D",     value: "last_3d" },
  { label: "7D",     value: "last_7d" },
  { label: "14D",    value: "last_14d" },
  { label: "30D",    value: "last_30d" },
  { label: "Máximo", value: "maximum" },
];

export function Topbar() {
  const { period, setPeriod, isLoading, apiError, token, accountId } = useAppStore();
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const isConfigured = mounted && !!token && !!accountId;

  const handleSync = () => {
    clearFetchCache();
    runRefresh(true);
  };

  return (
    <>
      <header
        className="fixed top-0 right-0 z-40 h-14 flex items-center justify-between px-6 border-b border-white/[0.05]"
        style={{
          left: "220px",
          background: "rgba(2,6,23,0.85)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
        }}
      >
        {/* Left: status */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className={cn("w-1.5 h-1.5 rounded-full transition-colors",
              !mounted ? "bg-white/20" :
              isLoading ? "bg-warning animate-pulse" :
              isConfigured ? "bg-success animate-pulse" : "bg-danger")} />
            <span className="text-[12px] text-white/40 font-medium" suppressHydrationWarning>
              {!mounted ? "" : isLoading ? "Sincronizando" : isConfigured ? "Conectado" : "Desconectado"}
            </span>
          </div>
          {mounted && !isConfigured && (
            <a href="/settings" className="text-[11px] text-accent hover:text-accent/80 transition-colors font-medium">
              Configurar →
            </a>
          )}
        </div>

        {/* Right: period + sync */}
        <div className="flex items-center gap-2">
          {/* Period selector */}
          <div className="flex items-center bg-white/[0.04] border border-white/[0.06] rounded-lg p-0.5 gap-0.5">
            {PERIODS.map(p => (
              <button key={p.value} onClick={() => setPeriod(p.value)} suppressHydrationWarning
                className={cn(
                  "px-2.5 py-1.5 rounded-md text-[11px] font-semibold transition-all duration-150 whitespace-nowrap",
                  mounted && period === p.value
                    ? "bg-accent text-white shadow-sm"
                    : "text-white/40 hover:text-white/70 hover:bg-white/[0.05]"
                )}>
                {p.label}
              </button>
            ))}
          </div>

          {/* Sync */}
          <button onClick={handleSync} disabled={isLoading || !isConfigured}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all",
              isConfigured
                ? "bg-accent hover:bg-accent-2 text-white disabled:opacity-50"
                : "bg-white/[0.04] text-white/20 cursor-not-allowed border border-white/[0.06]"
            )}>
            <RotateCw className={cn("w-3.5 h-3.5", isLoading && "animate-spin")} />
            <span className="hidden sm:inline">{isLoading ? "Sync..." : "Sync"}</span>
          </button>
        </div>
      </header>

      {/* Error banner */}
      {mounted && apiError && (
        <div className="fixed z-30 flex items-center gap-2 px-4 py-2 text-[12px] border-b border-danger/20 bg-danger/10"
          style={{ top: "56px", left: "220px", right: 0 }}>
          <AlertCircle className="w-3.5 h-3.5 text-danger flex-shrink-0" />
          <span className="text-danger font-medium">Erro:</span>
          <span className="text-danger/80 truncate">{apiError}</span>
          <button onClick={() => useAppStore.getState().setApiError(null)} className="ml-auto text-danger/50 hover:text-danger text-xs">✕</button>
        </div>
      )}
    </>
  );
}

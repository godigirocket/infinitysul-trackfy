"use client";

import { useAppStore } from "@/store/useAppStore";
import { useMetaData } from "@/hooks/useMetaData";
import { useStoreHydrated } from "@/components/StoreHydration";
import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { 
  CalendarDays, 
  RotateCw
} from "lucide-react";
import { cn } from "@/components/ui/Button";

const periods = [
  { label: "Hoje", value: "today" },
  { label: "Ontem", value: "yesterday" },
  { label: "7D", value: "last_7d" },
  { label: "14D", value: "last_14d" },
  { label: "30D", value: "last_30d" },
  { label: "Mês", value: "this_month" },
  { label: "Últ. Mês", value: "last_month" },
  { label: "Máximo", value: "maximum" },
];

export function Topbar() {
  const hydrated = useStoreHydrated();
  const { 
    period, 
    setPeriod, 
    isCompare, 
    setIsCompare, 
    isLoading, 
    apiError
  } = useAppStore();
  const { refresh } = useMetaData();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !hydrated) {
    return <header className="fixed top-0 right-0 left-64 h-16 bg-surface/80 backdrop-blur-md border-b border-border px-4 sm:px-8 z-40"></header>;
  }

  return (
    <>
      <header className="fixed top-0 right-0 left-64 h-16 bg-surface/80 backdrop-blur-md border-b border-border px-4 sm:px-8 flex items-center justify-between z-40">
        <div className="flex items-center gap-3 sm:gap-6">
          <Badge variant={isLoading ? "warning" : "success"} className="h-6 gap-1.5 px-2 sm:px-3 bg-white/5 border-white/10">
            {isLoading ? (
              <>
                <RotateCw className="w-3 h-3 animate-spin" /> 
                <span className="text-[9px] sm:text-[10px] font-bold uppercase hidden sm:inline">Sincronizando...</span>
              </>
            ) : (
              <>
                <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" /> 
                <span className="text-[9px] sm:text-[10px] font-bold uppercase hidden sm:inline">Conectado</span>
              </>
            )}
          </Badge>

          <label className="hidden lg:flex items-center gap-2 cursor-pointer group">
            <input
              type="checkbox"
              checked={isCompare}
              onChange={(e) => setIsCompare(e.target.checked)}
              className="w-3.5 h-3.5 rounded border-white/10 bg-white/5 text-accent checked:bg-accent focus:ring-0"
            />
            <span className={cn(
              "text-[10px] font-bold uppercase tracking-widest transition-colors",
              isCompare ? "text-accent" : "text-muted group-hover:text-text"
            )}>
              Comparar
            </span>
          </label>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          {/* Period pills - scrollable */}
          <div className="flex bg-white/5 rounded-lg sm:rounded-xl p-0.5 sm:p-1 border border-white/5 overflow-x-auto scrollbar-hide">
            {periods.map((p) => (
              <button
                key={p.value}
                onClick={() => setPeriod(p.value)}
                className={cn(
                  "px-2 sm:px-3 py-1 sm:py-1.5 rounded-md sm:rounded-lg text-[9px] sm:text-[10px] font-bold uppercase transition-all duration-200 tracking-tighter whitespace-nowrap flex-shrink-0",
                  period === p.value 
                    ? "bg-accent text-white shadow-lg" 
                    : "text-muted hover:text-text hover:bg-white/5"
                )}
              >
                {p.label}
              </button>
            ))}
          </div>

          <Button 
            onClick={() => refresh()}
            size="sm" 
            className="gap-1.5 h-7 sm:h-8 font-bold bg-accent hover:bg-accent/90 text-white border-0 shadow-[0_0_20px_rgba(99,102,241,0.2)] text-[9px] sm:text-[10px] px-2 sm:px-3"
          >
            <RotateCw className={cn("w-3 h-3", isLoading && "animate-spin")} />
            <span className="uppercase tracking-wider hidden sm:inline">Sinc</span>
          </Button>
        </div>
      </header>

      {/* Error Banner */}
      {apiError && (
        <div className="fixed top-16 right-0 left-64 z-30 p-2 bg-danger/10 border-b border-danger/20 text-danger animate-in slide-in-from-top-2">
          <div className="flex items-center justify-center gap-2 px-4">
            <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider">Erro Meta Ads:</span>
            <span className="text-[10px] sm:text-[11px] font-mono truncate max-w-md">{apiError}</span>
          </div>
        </div>
      )}
    </>
  );
}

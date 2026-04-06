"use client";

import { useAppStore } from "@/store/useAppStore";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { 
  CalendarDays, 
  RotateCw, 
  ShieldCheck,
  Zap,
  Target
} from "lucide-react";
import { cn } from "@/components/ui/Button";

const periods = [
  { label: "Hoje", value: "today" },
  { label: "7 Dias", value: "last_7d" },
  { label: "30 Dias", value: "last_30d" },
  { label: "Máximo", value: "maximum" },
];

export function Topbar() {
  const { 
    period, 
    setPeriod, 
    isCompare, 
    setIsCompare, 
    isLoading, 
    isDirectorMode, 
    setIsDirectorMode 
  } = useAppStore();

  return (
    <header className="fixed top-0 right-0 left-64 h-20 bg-surface/80 backdrop-blur-md border-b border-border px-8 flex items-center justify-between z-40">
      <div className="flex items-center gap-6">
        <Badge variant={isLoading ? "warning" : "success"} className="h-6 gap-1.5 px-3 bg-white/5 border-white/10">
          {isLoading ? (
            <>
              <RotateCw className="w-3 h-3 animate-spin" /> 
              <span className="text-[10px] font-bold uppercase">Sincronizando Meta</span>
            </>
          ) : (
            <>
              <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" /> 
              <span className="text-[10px] font-bold uppercase">API Conectada</span>
            </>
          )}
        </Badge>

        <div 
          onClick={() => setIsDirectorMode(!isDirectorMode)}
          className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all cursor-pointer select-none",
            isDirectorMode 
              ? "bg-accent/10 border-accent/20 text-accent shadow-[0_0_15px_rgba(99,102,241,0.1)]" 
              : "bg-white/5 border-white/10 text-muted hover:bg-white/10"
          )}
        >
          {isDirectorMode ? <ShieldCheck className="w-4 h-4" /> : <Target className="w-4 h-4 opacity-50" />}
          <span className="text-[10px] font-bold uppercase tracking-wider">
            {isDirectorMode ? "Visão Diretor (ROI)" : "Visão Gestor (Operacional)"}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-6 border-r border-white/5 pr-6">
          <label className="flex items-center gap-2 cursor-pointer group">
            <input
              type="checkbox"
              checked={isCompare}
              onChange={(e) => setIsCompare(e.target.checked)}
              className="w-4 h-4 rounded border-white/10 bg-white/5 text-accent checked:bg-accent focus:ring-0"
            />
            <span className={cn(
              "text-[10px] font-bold uppercase tracking-widest transition-colors",
              isCompare ? "text-accent" : "text-muted group-hover:text-text"
            )}>
              Overlay MOM
            </span>
          </label>

          <div className="flex bg-white/5 rounded-xl p-1 border border-white/5">
            {periods.map((p) => (
              <button
                key={p.value}
                onClick={() => setPeriod(p.value)}
                className={cn(
                  "px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all duration-200 tracking-tighter",
                  period === p.value 
                    ? "bg-accent text-white shadow-lg" 
                    : "text-muted hover:text-text hover:bg-white/5"
                )}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2 h-9 border-white/10 bg-white/5 font-bold hover:bg-white/10 transition-colors">
            <CalendarDays className="w-4 h-4 opacity-70" />
            <span className="text-[10px] uppercase">Customizar</span>
          </Button>

          <Button 
            size="sm" 
            className="gap-2 h-9 font-bold bg-accent hover:bg-accent/90 text-white border-0 shadow-[0_0_20px_rgba(99,102,241,0.2)]"
          >
            <RotateCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
            <span className="text-[10px] uppercase tracking-wider">Forçar Sinc</span>
          </Button>
        </div>
      </div>
    </header>
  );
}

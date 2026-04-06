"use client";

import { useAppStore } from "@/store/useAppStore";
import { formatCurrency, formatPercent } from "@/lib/formatters";
import { TrendingUp, Target, AlertCircle } from "lucide-react";
import { useMemo } from "react";

export function PaceMonitor() {
  const { dataA, monthlyBudget } = useAppStore();

  const metrics = useMemo(() => {
    const totalSpend = dataA.reduce((acc, curr) => acc + parseFloat(curr.spend || "0"), 0);
    const progress = (totalSpend / monthlyBudget) * 100;
    
    // Day of month projection
    const today = new Date();
    const dayOfMonth = today.getDate();
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    const expectedPace = (dayOfMonth / daysInMonth) * 100;
    
    const isOverPacing = progress > expectedPace + 5;
    const isUnderPacing = progress < expectedPace - 5;

    return {
      totalSpend,
      progress,
      expectedPace,
      isOverPacing,
      isUnderPacing,
      remaining: Math.max(0, monthlyBudget - totalSpend),
      projected: (totalSpend / dayOfMonth) * daysInMonth,
    };
  }, [dataA, monthlyBudget]);

  return (
    <div className="glass p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-muted uppercase tracking-widest flex items-center gap-2">
          <Target className="w-4 h-4 text-accent" />
          Ritmo de Gasto Mensal
        </h3>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-white/5 border border-white/10 uppercase tracking-tighter">
          Meta: {formatCurrency(monthlyBudget)}
        </span>
      </div>

      <div className="space-y-4">
        <div className="flex items-end justify-between text-sm">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-muted uppercase">Gasto Atual</span>
            <span className="text-xl font-bold mono">{formatCurrency(metrics.totalSpend)}</span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-[10px] font-bold text-muted uppercase">Progresso do Mês</span>
            <span className={metrics.isOverPacing ? "text-danger" : "text-success"}>
              {formatPercent(metrics.progress)}
            </span>
          </div>
        </div>

        <div className="relative h-3 w-full bg-white/5 rounded-full overflow-hidden border border-white/5 shadow-inner">
          <div 
            className="absolute top-0 bottom-0 left-0 bg-accent transition-all duration-1000 ease-out shadow-[0_0_12px_rgba(99,102,241,0.5)]"
            style={{ width: `${Math.min(100, metrics.progress)}%` }}
          />
          {/* Expected pace marker */}
          <div 
            className="absolute top-0 bottom-0 w-0.5 bg-white/40 z-10 dashed"
            style={{ left: `${metrics.expectedPace}%` }}
          />
        </div>

        <div className="grid grid-cols-2 gap-4 pt-2">
          <div className="p-3 rounded-lg bg-white/[0.02] border border-white/5">
            <span className="text-[9px] font-bold text-muted uppercase block mb-1">Restante</span>
            <span className="text-sm font-bold mono">{formatCurrency(metrics.remaining)}</span>
          </div>
          <div className="p-3 rounded-lg bg-white/[0.02] border border-white/5">
            <span className="text-[9px] font-bold text-muted uppercase block mb-1">Projeção Final</span>
            <span className="text-sm font-bold mono">{formatCurrency(metrics.projected)}</span>
          </div>
        </div>

        {metrics.isOverPacing && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-danger/10 border border-danger/20 text-danger animate-pulse">
            <AlertCircle className="w-4 h-4" />
            <span className="text-[10px] font-bold uppercase tracking-tight">O gasto está acima do planejado para hoje</span>
          </div>
        )}
      </div>
    </div>
  );
}

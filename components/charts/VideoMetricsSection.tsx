"use client";

import { useAppStore } from "@/store/useAppStore";
import { calculateHookRate, calculateHoldRate } from "@/services/rulesEngine";
import { Video, MousePointer2, PlayCircle, BarChart2 } from "lucide-react";
import { useMemo } from "react";
import { formatPercent } from "@/lib/formatters";

export function VideoMetricsSection() {
  const { dataA } = useAppStore();

  const metrics = useMemo(() => {
    if (dataA.length === 0) return null;

    let totalHook = 0;
    let totalHold = 0;
    let count = 0;

    dataA.forEach(c => {
      const hRate = calculateHookRate(c);
      const ldRate = calculateHoldRate(c);
      if (hRate > 0 || ldRate > 0) {
        totalHook += hRate;
        totalHold += ldRate;
        count++;
      }
    });

    return {
      avgHook: count > 0 ? totalHook / count : 0,
      avgHold: count > 0 ? totalHold / count : 0,
       // Internal comparison stats
      highHook: 25, // Benchmark
      highHold: 15, // Benchmark
    };
  }, [dataA]);

  if (!metrics) return null;

  return (
    <div className="glass p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-muted uppercase tracking-widest flex items-center gap-2">
          <Video className="w-4 h-4 text-accent" />
          Análise de Criativos (Vídeo)
        </h3>
        <BarChart2 className="w-4 h-4 text-muted opacity-50" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MousePointer2 className="w-3.5 h-3.5 text-accent" />
              <span className="text-[10px] font-bold text-muted uppercase">Hook Rate (3s)</span>
            </div>
            <span className="text-xs font-bold mono">{formatPercent(metrics.avgHook)}</span>
          </div>
          <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
            <div 
              className="h-full bg-accent shadow-[0_0_8px_rgba(99,102,241,0.4)]"
              style={{ width: `${Math.min(100, (metrics.avgHook / metrics.highHook) * 100)}%` }}
            />
          </div>
          <p className="text-[9px] text-muted leading-tight">
            Porcentagem das pessoas que pararam para ver os primeiros 3 segundos.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <PlayCircle className="w-3.5 h-3.5 text-success" />
              <span className="text-[10px] font-bold text-muted uppercase">Hold Rate (25%)</span>
            </div>
            <span className="text-xs font-bold mono">{formatPercent(metrics.avgHold)}</span>
          </div>
          <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
            <div 
              className="h-full bg-success shadow-[0_0_8px_rgba(16,185,129,0.4)]"
              style={{ width: `${Math.min(100, (metrics.avgHold / metrics.highHold) * 100)}%` }}
            />
          </div>
          <p className="text-[9px] text-muted leading-tight">
            Porcentagem das pessoas que continuaram assistindo após o gancho inicial.
          </p>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useMemo, useState } from "react";
import { useAppStore } from "@/store/useAppStore";
import { extractMetric, formatCurrency, LEAD_ACTION_TYPES, CONVERSATION_ACTION_TYPES } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import { Brain, Info, Clock, MousePointer2 } from "lucide-react";

type MetricType = "leads" | "spend" | "cpl" | "conversations";

export function HourlyHeatmap() {
  const { hourlyDataA } = useAppStore();
  const [activeMetric, setActiveMetric] = useState<MetricType>("leads");

  const heatmapData = useMemo(() => {
    // Grid: 7 days (rows) x 24 hours (cols)
    const grid = Array.from({ length: 7 }, () => Array.from({ length: 24 }, () => ({
      leads: 0,
      spend: 0,
      conversations: 0,
      count: 0
    })));

    hourlyDataA.forEach((row) => {
      const hourStr = row.hourly_stats_aggregated_by_audience_time_zone;
      if (!hourStr) return;

      // Meta returns this as "H_M" (e.g. "0_0", "13_0") or "HH:MM:SS" or "HH:MM-HH:MM"
      let hourIdx: number;
      if (hourStr.includes("_")) {
        // Format: "0_0", "13_0" → hour is before underscore
        hourIdx = parseInt(hourStr.split("_")[0]);
      } else if (hourStr.includes(":")) {
        // Format: "00:00:00" or "00:00-00:59"
        hourIdx = parseInt(hourStr.split(":")[0]);
      } else {
        hourIdx = parseInt(hourStr);
      }
      if (isNaN(hourIdx) || hourIdx < 0 || hourIdx > 23) return;

      const date = new Date(row.date_start);
      const dayIdx = date.getUTCDay(); // 0-6

      const cell = grid[dayIdx][hourIdx];
      cell.spend += parseFloat(row.spend || "0");
      cell.leads += extractMetric(row.actions, LEAD_ACTION_TYPES);
      cell.conversations += extractMetric(row.actions, CONVERSATION_ACTION_TYPES);
      cell.count += 1;
    });

    return grid;
  }, [hourlyDataA]);

  const maxVal = useMemo(() => {
    let max = 0;
    heatmapData.forEach(row => row.forEach(cell => {
      const val = activeMetric === "cpl" 
        ? (cell.leads > 0 ? cell.spend / cell.leads : 0)
        : cell[activeMetric as keyof typeof cell] as number;
      if (val > max) max = val;
    }));
    return max || 1;
  }, [heatmapData, activeMetric]);

  const getIntensity = (val: number) => {
    if (val === 0) return "bg-white/[0.02]";
    const ratio = Math.min(val / maxVal, 1);
    
    // Scale from soft blue (low) to deep blue/accent (high)
    if (activeMetric === "cpl") {
      // For CPL, high is BAD (red), low is GOOD (green)
      return ratio > 0.8 ? "bg-red-500/80" : ratio > 0.5 ? "bg-orange-500/60" : "bg-emerald-500/60";
    }
    
    if (ratio > 0.8) return "bg-accent/100 shadow-[0_0_10px_rgba(var(--accent-rgb),0.5)]";
    if (ratio > 0.6) return "bg-accent/80";
    if (ratio > 0.4) return "bg-accent/60";
    if (ratio > 0.2) return "bg-accent/40";
    return "bg-accent/20";
  };

  const daysLabels = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
  const hourLabels = Array.from({ length: 24 }, (_, i) => `${i.toString().padStart(2, "0")}h`);

  const metrics: { id: MetricType; label: string }[] = [
    { id: "leads", label: "Volume de Leads" },
    { id: "cpl", label: "Custo por Lead (CPL)" },
    { id: "conversations", label: "Conversas" },
    { id: "spend", label: "Investimento" },
  ];

  return (
    <div className="glass p-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-accent/10 rounded-lg">
            <Clock className="w-5 h-5 text-accent" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-widest">Inteligência de Horários (Heatmap)</h3>
            <p className="text-[10px] text-muted font-medium mt-0.5">Identificação de janelas de alta performance e desperdício.</p>
          </div>
        </div>

        <div className="flex bg-white/5 p-1 rounded-xl border border-white/10 shrink-0">
          {metrics.map((m) => (
            <button
              key={m.id}
              onClick={() => setActiveMetric(m.id)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all uppercase tracking-tight",
                activeMetric === m.id ? "bg-accent text-white shadow-lg" : "text-muted hover:text-white"
              )}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
        {/* Day Column */}
        <div className="flex flex-col pt-8 gap-1 pr-2">
          {daysLabels.map((day, i) => (
            <div key={i} className="h-8 flex items-center justify-end text-[10px] font-bold text-muted uppercase tracking-tighter w-10">
              {day}
            </div>
          ))}
        </div>

        {/* Heatmap Grid */}
        <div className="flex-1 flex flex-col gap-1 min-w-[800px]">
          <div className="flex h-8 gap-1">
            {hourLabels.map((h, i) => (
              <div key={i} className="flex-1 flex items-center justify-center text-[10px] font-bold text-muted uppercase tracking-tighter">
                {h}
              </div>
            ))}
          </div>

          {heatmapData.map((row, dayIdx) => (
            <div key={dayIdx} className="flex gap-1 h-8">
              {row.map((cell, hourIdx) => {
                const val = activeMetric === "cpl" 
                  ? (cell.leads > 0 ? cell.spend / cell.leads : 0)
                  : cell[activeMetric as keyof typeof cell] as number;
                
                return (
                  <div
                    key={hourIdx}
                    title={`${daysLabels[dayIdx]}, ${hourIdx}h\n${activeMetric}: ${activeMetric === "cpl" || activeMetric === "spend" ? formatCurrency(val) : val}`}
                    className={cn(
                      "flex-1 rounded-sm border border-white/[0.03] transition-all duration-500 hover:scale-[1.15] hover:z-10 hover:shadow-2xl cursor-crosshair relative group",
                      getIntensity(val)
                    )}
                  >
                    {val > maxVal * 0.9 && (
                      <div className="absolute inset-0 border border-white/20 rounded-sm animate-pulse" />
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-white/5">
        <div className="flex items-start gap-3">
          <Brain className="w-4 h-4 text-success mt-1" />
          <div className="space-y-1">
            <h4 className="text-[10px] font-bold text-white uppercase tracking-widest">Oportunidade de Escala</h4>
            <p className="text-[11px] text-muted leading-relaxed">Janelas com alta densidade de cor e baixo CPL representam os períodos ideais para aumentar o orçamento.</p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <div className="p-1.5 h-4 w-4 rounded-full bg-red-500/40 border border-red-500/20 mt-1" />
          <div className="space-y-1">
            <h4 className="text-[10px] font-bold text-white uppercase tracking-widest">Zonas de Desperdício</h4>
            <p className="text-[11px] text-muted leading-relaxed">Quadrantes em vermelho (CPL alto) indicam horários onde a verba está sendo consumida sem conversão proporcional.</p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <Info className="w-4 h-4 text-accent mt-1" />
          <div className="space-y-1">
            <h4 className="text-[10px] font-bold text-white uppercase tracking-widest">Base de Dados</h4>
            <p className="text-[11px] text-muted leading-relaxed">Considerando o fuso horário da audiência para decisões granulares de bidding (Regra de 24h).</p>
          </div>
        </div>
      </div>
    </div>
  );
}

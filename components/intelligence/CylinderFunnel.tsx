"use client";

import { useMemo } from "react";
import { useAppStore } from "@/store/useAppStore";
import { extractMetric, formatNumber, LEAD_ACTION_TYPES, CONVERSATION_ACTION_TYPES } from "@/lib/formatters";
import { safeArray } from "@/lib/safeArray";
import { Eye, MousePointer2, UserCheck, MessageSquare, ShoppingCart, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function CylinderFunnel() {
  const { dataA, crmLeads } = useAppStore();

  const stages = useMemo(() => {
    let impressions = 0, clicks = 0, leads = 0, conversations = 0;
    safeArray(dataA).forEach(row => {
      impressions += parseInt(row.impressions || "0");
      clicks += parseInt(row.clicks || "0");
      leads += extractMetric(row.actions, LEAD_ACTION_TYPES);
      conversations += extractMetric(row.actions, CONVERSATION_ACTION_TYPES);
    });
    const sales = crmLeads.filter(l => l.status === "converted").length;

    return [
      { label: "Impressões", value: impressions,   color: "#6366f1", icon: Eye },
      { label: "Cliques",    value: clicks,        color: "#8b5cf6", icon: MousePointer2 },
      { label: "Conversas",  value: conversations, color: "#f59e0b", icon: MessageSquare },
      { label: "Vendas",     value: sales,         color: "#ef4444", icon: ShoppingCart },
    ];
  }, [dataA, crmLeads]);

  const maxVal = Math.max(...stages.map(s => s.value), 1);

  return (
    <div className="glass p-6 sm:p-8 animate-in fade-in duration-700">
      <div className="mb-6">
        <h3 className="text-sm font-black text-white uppercase tracking-widest">Funil de Conversão</h3>
        <p className="text-[10px] text-muted font-medium mt-1">Da impressão até a venda real — visão completa do seu pipeline.</p>
      </div>

      {/* Horizontal funnel */}
      <div className="flex items-stretch gap-0 overflow-x-auto pb-2">
        {stages.map((stage, i) => {
          const heightPercent = Math.max(30, (stage.value / maxVal) * 100);
          const prevValue = i > 0 ? stages[i - 1].value : stage.value;
          const convRate = prevValue > 0 ? ((stage.value / prevValue) * 100).toFixed(1) : "—";

          return (
            <div key={stage.label} className="flex items-center flex-shrink-0">
              {/* Stage block */}
              <div className="flex flex-col items-center gap-2 w-28 sm:w-36">
                {/* Bar */}
                <div className="w-full flex flex-col items-center justify-end" style={{ height: 120 }}>
                  <div
                    className="w-full rounded-t-lg transition-all duration-700 flex items-end justify-center pb-2"
                    style={{
                      height: `${heightPercent}%`,
                      background: `linear-gradient(180deg, ${stage.color}60 0%, ${stage.color}20 100%)`,
                      border: `1px solid ${stage.color}40`,
                      minHeight: 32,
                    }}
                  >
                    <stage.icon className="w-4 h-4 opacity-80" style={{ color: stage.color }} />
                  </div>
                </div>

                {/* Value */}
                <span className="text-base sm:text-lg font-black mono text-white">
                  {formatNumber(stage.value)}
                </span>

                {/* Label */}
                <span className="text-[9px] font-bold text-muted uppercase tracking-widest text-center leading-tight">
                  {stage.label}
                </span>

                {/* Conv rate badge */}
                {i > 0 && (
                  <span
                    className="text-[9px] font-bold px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: `${stage.color}20`, color: stage.color }}
                  >
                    {convRate}%
                  </span>
                )}
              </div>

              {/* Arrow between stages */}
              {i < stages.length - 1 && (
                <ChevronRight className="w-4 h-4 text-white/20 flex-shrink-0 mx-1" />
              )}
            </div>
          );
        })}
      </div>

      {/* Summary row */}
      <div className="mt-6 pt-4 border-t border-white/5 grid grid-cols-3 gap-4">
        {[
          { label: "CTR Geral", value: stages[0].value > 0 ? ((stages[1].value / stages[0].value) * 100).toFixed(2) + "%" : "0.00%", color: "text-accent" },
          { label: "Click → Lead", value: stages[1].value > 0 ? ((stages[2].value / stages[1].value) * 100).toFixed(2) + "%" : "0.00%", color: "text-emerald-400" },
          { label: "Lead → Venda", value: stages[2]?.value > 0 && stages[3]?.value > 0 ? ((stages[3].value / stages[2].value) * 100).toFixed(2) + "%" : "0.00%", color: "text-red-400" },
        ].map(item => (
          <div key={item.label} className="text-center">
            <span className="text-[10px] font-bold text-muted uppercase tracking-widest block mb-1">{item.label}</span>
            <span className={cn("text-base font-black mono", item.color)}>{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

"use client";

import { useMemo } from "react";
import { useAppStore } from "@/store/useAppStore";
import { extractMetric, formatNumber, formatCurrency, LEAD_ACTION_TYPES, CONVERSATION_ACTION_TYPES } from "@/lib/formatters";
import { Eye, MousePointer2, UserCheck, MessageSquare, ShoppingCart } from "lucide-react";

interface FunnelStage {
  label: string;
  value: number;
  color: string;
  icon: any;
  bgGradient: string;
}

export function CylinderFunnel() {
  const { dataA, crmLeads } = useAppStore();

  const stages = useMemo((): FunnelStage[] => {
    let impressions = 0, clicks = 0, leads = 0, conversations = 0;

    dataA.forEach(row => {
      impressions += parseInt(row.impressions || "0");
      clicks += parseInt(row.clicks || "0");
      leads += extractMetric(row.actions, LEAD_ACTION_TYPES);
      conversations += extractMetric(row.actions, CONVERSATION_ACTION_TYPES);
    });

    const sales = crmLeads.filter(l => l.status === "converted").length;

    return [
      { label: "Impressões", value: impressions, color: "#6366f1", icon: Eye, bgGradient: "from-indigo-600/30 to-indigo-900/10" },
      { label: "Cliques", value: clicks, color: "#8b5cf6", icon: MousePointer2, bgGradient: "from-violet-600/30 to-violet-900/10" },
      { label: "Leads", value: leads, color: "#10b981", icon: UserCheck, bgGradient: "from-emerald-600/30 to-emerald-900/10" },
      { label: "Conversas", value: conversations, color: "#f59e0b", icon: MessageSquare, bgGradient: "from-amber-600/30 to-amber-900/10" },
      { label: "Vendas", value: sales, color: "#ef4444", icon: ShoppingCart, bgGradient: "from-red-600/30 to-red-900/10" },
    ];
  }, [dataA, crmLeads]);

  const maxVal = Math.max(stages[0]?.value || 1, 1);

  return (
    <div className="glass p-6 sm:p-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className="text-sm font-black text-white uppercase tracking-widest">Funil de Conversão</h3>
          <p className="text-[10px] text-muted font-medium mt-1">Da impressão até a venda real — visão completa do seu pipeline.</p>
        </div>
      </div>

      <div className="flex flex-col items-center gap-0 relative py-4">
        {/* Connector line */}
        <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-px bg-gradient-to-b from-indigo-500/30 via-emerald-500/30 to-red-500/30 z-0" />

        {stages.map((stage, i) => {
          const widthPercent = Math.max(20, (stage.value / maxVal) * 100);
          const prevValue = i > 0 ? stages[i - 1].value : stage.value;
          const convRate = prevValue > 0 ? ((stage.value / prevValue) * 100).toFixed(1) : "0.0";

          return (
            <div key={stage.label} className="relative z-10 w-full flex flex-col items-center group">
              {/* Conversion rate between stages */}
              {i > 0 && (
                <div className="py-2 flex items-center gap-2">
                  <div className="h-px w-8 bg-white/10" />
                  <span className="text-[10px] font-black text-white/40 uppercase tracking-widest mono">
                    {convRate}%
                  </span>
                  <div className="h-px w-8 bg-white/10" />
                </div>
              )}

              {/* Cylinder stage */}
              <div
                className="relative transition-all duration-700 ease-out group-hover:scale-[1.02]"
                style={{ width: `${widthPercent}%`, minWidth: "180px", maxWidth: "100%" }}
              >
                {/* Top ellipse */}
                <div
                  className="h-4 rounded-[50%] border-t border-x border-white/10 relative z-20"
                  style={{
                    background: `linear-gradient(180deg, ${stage.color}33 0%, ${stage.color}11 100%)`,
                    borderColor: `${stage.color}33`,
                  }}
                />

                {/* Body */}
                <div
                  className="relative -mt-1 px-4 sm:px-6 py-4 sm:py-5 flex items-center justify-between border-x border-white/5"
                  style={{
                    background: `linear-gradient(180deg, ${stage.color}15 0%, ${stage.color}05 100%)`,
                    borderColor: `${stage.color}22`,
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="p-2 rounded-lg"
                      style={{ backgroundColor: `${stage.color}20` }}
                    >
                      <stage.icon className="w-4 h-4" style={{ color: stage.color }} />
                    </div>
                    <span className="text-xs font-bold text-white uppercase tracking-wider">{stage.label}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-lg sm:text-xl font-black mono text-white">{formatNumber(stage.value)}</span>
                  </div>
                </div>

                {/* Bottom ellipse */}
                <div
                  className="h-4 rounded-[50%] -mt-1 relative z-20 border-b border-x border-white/10"
                  style={{
                    background: `linear-gradient(0deg, ${stage.color}22 0%, ${stage.color}08 100%)`,
                    borderColor: `${stage.color}22`,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom summary */}
      <div className="mt-6 pt-6 border-t border-white/5 grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="text-center">
          <span className="text-[10px] font-bold text-muted uppercase tracking-widest block mb-1">CTR Geral</span>
          <span className="text-base font-black mono text-accent">
            {stages[0].value > 0 ? ((stages[1].value / stages[0].value) * 100).toFixed(2) : "0.00"}%
          </span>
        </div>
        <div className="text-center">
          <span className="text-[10px] font-bold text-muted uppercase tracking-widest block mb-1">Click → Lead</span>
          <span className="text-base font-black mono text-emerald-400">
            {stages[1].value > 0 ? ((stages[2].value / stages[1].value) * 100).toFixed(2) : "0.00"}%
          </span>
        </div>
        <div className="text-center col-span-2 sm:col-span-1">
          <span className="text-[10px] font-bold text-muted uppercase tracking-widest block mb-1">Lead → Venda</span>
          <span className="text-base font-black mono text-red-400">
            {stages[2].value > 0 ? ((stages[4].value / stages[2].value) * 100).toFixed(2) : "0.00"}%
          </span>
        </div>
      </div>
    </div>
  );
}

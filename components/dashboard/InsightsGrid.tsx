"use client";

import { useAppStore } from "@/store/useAppStore";
import { TrendingUp, TrendingDown, Zap, Calendar, Wallet } from "lucide-react";
import { extractMetric, formatCurrency } from "@/lib/formatters";
import { getOpportunityCost } from "@/services/rulesEngine";
import { useMemo } from "react";

export function InsightsGrid() {
  const { dataA, targetCPA, crmLeads } = useAppStore();

  const insights = useMemo(() => {
    if (dataA.length === 0) return [];

    const totalLeads = dataA.reduce((acc, curr) => acc + extractMetric(curr.actions, ['lead']), 0);
    const totalSpend = dataA.reduce((acc, curr) => acc + parseFloat(curr.spend || "0"), 0);
    const avgCpa = totalLeads > 0 ? totalSpend / totalLeads : 0;
    
    // Opportunity Cost
    const oppCost = getOpportunityCost(dataA, targetCPA);
    
    // Day of week analysis
    const dayPerformances: Record<number, { leads: number; spend: number }> = {};
    dataA.forEach(item => {
      const day = new Date(item.date_start).getUTCDay();
      if (!dayPerformances[day]) dayPerformances[day] = { leads: 0, spend: 0 };
      dayPerformances[day].leads += extractMetric(item.actions, ['lead']);
      dayPerformances[day].spend += parseFloat(item.spend || "0");
    });

    const bestDayIndex = Object.keys(dayPerformances).reduce((a, b) => {
      const cpaA = dayPerformances[parseInt(a)].leads > 0 ? dayPerformances[parseInt(a)].spend / dayPerformances[parseInt(a)].leads : Infinity;
      const cpaB = dayPerformances[parseInt(b)].leads > 0 ? dayPerformances[parseInt(b)].spend / dayPerformances[parseInt(b)].leads : Infinity;
      return cpaA < cpaB ? a : b;
    }, "0");

    const days = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

    // ROI Real from CRM
    const convertedLeads = crmLeads.filter(l => l.status === 'converted');
    const totalRevenue = convertedLeads.reduce((acc, curr) => acc + (curr.sale_value || 0), 0);
    const realRoas = totalSpend > 0 ? totalRevenue / totalSpend : 0;

    return [
      {
        title: "Ponto de Equilíbrio",
        value: `R$ ${avgCpa.toFixed(2)}`,
        description: "Custo médio por lead no período.",
        icon: TrendingUp,
        trend: avgCpa < targetCPA ? "positive" : "negative",
      },
      {
        title: "ROI Real (CRM)",
        value: `${realRoas.toFixed(2)}x`,
        description: "Retorno baseado em vendas reais no CRM.",
        icon: Wallet,
        trend: realRoas > 1 ? "positive" : "negative",
      },
      {
        title: "Escalabilidade",
        value: totalLeads > 20 ? "Alta" : "Moderada",
        description: "Métrica de volume para escala via IA.",
        icon: Zap,
        trend: totalLeads > 20 ? "positive" : "neutral",
      },
      {
        title: "Custo de Oportunidade",
        value: formatCurrency(oppCost),
        description: "Gasto acima da meta de CPA.",
        icon: Calendar,
        trend: oppCost > 0 ? "negative" : "positive",
      },
    ];
  }, [dataA, targetCPA, crmLeads]);

  if (insights.length === 0) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {insights.map((insight, idx) => (
        <div key={idx} className="glass p-6 group transition-all hover:translate-y-[-2px] hover:bg-white/[0.05]">
          <div className="flex items-start justify-between mb-4">
            <div className="p-2 rounded-lg bg-accent/10 text-accent group-hover:bg-accent/20 transition-colors">
              <insight.icon className="w-5 h-5" />
            </div>
            {insight.trend === "positive" ? (
              <TrendingUp className="w-4 h-4 text-emerald-400" />
            ) : insight.trend === "negative" ? (
              <TrendingDown className="w-4 h-4 text-rose-400" />
            ) : null}
          </div>
          <h3 className="text-[10px] font-bold text-muted uppercase tracking-widest mb-1">{insight.title}</h3>
          <p className="text-xl font-bold tracking-tight mb-1">{insight.value}</p>
          <p className="text-[10px] text-muted leading-relaxed">{insight.description}</p>
        </div>
      ))}
    </div>
  );
}

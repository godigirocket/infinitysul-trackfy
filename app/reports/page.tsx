"use client";

import { useMemo } from "react";
import { useAppStore } from "@/store/useAppStore";
import { useFinancialStore } from "@/store/useFinancialStore";
import { safeArray } from "@/lib/safeArray";
import { formatCurrency, formatNumber, extractMetric, CONVERSATION_ACTION_TYPES } from "@/lib/formatters";
import { BarChart3, Download, TrendingUp } from "lucide-react";

export default function ReportsPage() {
  const { dataA } = useAppStore();
  const { orders, computeMetrics } = useFinancialStore();

  const adSpend = safeArray(dataA).reduce((s, r) => s + parseFloat(r.spend || "0"), 0);
  const m = computeMetrics(adSpend);

  const campaignReport = useMemo(() => {
    const map: Record<string, any> = {};
    safeArray(dataA).forEach(r => {
      if (!map[r.campaign_id]) map[r.campaign_id] = { name: r.campaign_name, spend: 0, impressions: 0, clicks: 0, convs: 0 };
      map[r.campaign_id].spend += parseFloat(r.spend || "0");
      map[r.campaign_id].impressions += parseInt(r.impressions || "0");
      map[r.campaign_id].clicks += parseInt(r.clicks || "0");
      map[r.campaign_id].convs += extractMetric(r.actions, CONVERSATION_ACTION_TYPES);
    });
    return Object.values(map).sort((a, b) => b.spend - a.spend);
  }, [dataA]);

  const exportCSV = () => {
    const rows = [
      ["Campanha", "Gasto", "Impressões", "Cliques", "Conversas", "CPL"],
      ...campaignReport.map(c => [
        c.name, c.spend.toFixed(2), c.impressions, c.clicks, c.convs,
        c.convs > 0 ? (c.spend / c.convs).toFixed(2) : "0",
      ]),
    ];
    const csv = rows.map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "relatorio-campanhas.csv"; a.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Relatórios</h1>
          <p className="text-sm text-muted mt-1">Visão consolidada de performance e financeiro.</p>
        </div>
        <button onClick={exportCSV} className="flex items-center gap-2 px-4 py-2 bg-white/10 border border-white/10 rounded-xl text-sm font-bold hover:bg-white/20 transition-all">
          <Download className="w-4 h-4" /> Exportar CSV
        </button>
      </div>

      {/* Financial summary */}
      <div className="glass p-5 space-y-4">
        <h2 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-accent" /> Resumo Financeiro
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Faturamento", value: formatCurrency(m.grossRevenue) },
            { label: "Lucro", value: formatCurrency(m.profit) },
            { label: "ROAS", value: `${m.roas.toFixed(2)}x` },
            { label: "ROI", value: `${m.roi.toFixed(1)}%` },
          ].map(k => (
            <div key={k.label} className="bg-white/[0.03] rounded-xl p-3 text-center">
              <span className="text-[10px] font-bold text-muted uppercase block mb-1">{k.label}</span>
              <span className="text-lg font-black mono text-white">{k.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Campaign table */}
      <div className="glass overflow-hidden">
        <div className="p-4 border-b border-white/5 flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-accent" />
          <h2 className="text-sm font-bold text-white uppercase tracking-widest">Performance por Campanha</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/5 bg-white/[0.02]">
                {["Campanha", "Gasto", "Impressões", "Cliques", "CTR", "Conversas", "CPL"].map(h => (
                  <th key={h} className="px-4 py-3 text-[10px] font-bold text-muted uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.03]">
              {campaignReport.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-muted text-sm">Sincronize o Meta Ads para ver os dados.</td></tr>
              ) : campaignReport.map((c, i) => {
                const ctr = c.impressions > 0 ? (c.clicks / c.impressions * 100).toFixed(2) : "0.00";
                const cpl = c.convs > 0 ? c.spend / c.convs : 0;
                return (
                  <tr key={i} className="hover:bg-white/[0.02] transition-all">
                    <td className="px-4 py-3 text-sm font-bold text-white max-w-xs truncate">{c.name}</td>
                    <td className="px-4 py-3 text-sm mono">{formatCurrency(c.spend)}</td>
                    <td className="px-4 py-3 text-sm mono">{formatNumber(c.impressions)}</td>
                    <td className="px-4 py-3 text-sm mono">{formatNumber(c.clicks)}</td>
                    <td className="px-4 py-3 text-sm mono">{ctr}%</td>
                    <td className="px-4 py-3 text-sm mono text-warning font-bold">{formatNumber(c.convs)}</td>
                    <td className="px-4 py-3 text-sm mono">{cpl > 0 ? formatCurrency(cpl) : "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useAppStore } from "@/store/useAppStore";
import { useGemini } from "@/hooks/useGemini";
import { Sparkles, Loader2, Send, Quote, MessageCircle } from "lucide-react";
import { useState, useMemo } from "react";
import { formatCurrency, formatNumber, extractMetric, LEAD_ACTION_TYPES, CONVERSATION_ACTION_TYPES } from "@/lib/formatters";
import { safeArray } from "@/lib/safeArray";

export function ExecutiveSummary() {
  const { dataA, geminiKey } = useAppStore();
  const { getInsight, loading } = useGemini();
  const [report, setReport] = useState<string | null>(null);

  const metrics = useMemo(() => {
    const totalSpend = safeArray(dataA).reduce((acc, r) => acc + parseFloat(r.spend || "0"), 0);
    const totalLeads = safeArray(dataA).reduce((acc, r) => acc + extractMetric(r.actions, LEAD_ACTION_TYPES), 0);
    const totalConvs = safeArray(dataA).reduce((acc, r) => acc + extractMetric(r.actions, CONVERSATION_ACTION_TYPES), 0);
    const totalImps = safeArray(dataA).reduce((acc, r) => acc + parseInt(r.impressions || "0"), 0);
    const totalClicks = safeArray(dataA).reduce((acc, r) => acc + parseInt(r.clicks || "0"), 0);
    const avgCpl = totalLeads > 0 ? totalSpend / totalLeads : 0;
    const ctr = totalImps > 0 ? (totalClicks / totalImps) * 100 : 0;
    return { totalSpend, totalLeads, totalConvs, avgCpl, ctr, totalImps, totalClicks };
  }, [dataA]);

  const generateReport = async () => {
    const prompt = `Você é um especialista em Growth Marketing focado em resultados para diretores.
Resuma a performance atual destas campanhas de Meta Ads:
- Investimento Total: ${formatCurrency(metrics.totalSpend)}
- Total de Leads: ${formatNumber(metrics.totalLeads)}
- Conversas Iniciadas: ${formatNumber(metrics.totalConvs)}
- CPL Médio: ${formatCurrency(metrics.avgCpl)}
- CTR: ${metrics.ctr.toFixed(2)}%
Escreva um parágrafo curto (máximo 4 linhas) em tom profissional e executivo.
Foque no que importa para o bolso do dono (ROI e Eficiência).
Termine com uma "Próxima Ação" clara.`;

    const result = await getInsight(prompt);
    setReport(result);
  };

  // WhatsApp share always includes real metrics — Gemini summary is bonus
  const shareToWhatsApp = () => {
    const lines = [
      `*📊 Relatório Meta Ads — Trackfy*`,
      ``,
      `💰 Investimento: ${formatCurrency(metrics.totalSpend)}`,
      `👥 Leads: ${formatNumber(metrics.totalLeads)}`,
      `💬 Conversas: ${formatNumber(metrics.totalConvs)}`,
      `📉 CPL Médio: ${formatCurrency(metrics.avgCpl)}`,
      `🖱️ CTR: ${metrics.ctr.toFixed(2)}%`,
      `👁️ Impressões: ${formatNumber(metrics.totalImps)}`,
    ];
    if (report) {
      lines.push(``, `*Análise IA:*`, report);
    }
    lines.push(``, `_Gerado pelo TrackfySuper Dash_`);
    window.open(`https://wa.me/?text=${encodeURIComponent(lines.join("\n"))}`, "_blank");
  };

  const hasData = metrics.totalSpend > 0;

  return (
    <div className="glass p-6 relative overflow-hidden group">
      <div className="flex items-center justify-between mb-4 relative z-10">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-accent/20 text-accent">
            <Sparkles className="w-4 h-4" />
          </div>
          <h3 className="text-xs font-bold text-muted uppercase tracking-widest">Resumo Executivo</h3>
        </div>
        <div className="flex items-center gap-2">
          {/* WhatsApp share — always available when there's data */}
          {hasData && (
            <button
              onClick={shareToWhatsApp}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-success/20 text-success hover:bg-success/30 transition-colors text-[10px] font-bold uppercase"
              title="Compartilhar métricas no WhatsApp"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              WhatsApp
            </button>
          )}
          {/* Gemini AI — only show if key is configured */}
          {geminiKey && (
            <button
              onClick={generateReport}
              disabled={loading}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-accent text-[10px] font-bold uppercase transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
              Gerar IA
            </button>
          )}
        </div>
      </div>

      {/* Always-visible metrics summary */}
      {hasData && (
        <div className="grid grid-cols-3 gap-3 mb-4 relative z-10">
          {[
            { label: "Investimento", value: formatCurrency(metrics.totalSpend), color: "text-white" },
            { label: "Leads", value: formatNumber(metrics.totalLeads), color: "text-accent" },
            { label: "Conversas", value: formatNumber(metrics.totalConvs), color: "text-warning" },
            { label: "CPL Médio", value: formatCurrency(metrics.avgCpl), color: "text-white" },
            { label: "CTR", value: `${metrics.ctr.toFixed(2)}%`, color: "text-white" },
            { label: "Impressões", value: formatNumber(metrics.totalImps), color: "text-muted" },
          ].map(m => (
            <div key={m.label} className="bg-white/[0.03] rounded-lg p-2.5 border border-white/5">
              <span className="text-[9px] font-bold text-muted uppercase tracking-widest block mb-0.5">{m.label}</span>
              <span className={`text-sm font-black mono ${m.color}`}>{m.value}</span>
            </div>
          ))}
        </div>
      )}

      <div className="min-h-[60px] flex flex-col justify-center relative z-10">
        {report ? (
          <div className="space-y-3 animate-in fade-in duration-500">
            <div className="relative">
              <Quote className="absolute -left-2 -top-2 w-8 h-8 text-white/5 -z-10" />
              <p className="text-sm leading-relaxed text-white/90 italic">{report}</p>
            </div>
          </div>
        ) : (
          <div className="text-center py-3 border-2 border-dashed border-white/5 rounded-xl">
            <p className="text-[10px] text-muted font-bold uppercase tracking-widest">
              {geminiKey ? "Clique em Gerar IA para análise estratégica" : "Configure a Gemini Key em Configurações para análise por IA"}
            </p>
          </div>
        )}
      </div>

      <div className="absolute -right-20 -bottom-20 w-60 h-60 bg-accent/10 blur-[100px] pointer-events-none rounded-full" />
    </div>
  );
}

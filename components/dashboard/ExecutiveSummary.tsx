"use client";

import { useAppStore } from "@/store/useAppStore";
import { useGemini } from "@/hooks/useGemini";
import { Sparkles, Loader2, Send, Quote } from "lucide-react";
import { useState } from "react";
import { formatCurrency, formatNumber, extractMetric } from "@/lib/formatters";

export function ExecutiveSummary() {
  const { dataA } = useAppStore();
  const { getInsight, loading } = useGemini();
  const [report, setReport] = useState<string | null>(null);

  const generateReport = async () => {
    const totalSpend = dataA.reduce((acc, curr) => acc + parseFloat(curr.spend || "0"), 0);
    const totalLeads = dataA.reduce((acc, curr) => acc + extractMetric(curr.actions, ['lead']), 0);
    const avgCpl = totalLeads > 0 ? totalSpend / totalLeads : 0;
    
    const prompt = `
      Você é um especialista em Growth Marketing focado em resultados para diretores.
      Resuma a performance atual destas campanhas de Meta Ads:
      - Investimento Total: ${formatCurrency(totalSpend)}
      - Total de Leads: ${formatNumber(totalLeads)}
      - CPL Médio: ${formatCurrency(avgCpl)}
      
      Escreva um parágrafo curto (máximo 4 linhas) em tom profissional e executivo. 
      Foque no que importa para o bolso do dono (ROI e Eficiência).
      Evite termos técnicos demais. Termine com uma "Próxima Ação" clara.
    `;

    const result = await getInsight(prompt);
    setReport(result);
  };

  const shareToWhatsApp = () => {
    if (!report) return;
    const text = encodeURIComponent(`*Relatório Estratégico Trackfy*\n\n${report}\n\n_Gerado automaticamente pelo Super Dash_`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  return (
    <div className="glass p-6 relative overflow-hidden group">
      <div className="flex items-center justify-between mb-4 relative z-10">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-accent/20 text-accent">
            <Sparkles className="w-4 h-4" />
          </div>
          <h3 className="text-xs font-bold text-muted uppercase tracking-widest">Resumo Executivo (IA)</h3>
        </div>
        <div className="flex items-center gap-2">
          {report && (
            <button 
              onClick={shareToWhatsApp}
              className="p-1.5 rounded-lg bg-success/20 text-success hover:bg-success/30 transition-colors"
              title="Compartilhar no WhatsApp"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          )}
          <button 
            onClick={generateReport}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-accent text-[10px] font-bold uppercase transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
            Gerar Relatório
          </button>
        </div>
      </div>

      <div className="min-h-[80px] flex flex-col justify-center relative z-10">
        {report ? (
          <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-500">
            <div className="relative">
              <Quote className="absolute -left-2 -top-2 w-8 h-8 text-white/5 -z-10" />
              <p className="text-sm leading-relaxed text-white/90 italic">
                {report}
              </p>
            </div>
            <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            <p className="text-[10px] text-muted uppercase tracking-widest font-bold">
              Relatório gerado via Gemini Pro
            </p>
          </div>
        ) : (
          <div className="text-center py-4 border-2 border-dashed border-white/5 rounded-xl">
             <p className="text-[10px] text-muted font-bold uppercase tracking-widest">
               Clique para gerar o insight estratégico para o diretor
             </p>
          </div>
        )}
      </div>

      {/* Decorative gradient */}
      <div className="absolute -right-20 -bottom-20 w-60 h-60 bg-accent/10 blur-[100px] pointer-events-none rounded-full" />
    </div>
  );
}

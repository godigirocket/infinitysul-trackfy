"use client";

import { useMemo } from "react";
import { useAppStore } from "@/store/useAppStore";
import { extractMetric, formatCurrency } from "@/lib/formatters";
import { Activity, ShieldAlert, Zap, AlertTriangle, TrendingUp, TrendingDown, Target } from "lucide-react";
import { cn } from "@/lib/utils";

export function DeliveryHealth() {
  const { dataA, hierarchy, selectedCampaigns, selectedAdSets } = useAppStore();

  const healthData = useMemo(() => {
    // 1. Filtered data for calculation
    const filtered = dataA.filter(item => {
      if (selectedCampaigns.length > 0 && !selectedCampaigns.includes(item.campaign_id)) return false;
      if (selectedAdSets.length > 0 && !selectedAdSets.includes(item.adset_id || "")) return false;
      return true;
    });

    const totalSpend = filtered.reduce((acc, curr) => acc + parseFloat(curr.spend || "0"), 0);
    const totalLeads = filtered.reduce((acc, curr) => acc + extractMetric(curr.actions, ["lead", "leadgen.other"]), 0);
    const avgCpl = totalLeads > 0 ? totalSpend / totalLeads : 0;
    
    // 2. Frequency Fatigue
    const avgFreq = filtered.length > 0 
      ? filtered.reduce((acc, curr) => acc + parseFloat(curr.frequency || "1"), 0) / filtered.length 
      : 1;

    // 3. Learning Phase Analysis (from Hierarchy)
    const learningAdSets = hierarchy?.adsets.filter(as => 
      as.effective_status.includes("LEARNING") && 
      (selectedCampaigns.length === 0 || selectedCampaigns.includes(as.campaign_id))
    ) || [];

    // 4. Instability (Coefficient of variation of CPL)
    // Simplified: check if last 3 days CPL > account average CPL by 40%
    const recentData = filtered.slice(-3);
    const recentSpend = recentData.reduce((s, c) => s + parseFloat(c.spend || "0"), 0);
    const recentLeads = recentData.reduce((s, c) => s + extractMetric(c.actions, ["lead"]), 0);
    const recentCpa = recentLeads > 0 ? recentSpend / recentLeads : 0;
    const isInstable = recentCpa > avgCpl * 1.4 && avgCpl > 0;

    return {
      avgCpl,
      avgFreq,
      learningCount: learningAdSets.length,
      isInstable,
      learningAdSets,
      totalLeads,
      stabilityScore: isInstable ? "Crítica" : recentCpa > avgCpl * 1.1 ? "Instável" : "Saudável"
    };
  }, [dataA, hierarchy, selectedCampaigns, selectedAdSets]);

  const ScoreCard = ({ title, value, status, icon: Icon, description }: any) => (
    <div className={cn(
      "glass p-5 border-l-4 transition-all hover:bg-white/[0.04]",
      status === "error" ? "border-danger" : status === "warning" ? "border-warning" : "border-success"
    )}>
      <div className="flex items-start justify-between mb-3">
        <div className="p-1.5 rounded-lg bg-white/5 border border-white/10">
          <Icon className={cn("w-4 h-4", 
            status === "error" ? "text-danger" : status === "warning" ? "text-warning" : "text-success"
          )} />
        </div>
        <span className={cn("text-[9px] font-black uppercase tracking-[0.15em] px-2 py-0.5 rounded-full",
          status === "error" ? "bg-danger/10 text-danger" : status === "warning" ? "bg-warning/10 text-warning" : "bg-success/10 text-success"
        )}>
          {status === "error" ? "Crítico" : status === "warning" ? "Atenção" : "Operacional"}
        </span>
      </div>
      <h3 className="text-[10px] font-bold text-muted uppercase tracking-widest mb-1">{title}</h3>
      <p className="text-xl font-bold text-white tracking-tight">{value}</p>
      <p className="text-[10px] text-muted leading-relaxed mt-2">{description}</p>
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <ScoreCard 
          title="Fase de Aprendizado"
          value={`${healthData.learningCount} Conjuntos`}
          status={healthData.learningCount > 2 ? "warning" : "success"}
          icon={Zap}
          description="Algoritmo da Meta em busca de 50 eventos/semana."
        />
        <ScoreCard 
          title="Frequência de Audiência"
          value={healthData.avgFreq.toFixed(2)}
          status={healthData.avgFreq > 2.5 ? "warning" : healthData.avgFreq > 3.5 ? "error" : "success"}
          icon={AlertTriangle}
          description="Acima de 3.5 indica saturação de público (Ad Fatigue)."
        />
        <ScoreCard 
          title="Estabilidade de CPL"
          value={healthData.stabilityScore}
          status={healthData.isInstable ? "error" : healthData.stabilityScore === "Instável" ? "warning" : "success"}
          icon={ShieldAlert}
          description="Variação de custo nos últimos dias vs média histórica."
        />
        <ScoreCard 
          title="Saúde de Entrega"
          value={healthData.totalLeads > 0 ? "Normal" : "Sem Entrega"}
          status={healthData.totalLeads > 0 ? "success" : "error"}
          icon={Target}
          description="Monitoramento em tempo real de disparos da Meta."
        />
      </div>

      <div className="glass p-6 bg-gradient-to-br from-white/[0.03] to-transparent">
        <h3 className="text-xs font-bold text-white uppercase tracking-widest mb-6 flex items-center gap-2">
          <Activity className="w-4 h-4 text-accent" />
          Diagnóstico Operacional de Media Buyer
        </h3>
        
        <div className="space-y-4">
          {healthData.learningCount > 0 && (
            <div className="flex items-start gap-4 p-4 rounded-xl bg-orange-500/5 border border-orange-500/10 transition-colors hover:bg-orange-500/10">
              <Zap className="w-5 h-5 text-warning shrink-0 mt-1" />
              <div>
                <p className="text-xs font-bold text-white mb-1">Aprendizado Ativo Detectado</p>
                <p className="text-[11px] text-muted leading-relaxed">
                  {healthData.learningCount} conjuntos de anúncios ainda não estabilizaram. Evite edições significativas (orçamento, criativo) para não resetar o processo da Meta.
                </p>
                <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
                  {healthData.learningAdSets.map(as => (
                    <span key={as.id} className="text-[9px] font-bold px-2 py-1 bg-white/5 border border-white/10 rounded uppercase text-muted truncate max-w-[150px]">
                      {as.name}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {healthData.avgFreq > 3 && (
            <div className="flex items-start gap-4 p-4 rounded-xl bg-red-500/5 border border-red-500/10 transition-colors hover:bg-red-500/10">
              <AlertTriangle className="w-5 h-5 text-danger shrink-0 mt-1" />
              <div>
                <p className="text-xs font-bold text-white mb-1">Saturação de Criativos (Fatigue)</p>
                <p className="text-[11px] text-muted leading-relaxed">
                  A frequência média atingiu {healthData.avgFreq.toFixed(2)}. Sua audiência está sendo impactada excessivamente pelo mesmo anúncio. O CPL tende a subir. Considere trocar os criativos ou ampliar o público.
                </p>
              </div>
            </div>
          )}

          {!healthData.isInstable && healthData.totalLeads > 5 && (
            <div className="flex items-start gap-4 p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/10 transition-colors hover:bg-emerald-500/10">
              <TrendingUp className="w-5 h-5 text-success shrink-0 mt-1" />
              <div>
                <p className="text-xs font-bold text-white mb-1">Algoritmo em Zona de Performance</p>
                <p className="text-[11px] text-muted leading-relaxed">
                  Entrega estável nas últimas 72 horas. CPL está {healthData.avgCpl > 0 ? "dentro do padrão" : "saudável"}. Oportunidade para aplicar "Aceleração Progressiva" de orçamento (15-20%).
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

"use client";

import { useMemo } from "react";
import { useAppStore } from "@/store/useAppStore";
import { Layers, Activity, ChevronRight, MousePointer2, UserCheck, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";

export function FunnelViz({ intel }: { intel: any[] }) {
  const topCampaigns = intel.slice(0, 5);
  const maxImp = Math.max(...topCampaigns.map(c => c.impressions), 1);

  return (
    <div className="glass p-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center justify-between mb-10 pb-6 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-accent/10 rounded-lg">
            <Layers className="w-5 h-5 text-accent" />
          </div>
          <div>
            <h3 className="text-xs font-black text-white uppercase tracking-[0.2em]">Fluxo de Funil (Account Stack)</h3>
            <p className="text-[10px] text-muted font-medium mt-0.5">Visualização de eficiência da impressão à conversão final.</p>
          </div>
        </div>
      </div>

      <div className="space-y-10">
        {topCampaigns.length === 0 ? (
          <div className="py-20 text-center opacity-20">
            <Layers className="w-12 h-12 mx-auto mb-4" />
            <p className="text-xs uppercase font-bold tracking-widest leading-none">Sem dados de funil para exibir</p>
          </div>
        ) : (
          topCampaigns.map((c) => {
            const impRatio = (c.impressions / maxImp) * 100;
            const clickRatio = c.impressions > 0 ? (c.clicks / c.impressions) * 100 : 0;
            const leadRatio = c.clicks > 0 ? (c.leads / c.clicks) * 100 : 0;
            const convRatio = c.leads > 0 ? (c.conversations / c.leads) * 100 : 0;

            const stages = [
              { label: "Impressões", value: c.impressions.toLocaleString("pt-BR"), ratio: 100, icon: Activity, color: "bg-white/20" },
              { label: "Cliques", value: c.clicks.toLocaleString("pt-BR"), ratio: clickRatio, icon: MousePointer2, color: "bg-accent/60" },
              { label: "Leads", value: c.leads.toLocaleString("pt-BR"), ratio: leadRatio, icon: UserCheck, color: "bg-emerald-500/70" },
              { label: "Conversas", value: c.conversations.toLocaleString("pt-BR"), ratio: convRatio, icon: MessageSquare, color: "bg-orange-500/70" },
            ];

            return (
              <div key={c.campaign_id} className="space-y-4 group">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3 group-hover:translate-x-2 transition-all">
                    <div className={cn(
                      "w-1 h-8 rounded-full",
                      c.signal === 'scale' ? 'bg-success' : c.signal === 'optimize' ? 'bg-danger' : 'bg-warning'
                    )} />
                    <p className="text-xs font-black text-white uppercase tracking-wider truncate max-w-sm">{c.campaign_name}</p>
                  </div>
                  <span className="text-[10px] font-bold text-muted mono">ROI Index: {((c.leads / (c.clicks||1))*100).toFixed(1)}%</span>
                </div>

                <div className="flex items-center gap-1 min-h-[40px]">
                  {stages.map((stage, i) => (
                    <div 
                      key={i} 
                      className="flex-1 flex flex-col gap-2 relative group/stage"
                      style={{ opacity: 0.3 + (stage.ratio / 100) * 0.7 }}
                    >
                      <div className="flex items-center justify-between px-3">
                        <span className="text-[9px] font-bold text-muted uppercase tracking-tighter truncate w-16">{stage.label}</span>
                        <span className="text-[10px] font-bold text-white mono">{stage.value}</span>
                      </div>
                      
                      <div className="h-6 relative overflow-hidden rounded-md bg-white/5 border border-white/5 flex items-center px-3 group-hover/stage:border-white/20 transition-all">
                        <div 
                          className={cn("absolute inset-y-0 left-0 transition-all duration-1000", stage.color)}
                          style={{ width: `${Math.min(Math.max(stage.ratio, 5), 100)}%` }} 
                        />
                        <stage.icon className="w-3 h-3 text-white relative z-10 opacity-60" />
                        {i < stages.length - 1 && (
                          <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 z-20 p-0.5 bg-background rounded-full border border-white/10 group-hover:scale-125 transition-all">
                             <ChevronRight className="w-2.5 h-2.5 text-muted" />
                          </div>
                        )}
                      </div>
                      
                      {i > 0 && (
                        <div className="text-[8px] font-bold tracking-widest text-muted/60 uppercase text-center absolute -bottom-5 w-full">
                          {stage.ratio.toFixed(1)}% Conv
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

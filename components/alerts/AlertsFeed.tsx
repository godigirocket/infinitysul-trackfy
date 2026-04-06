"use client";

import { useAppStore } from "@/store/useAppStore";
import { analyzeCampaigns } from "@/services/rulesEngine";
import { Bell, ShieldAlert, Zap } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/components/ui/Button";
import { extractMetric } from "@/lib/formatters";

export function AlertsFeed() {
  const { dataA, targetCPA } = useAppStore();

  const getCampaigns = () => {
    const campaigns: Record<string, any> = {};
    dataA.forEach(r => {
      const id = r.campaign_id;
      if (!campaigns[id]) {
        campaigns[id] = { 
          id, 
          name: r.campaign_name, 
          spend: 0, 
          imps: 0, 
          clicks: 0, 
          leads: 0, 
          frequency: 0 
        };
      }
      campaigns[id].spend += parseFloat(r.spend || "0");
      campaigns[id].imps += parseInt(r.impressions || "0");
      campaigns[id].clicks += parseInt(r.clicks || "0");
      campaigns[id].frequency = Math.max(campaigns[id].frequency, parseFloat(r.frequency || "0"));
      campaigns[id].leads += extractMetric(r.actions, ['lead']);
    });
    return campaigns;
  };

  const alerts = analyzeCampaigns(getCampaigns(), targetCPA);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 mb-8">
        <Bell className="w-5 h-5 text-accent" />
        <h3 className="text-sm font-bold text-muted uppercase tracking-wider">Alertas Inteligentes</h3>
        {alerts.length > 0 && (
          <Badge variant="destructive" className="ml-auto mono text-[10px] px-1.5 h-5">
            {alerts.length}
          </Badge>
        )}
      </div>

      <div className="space-y-4 overflow-y-auto max-h-[300px] pr-2">
        {alerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Zap className="w-10 h-10 text-muted/20 mb-4" />
            <p className="text-xs font-semibold text-muted">Nenhum alerta crítico ativo.</p>
            <p className="text-[10px] text-muted-foreground mt-1 max-w-[150px]">Sua conta está operando dentro dos parâmetros de ROI.</p>
          </div>
        ) : (
          alerts.map((alert, i) => (
            <div 
              key={i} 
              className={cn(
                "p-4 rounded-xl border flex gap-3 transition-all hover:bg-white/5",
                alert.type === "danger" ? "bg-danger/5 border-danger/10" : "bg-warning/5 border-warning/10"
              )}
            >
              <ShieldAlert className={cn(
                "w-4 h-4 shrink-0",
                alert.type === "danger" ? "text-danger" : "text-warning"
              )} />
              <p className="text-[11px] leading-relaxed font-semibold">
                {alert.message}
              </p>
            </div>
          ))
        )}
      </div>

      <div className="mt-8 pt-8 border-t border-border">
        <p className="text-[9px] font-bold text-muted uppercase tracking-widest leading-relaxed">
          O motor de regras avalia o desempenho a cada 5 minutos para prevenir desperdício de verba.
        </p>
      </div>
    </div>
  );
}

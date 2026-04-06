"use client";

import { useAppStore } from "@/store/useAppStore";
import { 
  formatCurrency, 
  formatNumber, 
  extractMetric 
} from "@/lib/formatters";
import { calculateHealthScore } from "@/services/rulesEngine";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { 
  BarChart3, 
  Download, 
  Lightbulb, 
  ImageIcon,
  ChevronRight
} from "lucide-react";
import { cn } from "@/components/ui/Button";
import { useEffect, useState } from "react";
import { fetchAdThumbnails } from "@/services/metaApi";

export function CampaignsTable() {
  const { dataA, token, searchQuery, statusFilter, isDirectorMode, targetCPA } = useAppStore();
  const [thumbnails, setThumbnails] = useState<Record<string, string>>({});

  // ... (filterItem and campaignMap calculation remains same as above but with latest variables)
  const filterItem = (item: any) => {
    const matchesSearch = item.campaign_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.ad_name?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || 
                          statusFilter === "active"; // Since we removed campaign_status, assume active if they have delivery in insights

    return matchesSearch && matchesStatus;
  };

  const campaignMap: Record<string, any> = {};
  dataA.forEach((r) => {
    if (!filterItem(r)) return;
    const id = r.campaign_id;
    if (!campaignMap[id]) {
      campaignMap[id] = {
        id,
        name: r.campaign_name,
        status: "ACTIVE", // Default to active since we only fetch insights for delivered campaigns
        spend: 0,
        imps: 0,
        clicks: 0,
        leads: 0,
        convs: 0,
        regs: 0,
        frequency: 0,
      };
    }
    const c = campaignMap[id];
    c.spend += parseFloat(r.spend || "0");
    c.imps += parseInt(r.impressions || "0");
    c.clicks += parseInt(r.clicks || "0");
    c.leads += extractMetric(r.actions, ["lead"]);
    c.convs += extractMetric(r.actions, ["onsite_conversion.messaging_conversation_started_7d"]);
    c.regs += extractMetric(r.actions, ["complete_registration"]);
    c.frequency = Math.max(c.frequency, parseFloat(r.frequency || "0"));
  });

  const campaigns = Object.values(campaignMap).sort((a, b) => b.spend - a.spend);

  useEffect(() => {
    campaigns.forEach(async (c) => {
      const cached = localStorage.getItem(`th_${c.id}`);
      if (cached) {
        setThumbnails((prev) => ({ ...prev, [c.id]: cached }));
      } else if (token) {
        const url = await fetchAdThumbnails(c.id, token);
        if (url) {
          localStorage.setItem(`th_${c.id}`, url);
          setThumbnails((prev) => ({ ...prev, [c.id]: url }));
        }
      }
    });
  }, [dataA, token]);

  return (
    <div className="glass overflow-hidden border-white/5 shadow-2xl">
      <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.01]">
        <div className="flex items-center gap-3">
          <BarChart3 className="w-5 h-5 text-accent" />
          <h3 className="text-sm font-bold text-muted uppercase tracking-widest">
            {isDirectorMode ? "Resumo de Performance" : "Inteligência de Campanhas"}
          </h3>
        </div>
        <Button variant="outline" size="sm" className="gap-2 font-bold h-8 text-[10px] border-white/5 hover:bg-white/5">
          <Download className="w-3 h-3" />
          Exportar Relatório
        </Button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-white/[0.02]">
              <th className="px-6 py-4 text-left text-[10px] font-bold text-muted uppercase tracking-wider border-b border-white/5">Campanha</th>
              {!isDirectorMode && <th className="px-6 py-4 text-left text-[10px] font-bold text-muted uppercase tracking-wider border-b border-white/5">Saúde</th>}
              <th className="px-6 py-4 text-left text-[10px] font-bold text-muted uppercase tracking-wider border-b border-white/5">Gasto</th>
              {!isDirectorMode && <th className="px-6 py-4 text-left text-[10px] font-bold text-muted uppercase tracking-wider border-b border-white/5">CTR</th>}
              <th className="px-6 py-4 text-left text-[10px] font-bold text-muted uppercase tracking-wider border-b border-white/5 text-accent">Leads</th>
              <th className="px-6 py-4 text-left text-[10px] font-bold text-muted uppercase tracking-wider border-b border-white/5">CPL</th>
              <th className="px-6 py-4 text-right text-[10px] font-bold text-muted uppercase tracking-wider border-b border-white/5">Sugestão</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.03]">
            {campaigns.map((c) => {
              const score = calculateHealthScore(c, targetCPA);
              const cpl = c.leads > 0 ? c.spend / c.leads : 0;
              const ctr = c.imps > 0 ? (c.clicks / c.imps) * 100 : 0;

              const isScaling = cpl > 0 && cpl < targetCPA * 0.7 && c.leads > 5;
              const isStopLoss = c.spend > targetCPA * 2 && c.leads === 0;

              return (
                <tr key={c.id} className="group hover:bg-white/[0.02] transition-all cursor-pointer">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-background border border-border flex items-center justify-center overflow-hidden shrink-0 shadow-inner relative">
                        {thumbnails[c.id] ? (
                          <img src={thumbnails[c.id]} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <ImageIcon className="w-4 h-4 text-muted/30" />
                        )}
                        {isScaling && (
                          <div className="absolute -top-1 -right-1 w-4 h-4 bg-success rounded-full flex items-center justify-center border-2 border-background animate-bounce">
                             <span className="text-[8px]">🚀</span>
                          </div>
                        )}
                        {isStopLoss && (
                          <div className="absolute -top-1 -right-1 w-4 h-4 bg-danger rounded-full flex items-center justify-center border-2 border-background">
                             <span className="text-[8px]">🛑</span>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-sm font-bold truncate group-hover:text-accent transition-colors">{c.name}</span>
                        <span className="text-[10px] text-muted tabular-nums uppercase tracking-tighter">
                           {c.status === "ACTIVE" ? (
                             <span className="text-success flex items-center gap-1"><span className="w-1 h-1 rounded-full bg-success"/> Ativa</span>
                           ) : (
                             <span className="text-muted flex items-center gap-1"><span className="w-1 h-1 rounded-full bg-muted"/> Pausada</span>
                           )}
                        </span>
                      </div>
                    </div>
                  </td>
                  {!isDirectorMode && (
                    <td className="px-6 py-5">
                      <div className="flex flex-col gap-1.5 w-24">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold mono">{score}/100</span>
                        </div>
                        <div className="h-1 w-full bg-background rounded-full overflow-hidden border border-white/5">
                          <div 
                            className={cn(
                              "h-full rounded-full transition-all duration-1000",
                              score > 80 ? "bg-success shadow-[0_0_8px_rgba(16,185,129,0.3)]" : 
                              score > 50 ? "bg-warning shadow-[0_0_8px_rgba(245,158,11,0.3)]" : "bg-danger shadow-[0_0_8px_rgba(239,68,68,0.3)]"
                            )} 
                            style={{ width: `${score}%` }} 
                          />
                        </div>
                      </div>
                    </td>
                  )}
                  <td className="px-6 py-5 text-sm font-bold mono tabular-nums">{formatCurrency(c.spend)}</td>
                  {!isDirectorMode && <td className="px-6 py-4 text-sm font-bold mono tabular-nums text-muted">{ctr.toFixed(2)}%</td>}
                  <td className="px-6 py-5">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-accent mono tabular-nums">{c.leads}</span>
                      {!isDirectorMode && <span className="text-[10px] text-muted font-medium">{c.convs} Conv.</span>}
                    </div>
                  </td>
                  <td className="px-6 py-5 text-sm font-bold mono tabular-nums">
                    <span className={cpl > targetCPA ? "text-danger" : "text-success"}>{formatCurrency(cpl)}</span>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center justify-end gap-2">
                       {isScaling && (
                         <div className="px-2 py-1 bg-success/10 text-success text-[10px] font-bold rounded border border-success/20 uppercase animate-in zoom-in duration-500">
                           Escalar
                         </div>
                       )}
                       {isStopLoss && (
                         <div className="px-2 py-1 bg-danger/10 text-danger text-[10px] font-bold rounded border border-danger/20 uppercase animate-in shake duration-500">
                           Pausar
                         </div>
                       )}
                       {!isScaling && !isStopLoss && (
                         <span className="text-[9px] text-muted font-bold uppercase italic">Manter</span>
                       )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {campaigns.length === 0 && (
          <div className="py-20 text-center">
            <p className="text-sm text-muted font-bold">Nenhuma campanha encontrada para este período.</p>
          </div>
        )}
      </div>
    </div>
  );
}

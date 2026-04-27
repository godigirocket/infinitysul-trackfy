"use client";

import { useMetaData } from "@/hooks/useMetaData";
import { useAppStore } from "@/store/useAppStore";
import { useState, useMemo } from "react";
import { formatCurrency, formatNumber, extractMetric, CONVERSATION_ACTION_TYPES } from "@/lib/formatters";
import { safeArray } from "@/lib/safeArray";
import { cn } from "@/lib/utils";
import {
  Search, ChevronDown, ChevronRight, Eye, MousePointer2,
  MessageSquare, DollarSign, Layers, ImageIcon, Play,
  CheckCircle, PauseCircle, AlertCircle, RotateCw
} from "lucide-react";

const OBJECTIVE_LABELS: Record<string, string> = {
  OUTCOME_LEADS: "Geração de Leads",
  OUTCOME_MESSAGING: "Mensagens",
  OUTCOME_SALES: "Vendas",
  OUTCOME_ENGAGEMENT: "Engajamento",
  OUTCOME_TRAFFIC: "Tráfego",
  OUTCOME_AWARENESS: "Reconhecimento",
  OUTCOME_APP_PROMOTION: "Promoção de App",
  LEAD_GENERATION: "Lead Gen",
  MESSAGES: "Mensagens",
  CONVERSIONS: "Conversões",
  LINK_CLICKS: "Cliques",
  POST_ENGAGEMENT: "Engajamento",
  REACH: "Alcance",
  BRAND_AWARENESS: "Reconhecimento",
};

function StatusBadge({ status }: { status: string }) {
  const s = (status || "").toUpperCase();
  if (s === "ACTIVE") return (
    <span className="flex items-center gap-1 text-success text-[10px] font-bold">
      <CheckCircle className="w-3 h-3" /> Ativa
    </span>
  );
  if (s === "PAUSED") return (
    <span className="flex items-center gap-1 text-muted text-[10px] font-bold">
      <PauseCircle className="w-3 h-3" /> Pausada
    </span>
  );
  return (
    <span className="flex items-center gap-1 text-warning text-[10px] font-bold">
      <AlertCircle className="w-3 h-3" /> {status}
    </span>
  );
}

function formatBudget(campaign: any): string {
  if (campaign.daily_budget) return `R$ ${(parseInt(campaign.daily_budget) / 100).toFixed(2)}/dia`;
  if (campaign.lifetime_budget) return `R$ ${(parseInt(campaign.lifetime_budget) / 100).toFixed(2)} total`;
  return "—";
}

export default function CampaignsPage() {
  const { refresh } = useMetaData();
  const { dataA, dataAds, hierarchy, creativesHD, isLoading, searchQuery, setSearchQuery } = useAppStore();
  const [expandedCampaigns, setExpandedCampaigns] = useState<Set<string>>(new Set());
  const [expandedAdsets, setExpandedAdsets] = useState<Set<string>>(new Set());

  const toggleCampaign = (id: string) => {
    setExpandedCampaigns(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAdset = (id: string) => {
    setExpandedAdsets(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // Aggregate metrics from insights
  const campaignMetrics = useMemo(() => {
    const map: Record<string, { spend: number; impressions: number; clicks: number; convs: number }> = {};
    safeArray(dataA).forEach(r => {
      if (!map[r.campaign_id]) map[r.campaign_id] = { spend: 0, impressions: 0, clicks: 0, convs: 0 };
      map[r.campaign_id].spend += parseFloat(r.spend || "0");
      map[r.campaign_id].impressions += parseInt(r.impressions || "0");
      map[r.campaign_id].clicks += parseInt(r.clicks || "0");
      map[r.campaign_id].convs += extractMetric(r.actions, CONVERSATION_ACTION_TYPES);
    });
    return map;
  }, [dataA]);

  const adMetrics = useMemo(() => {
    const map: Record<string, { spend: number; impressions: number; clicks: number; convs: number }> = {};
    safeArray(dataAds).forEach(r => {
      const id = r.ad_id || "";
      if (!map[id]) map[id] = { spend: 0, impressions: 0, clicks: 0, convs: 0 };
      map[id].spend += parseFloat(r.spend || "0");
      map[id].impressions += parseInt(r.impressions || "0");
      map[id].clicks += parseInt(r.clicks || "0");
      map[id].convs += extractMetric(r.actions, CONVERSATION_ACTION_TYPES);
    });
    return map;
  }, [dataAds]);

  const campaigns = useMemo(() => {
    return safeArray(hierarchy?.campaigns).filter(c =>
      !searchQuery ||
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.id.includes(searchQuery)
    );
  }, [hierarchy, searchQuery]);

  const getAdsets = (campaignId: string) =>
    safeArray(hierarchy?.adsets).filter(as => as.campaign_id === campaignId);

  const getAds = (adsetId: string) =>
    safeArray(hierarchy?.ads).filter(ad => ad.adset_id === adsetId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Gestão de Campanhas</h1>
          <p className="text-xs sm:text-sm text-muted">
            {campaigns.length} campanhas • Clique para expandir conjuntos e anúncios
          </p>
        </div>
        <button
          onClick={() => refresh()}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-xl text-[11px] font-bold uppercase tracking-widest hover:bg-accent/90 transition-all disabled:opacity-50"
        >
          <RotateCw className={cn("w-3.5 h-3.5", isLoading && "animate-spin")} />
          Sincronizar
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
        <input
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Buscar campanha..."
          className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-accent"
        />
      </div>

      {/* Loading */}
      {isLoading && campaigns.length === 0 && (
        <div className="flex items-center justify-center py-20">
          <RotateCw className="w-8 h-8 text-accent animate-spin" />
        </div>
      )}

      {/* Empty */}
      {!isLoading && campaigns.length === 0 && (
        <div className="glass p-12 text-center">
          <Layers className="w-12 h-12 text-muted/20 mx-auto mb-4" />
          <p className="text-sm font-bold text-muted uppercase tracking-widest">Nenhuma campanha encontrada</p>
          <p className="text-xs text-muted/50 mt-1">Sincronize sua conta Meta para ver as campanhas.</p>
        </div>
      )}

      {/* Campaign list */}
      <div className="space-y-3">
        {campaigns.map(campaign => {
          const metrics = campaignMetrics[campaign.id] || { spend: 0, impressions: 0, clicks: 0, convs: 0 };
          const ctr = metrics.impressions > 0 ? (metrics.clicks / metrics.impressions) * 100 : 0;
          const isExpanded = expandedCampaigns.has(campaign.id);
          const adsets = getAdsets(campaign.id);
          const objective = OBJECTIVE_LABELS[campaign.objective as string] || campaign.objective || "—";

          return (
            <div key={campaign.id} className="glass overflow-hidden">
              {/* Campaign row */}
              <div
                className="flex items-center gap-4 p-4 cursor-pointer hover:bg-white/[0.03] transition-all"
                onClick={() => toggleCampaign(campaign.id)}
              >
                <button className="text-muted hover:text-white transition-colors flex-shrink-0">
                  {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </button>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold text-white truncate">{campaign.name}</span>
                    <StatusBadge status={campaign.effective_status} />
                  </div>
                  <div className="flex items-center gap-3 mt-1 flex-wrap">
                    <span className="text-[10px] text-muted font-bold uppercase">{objective}</span>
                    <span className="text-[10px] text-muted">•</span>
                    <span className="text-[10px] text-muted font-bold">{formatBudget(campaign)}</span>
                    <span className="text-[10px] text-muted">•</span>
                    <span className="text-[10px] text-muted font-mono">{adsets.length} conjuntos</span>
                  </div>
                </div>

                {/* Metrics */}
                <div className="hidden sm:grid grid-cols-4 gap-6 text-right flex-shrink-0">
                  <div>
                    <span className="text-[9px] font-bold text-muted uppercase block">Gasto</span>
                    <span className="text-sm font-bold mono text-white">{formatCurrency(metrics.spend)}</span>
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-muted uppercase block">Impressões</span>
                    <span className="text-sm font-bold mono text-white">{formatNumber(metrics.impressions)}</span>
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-muted uppercase block">CTR</span>
                    <span className="text-sm font-bold mono text-white">{ctr.toFixed(2)}%</span>
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-muted uppercase block">Conversas</span>
                    <span className="text-sm font-bold mono text-warning">{formatNumber(metrics.convs)}</span>
                  </div>
                </div>
              </div>

              {/* Adsets */}
              {isExpanded && (
                <div className="border-t border-white/5">
                  {adsets.length === 0 ? (
                    <div className="px-12 py-4 text-[11px] text-muted">Nenhum conjunto encontrado.</div>
                  ) : adsets.map(adset => {
                    const isAdsetExpanded = expandedAdsets.has(adset.id);
                    const ads = getAds(adset.id);

                    return (
                      <div key={adset.id} className="border-b border-white/[0.03] last:border-0">
                        {/* Adset row */}
                        <div
                          className="flex items-center gap-4 px-8 py-3 cursor-pointer hover:bg-white/[0.02] transition-all"
                          onClick={() => toggleAdset(adset.id)}
                        >
                          <button className="text-muted hover:text-white transition-colors flex-shrink-0 ml-4">
                            {isAdsetExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                          </button>
                          <Layers className="w-3.5 h-3.5 text-accent/60 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-white/80 truncate">{adset.name}</span>
                              <StatusBadge status={adset.effective_status} />
                            </div>
                            {(adset as any).optimization_goal && (
                              <span className="text-[10px] text-muted">
                                Otimização: {(adset as any).optimization_goal.replace(/_/g, " ")}
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-muted font-mono flex-shrink-0">{ads.length} anúncios</span>
                        </div>

                        {/* Ads */}
                        {isAdsetExpanded && (
                          <div className="px-16 py-3 space-y-3 bg-white/[0.01]">
                            {ads.length === 0 ? (
                              <p className="text-[11px] text-muted">Nenhum anúncio encontrado.</p>
                            ) : ads.map(ad => {
                              const thumb = creativesHD?.[ad.id]
                                || (ad as any).creative?.thumbnail_url
                                || (ad as any).creative?.image_url;
                              const adM = adMetrics[ad.id] || { spend: 0, impressions: 0, clicks: 0, convs: 0 };

                              return (
                                <div key={ad.id} className="flex items-center gap-4 p-3 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all">
                                  {/* Thumbnail */}
                                  <div className="w-14 h-14 rounded-lg overflow-hidden bg-white/5 flex-shrink-0 flex items-center justify-center">
                                    {thumb ? (
                                      <img src={thumb} alt={ad.name} className="w-full h-full object-cover" />
                                    ) : (
                                      <ImageIcon className="w-5 h-5 text-muted/30" />
                                    )}
                                  </div>

                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs font-bold text-white truncate">{ad.name}</span>
                                      <StatusBadge status={ad.effective_status} />
                                    </div>
                                    <span className="text-[10px] text-muted font-mono">ID: {ad.id.slice(-8)}</span>
                                  </div>

                                  <div className="hidden sm:grid grid-cols-3 gap-4 text-right flex-shrink-0">
                                    <div>
                                      <span className="text-[9px] font-bold text-muted uppercase block">Gasto</span>
                                      <span className="text-xs font-bold mono">{formatCurrency(adM.spend)}</span>
                                    </div>
                                    <div>
                                      <span className="text-[9px] font-bold text-muted uppercase block">Cliques</span>
                                      <span className="text-xs font-bold mono">{formatNumber(adM.clicks)}</span>
                                    </div>
                                    <div>
                                      <span className="text-[9px] font-bold text-muted uppercase block">Conversas</span>
                                      <span className="text-xs font-bold mono text-warning">{formatNumber(adM.convs)}</span>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

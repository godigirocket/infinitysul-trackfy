"use client";

import { useEffect, useState, useMemo } from "react";
import { useAppStore } from "@/store/useAppStore";
import { runRefresh, clearFetchCache } from "@/hooks/useMetaData";
import { updateCampaign, updateAdset, updateAd } from "@/services/metaApi";
import { formatCurrency, formatNumber, extractMetric, CONVERSATION_ACTION_TYPES } from "@/lib/formatters";
import { safeArray } from "@/lib/safeArray";
import { ChevronDown, ChevronRight, Edit2, Power, Save, X, ImageIcon, RefreshCw } from "lucide-react";

const OBJECTIVE_LABELS: Record<string, string> = {
  OUTCOME_TRAFFIC: "Tráfego", OUTCOME_ENGAGEMENT: "Engajamento",
  OUTCOME_LEADS: "Leads", OUTCOME_SALES: "Vendas",
  OUTCOME_AWARENESS: "Reconhecimento", OUTCOME_MESSAGING: "Mensagens",
  MESSAGES: "Mensagens", LINK_CLICKS: "Cliques", CONVERSIONS: "Conversões",
};

const STATUS_BADGE: Record<string, string> = {
  ACTIVE: "bg-green-500/20 text-green-400",
  PAUSED: "bg-yellow-500/20 text-yellow-400",
  DELETED: "bg-red-500/20 text-red-400",
  ARCHIVED: "bg-gray-500/20 text-gray-400",
};

function budgetDisplay(obj: any): string {
  if (obj.daily_budget) return `R$ ${(parseInt(obj.daily_budget) / 100).toFixed(2)}/dia`;
  if (obj.lifetime_budget) return `R$ ${(parseInt(obj.lifetime_budget) / 100).toFixed(2)} total`;
  return "—";
}

export default function CampaignsPage() {
  const { token, accountId, hierarchy, dataA, dataAds, creativesHD, isLoading, apiError } = useAppStore();
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editBudget, setEditBudget] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (token && accountId) {
      runRefresh(); // uses cache if fresh, fetches if stale
    }
  }, [token, accountId]);

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
    const map: Record<string, { spend: number; convs: number }> = {};
    safeArray(dataAds).forEach(r => {
      const id = r.ad_id || "";
      if (!map[id]) map[id] = { spend: 0, convs: 0 };
      map[id].spend += parseFloat(r.spend || "0");
      map[id].convs += extractMetric(r.actions, CONVERSATION_ACTION_TYPES);
    });
    return map;
  }, [dataAds]);

  const toggle = (id: string) => {
    setExpanded(prev => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  const getAdsets = (campaignId: string) =>
    safeArray(hierarchy?.adsets).filter((a: any) => a.campaign_id === campaignId);

  const getAds = (adsetId: string) =>
    safeArray(hierarchy?.ads).filter((a: any) => a.adset_id === adsetId);

  const handleToggleStatus = async (type: "campaign" | "adset" | "ad", id: string, currentStatus: string) => {
    const newStatus = currentStatus === "ACTIVE" ? "PAUSED" : "ACTIVE";
    try {
      if (type === "campaign") await updateCampaign(id, token, { status: newStatus as any });
      if (type === "adset") await updateAdset(id, token, { status: newStatus as any });
      if (type === "ad") await updateAd(id, token, { status: newStatus as any });
      clearFetchCache();
      runRefresh();
    } catch (err) {
      console.error("Erro ao alterar status:", err);
    }
  };

  const startEdit = (obj: any) => {
    setEditingId(obj.id);
    setEditName(obj.name);
    const b = obj.daily_budget || obj.lifetime_budget;
    setEditBudget(b ? (parseInt(b) / 100).toFixed(2) : "");
  };

  const saveEdit = async (id: string) => {
    setSaving(true);
    const updates: any = { name: editName };
    if (editBudget && !isNaN(Number(editBudget))) {
      updates.daily_budget = Math.round(Number(editBudget) * 100);
    }
    await updateCampaign(id, token, updates);
    setEditingId(null);
    setSaving(false);
    clearFetchCache();
    runRefresh();
  };

  if (!token || !accountId) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] flex-col gap-4">
        <p className="text-muted text-sm font-bold uppercase tracking-widest">Token não configurado</p>
        <a href="/settings" className="px-4 py-2 bg-accent text-white rounded-xl text-sm font-bold">
          Ir para Configurações →
        </a>
      </div>
    );
  }

  const campaigns = safeArray(hierarchy?.campaigns).sort((a, b) =>
    (campaignMetrics[b.id]?.spend || 0) - (campaignMetrics[a.id]?.spend || 0)
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Gerenciar Campanhas</h1>
          <p className="text-sm text-muted">{campaigns.length} campanhas • Clique na seta para expandir</p>
        </div>
      </div>

      {apiError && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">{apiError}</div>
      )}

      {isLoading && campaigns.length === 0 && (
        <div className="flex items-center justify-center py-20">
          <RefreshCw className="w-8 h-8 text-accent animate-spin" />
        </div>
      )}

      {!isLoading && campaigns.length === 0 && (
        <div className="glass p-12 text-center">
          <p className="text-muted text-sm font-bold uppercase tracking-widest">Nenhuma campanha encontrada</p>
          <p className="text-xs text-muted/50 mt-2">Clique em Sincronizar para carregar.</p>
        </div>
      )}

      <div className="space-y-3">
        {campaigns.map((campaign: any) => {
          const isExpanded = expanded.has(campaign.id);
          const adsets = getAdsets(campaign.id);
          const m = campaignMetrics[campaign.id] || { spend: 0, impressions: 0, clicks: 0, convs: 0 };
          const cpl = m.convs > 0 ? m.spend / m.convs : 0;

          return (
            <div key={campaign.id} className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
              {/* Campaign row */}
              <div className="flex items-center justify-between p-4 hover:bg-white/[0.03] transition-all">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <button onClick={() => toggle(campaign.id)} className="text-muted hover:text-white flex-shrink-0">
                    {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                  </button>

                  {editingId === campaign.id ? (
                    <div className="flex items-center gap-2 flex-wrap">
                      <input value={editName} onChange={e => setEditName(e.target.value)}
                        className="bg-black/50 border border-white/20 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-accent w-52" />
                      <input value={editBudget} onChange={e => setEditBudget(e.target.value)}
                        placeholder="Orçamento R$/dia"
                        className="bg-black/50 border border-white/20 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-accent w-32 font-mono" />
                      <button onClick={() => saveEdit(campaign.id)} disabled={saving} className="text-green-400 hover:text-green-300">
                        <Save className="w-4 h-4" />
                      </button>
                      <button onClick={() => setEditingId(null)} className="text-red-400 hover:text-red-300">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 flex-wrap min-w-0">
                      <span className="font-semibold text-white truncate">{campaign.name}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-muted flex-shrink-0">
                        {OBJECTIVE_LABELS[campaign.objective as string] || campaign.objective || "—"}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${STATUS_BADGE[campaign.effective_status] || "bg-white/10 text-muted"}`}>
                        {campaign.effective_status}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-4 text-sm flex-shrink-0 ml-4">
                  <div className="hidden md:flex items-center gap-5 text-xs font-mono text-right">
                    <div><span className="text-[9px] text-muted block">Gasto</span><span className="font-bold">{formatCurrency(m.spend)}</span></div>
                    <div><span className="text-[9px] text-muted block">Imps</span>{formatNumber(m.impressions)}</div>
                    <div><span className="text-[9px] text-muted block">Conv.</span><span className="text-yellow-400 font-bold">{formatNumber(m.convs)}</span></div>
                    <div><span className="text-[9px] text-muted block">CPL</span>{cpl > 0 ? formatCurrency(cpl) : "—"}</div>
                    <div><span className="text-[9px] text-muted block">Orçamento</span>{budgetDisplay(campaign)}</div>
                  </div>
                  {editingId !== campaign.id && (
                    <button onClick={() => startEdit(campaign)} className="text-muted hover:text-white transition-colors" title="Editar">
                      <Edit2 className="w-4 h-4" />
                    </button>
                  )}
                  <button onClick={() => handleToggleStatus("campaign", campaign.id, campaign.effective_status)}
                    className={`transition-colors ${campaign.effective_status === "ACTIVE" ? "text-green-400 hover:text-yellow-400" : "text-yellow-400 hover:text-green-400"}`}
                    title={campaign.effective_status === "ACTIVE" ? "Pausar" : "Ativar"}>
                    <Power className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Adsets */}
              {isExpanded && (
                <div className="border-t border-white/10 bg-black/30">
                  {adsets.length === 0 ? (
                    <p className="px-10 py-4 text-xs text-muted">Nenhum conjunto encontrado.</p>
                  ) : adsets.map((adset: any) => {
                    const ads = getAds(adset.id);
                    const isAdsetExpanded = expanded.has(`adset_${adset.id}`);

                    return (
                      <div key={adset.id} className="border-b border-white/[0.05] last:border-0">
                        <div className="flex items-center justify-between px-8 py-3 hover:bg-white/[0.02] transition-all">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <button onClick={() => toggle(`adset_${adset.id}`)} className="text-muted hover:text-white flex-shrink-0">
                              {isAdsetExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                            </button>
                            <span className="text-sm font-mono text-white/80 truncate">{adset.name}</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${STATUS_BADGE[adset.effective_status] || "bg-white/10 text-muted"}`}>
                              {adset.effective_status}
                            </span>
                            <span className="text-xs text-muted flex-shrink-0">{budgetDisplay(adset)}</span>
                            <span className="text-xs text-muted flex-shrink-0">• {ads.length} anúncios</span>
                          </div>
                          <button onClick={() => handleToggleStatus("adset", adset.id, adset.effective_status)}
                            className={`transition-colors flex-shrink-0 ${adset.effective_status === "ACTIVE" ? "text-green-400 hover:text-yellow-400" : "text-yellow-400 hover:text-green-400"}`}>
                            <Power className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Ads */}
                        {isAdsetExpanded && (
                          <div className="px-14 py-2 space-y-2 bg-black/20">
                            {ads.length === 0 ? (
                              <p className="text-xs text-muted py-2">Nenhum anúncio encontrado.</p>
                            ) : ads.map((ad: any) => {
                              const thumb = creativesHD?.[ad.id]
                                || (ad as any).creative?.thumbnail_url
                                || (ad as any).creative?.image_url;
                              const am = adMetrics[ad.id] || { spend: 0, convs: 0 };

                              return (
                                <div key={ad.id} className="flex items-center gap-3 p-2.5 bg-white/5 rounded-lg hover:bg-white/[0.07] transition-all">
                                  <div className="w-10 h-10 rounded-lg overflow-hidden bg-white/5 flex-shrink-0 flex items-center justify-center">
                                    {thumb
                                      ? <img src={thumb} alt="" className="w-full h-full object-cover" />
                                      : <ImageIcon className="w-4 h-4 text-muted/30" />}
                                  </div>
                                  <span className="flex-1 text-xs text-white truncate">{ad.name}</span>
                                  <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${STATUS_BADGE[ad.effective_status] || "bg-white/10 text-muted"}`}>
                                    {ad.effective_status}
                                  </span>
                                  <span className="text-xs font-mono text-muted flex-shrink-0">{formatCurrency(am.spend)}</span>
                                  <span className="text-xs font-mono text-yellow-400 flex-shrink-0">{am.convs} conv.</span>
                                  <button onClick={() => handleToggleStatus("ad", ad.id, ad.effective_status)}
                                    className={`flex-shrink-0 transition-colors ${ad.effective_status === "ACTIVE" ? "text-green-400 hover:text-yellow-400" : "text-yellow-400 hover:text-green-400"}`}>
                                    <Power className="w-3 h-3" />
                                  </button>
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

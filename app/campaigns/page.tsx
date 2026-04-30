"use client";

import { useEffect, useState, useMemo } from "react";
import { useAppStore } from "@/store/useAppStore";
import { runRefresh, clearFetchCache } from "@/hooks/useMetaData";
import { updateCampaign, updateAdset, updateAd } from "@/services/metaApi";
import { formatCurrency, formatNumber, extractMetric, CONVERSATION_ACTION_TYPES } from "@/lib/formatters";
import { safeArray } from "@/lib/safeArray";
import { useToast } from "@/components/ui/Toast";
import { Toggle } from "@/components/ui/Toggle";
import { cn } from "@/lib/utils";
import {
  ChevronDown, ChevronRight, Pencil, Power, RefreshCw,
  Save, X, ImageIcon, Eye, Layers, Search
} from "lucide-react";

const OBJ: Record<string, string> = {
  OUTCOME_TRAFFIC: "Tráfego", OUTCOME_ENGAGEMENT: "Engajamento",
  OUTCOME_LEADS: "Leads", OUTCOME_SALES: "Vendas",
  OUTCOME_AWARENESS: "Reconhecimento", OUTCOME_MESSAGING: "Mensagens",
  MESSAGES: "Mensagens", LINK_CLICKS: "Cliques", CONVERSIONS: "Conversões",
};

const STATUS_COLOR: Record<string, string> = {
  ACTIVE: "text-success bg-success/10",
  PAUSED: "text-warning bg-warning/10",
  ARCHIVED: "text-muted bg-white/5",
  DELETED: "text-danger bg-danger/10",
};

function StatusPill({ status }: { status: string }) {
  return (
    <span className={cn("text-[9px] font-bold px-2 py-0.5 rounded-full uppercase", STATUS_COLOR[status] || "text-muted bg-white/5")}>
      {status === "ACTIVE" ? "● Ativa" : status === "PAUSED" ? "⏸ Pausada" : status === "ARCHIVED" ? "🗄 Arquivada" : status}
    </span>
  );
}

function BudgetDisplay({ obj }: { obj: any }) {
  if (obj.daily_budget) return <span className="text-xs mono">R$ {(parseInt(obj.daily_budget) / 100).toFixed(2)}/dia</span>;
  if (obj.lifetime_budget) return <span className="text-xs mono">R$ {(parseInt(obj.lifetime_budget) / 100).toFixed(2)} total</span>;
  return <span className="text-xs text-muted">—</span>;
}

// ── Creative preview modal ────────────────────────────────────────────────
function CreativeModal({ ad, thumb, onClose }: { ad: any; thumb?: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-md p-6" onClick={onClose}>
      <div className="glass w-full max-w-md rounded-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-white/5">
          <span className="text-sm font-bold text-white truncate">{ad.name}</span>
          <button onClick={onClose}><X className="w-4 h-4 text-muted" /></button>
        </div>
        <div className="aspect-video bg-white/5 flex items-center justify-center">
          {thumb
            ? <img src={thumb} alt={ad.name} className="w-full h-full object-contain" />
            : <ImageIcon className="w-12 h-12 text-muted/20" />}
        </div>
        <div className="p-4 space-y-1">
          <div className="flex items-center justify-between">
            <StatusPill status={ad.effective_status} />
            <span className="text-[10px] text-muted mono">ID: {ad.id?.slice(-8)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Ad row ────────────────────────────────────────────────────────────────
function AdRow({ ad, metrics, thumb, token, onUpdate }: {
  ad: any; metrics: any; thumb?: string; token: string;
  onUpdate: (id: string, patch: any) => void;
}) {
  const { toast } = useToast();
  const [toggling, setToggling] = useState(false);
  const [preview, setPreview] = useState(false);
  const m = metrics || { spend: 0, impressions: 0, clicks: 0, convs: 0 };

  const toggle = async (active: boolean) => {
    setToggling(true);
    const status = active ? "ACTIVE" : "PAUSED";
    const r = await updateAd(ad.id, token, { status });
    if (r.success) { onUpdate(ad.id, { effective_status: status }); toast(`Anúncio ${active ? "ativado" : "pausado"}`, "success"); }
    else toast(r.error || "Erro", "error");
    setToggling(false);
  };

  return (
    <>
      <div className="flex items-center gap-3 px-14 py-2.5 bg-black/20 border-b border-white/[0.03] last:border-0 hover:bg-white/[0.02] transition-all">
        <Toggle checked={ad.effective_status === "ACTIVE"} onChange={toggle} disabled={toggling} size="sm" />
        <div className="w-9 h-9 rounded-lg overflow-hidden bg-white/5 flex-shrink-0 flex items-center justify-center">
          {thumb ? <img src={thumb} alt="" className="w-full h-full object-cover" /> : <ImageIcon className="w-3.5 h-3.5 text-muted/30" />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-white/80 truncate">{ad.name}</p>
          <StatusPill status={ad.effective_status} />
        </div>
        <div className="hidden sm:flex items-center gap-5 text-xs mono text-right flex-shrink-0">
          <div><span className="text-[9px] text-muted block">Gasto</span>{formatCurrency(m.spend)}</div>
          <div><span className="text-[9px] text-muted block">Imps</span>{formatNumber(m.impressions)}</div>
          <div><span className="text-[9px] text-muted block">Conv.</span><span className="text-warning">{formatNumber(m.convs)}</span></div>
        </div>
        <button onClick={() => setPreview(true)} className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-muted hover:text-white transition-all" title="Ver criativo">
          <Eye className="w-3.5 h-3.5" />
        </button>
      </div>
      {preview && <CreativeModal ad={ad} thumb={thumb} onClose={() => setPreview(false)} />}
    </>
  );
}

// ── Adset row ─────────────────────────────────────────────────────────────
function AdsetRow({ adset, ads, adMetrics, creativesHD, token, onUpdateAdset, onUpdateAd }: {
  adset: any; ads: any[]; adMetrics: Record<string, any>; creativesHD: Record<string, string>;
  token: string; onUpdateAdset: (id: string, p: any) => void; onUpdateAd: (id: string, p: any) => void;
}) {
  const { toast } = useToast();
  const [expanded, setExpanded] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(adset.name);
  const [editBudget, setEditBudget] = useState(adset.daily_budget ? (parseInt(adset.daily_budget) / 100).toFixed(2) : "");

  const toggle = async (active: boolean) => {
    setToggling(true);
    const status = active ? "ACTIVE" : "PAUSED";
    const r = await updateAdset(adset.id, token, { status });
    if (r.success) { onUpdateAdset(adset.id, { effective_status: status }); toast(`Conjunto ${active ? "ativado" : "pausado"}`, "success"); }
    else toast(r.error || "Erro", "error");
    setToggling(false);
  };

  const save = async () => {
    const updates: any = {};
    if (editName !== adset.name) updates.name = editName;
    if (editBudget && !isNaN(Number(editBudget))) updates.daily_budget = Math.round(Number(editBudget) * 100);
    if (Object.keys(updates).length === 0) { setEditing(false); return; }
    const r = await updateAdset(adset.id, token, updates);
    if (r.success) { onUpdateAdset(adset.id, { ...updates, daily_budget: updates.daily_budget ? String(updates.daily_budget) : adset.daily_budget }); toast("Conjunto atualizado", "success"); }
    else toast(r.error || "Erro", "error");
    setEditing(false);
  };

  const m = ads.reduce((acc, ad) => {
    const am = adMetrics[ad.id] || {};
    return { spend: acc.spend + (am.spend || 0), impressions: acc.impressions + (am.impressions || 0), convs: acc.convs + (am.convs || 0) };
  }, { spend: 0, impressions: 0, convs: 0 });

  return (
    <div className="border-b border-white/[0.03] last:border-0">
      <div className="flex items-center gap-3 px-8 py-3 hover:bg-white/[0.02] transition-all">
        <div onClick={e => e.stopPropagation()}>
          <Toggle checked={adset.effective_status === "ACTIVE"} onChange={toggle} disabled={toggling} size="sm" />
        </div>
        <button onClick={() => setExpanded(e => !e)} className="text-muted hover:text-white ml-1 flex-shrink-0">
          {expanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
        </button>
        <Layers className="w-3.5 h-3.5 text-accent/40 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          {editing ? (
            <div className="flex items-center gap-2 flex-wrap">
              <input value={editName} onChange={e => setEditName(e.target.value)}
                className="bg-black/50 border border-white/20 rounded px-2 py-0.5 text-xs text-white focus:outline-none focus:border-accent w-48" />
              <input value={editBudget} onChange={e => setEditBudget(e.target.value)} placeholder="Orçamento R$"
                className="bg-black/50 border border-white/20 rounded px-2 py-0.5 text-xs text-white focus:outline-none focus:border-accent w-28 mono" />
              <button onClick={save} className="text-success hover:text-success/80"><Save className="w-3.5 h-3.5" /></button>
              <button onClick={() => setEditing(false)} className="text-muted hover:text-white"><X className="w-3.5 h-3.5" /></button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white/80 truncate">{adset.name}</span>
              <StatusPill status={adset.effective_status} />
              <BudgetDisplay obj={adset} />
              <button onClick={() => setEditing(true)} className="text-muted hover:text-white opacity-0 group-hover:opacity-100 transition-opacity">
                <Pencil className="w-3 h-3" />
              </button>
            </div>
          )}
          <span className="text-[10px] text-muted">{ads.length} anúncios</span>
        </div>
        <div className="hidden sm:flex items-center gap-5 text-xs mono text-right flex-shrink-0">
          <div><span className="text-[9px] text-muted block">Gasto</span>{formatCurrency(m.spend)}</div>
          <div><span className="text-[9px] text-muted block">Imps</span>{formatNumber(m.impressions)}</div>
          <div><span className="text-[9px] text-muted block">Conv.</span><span className="text-warning">{formatNumber(m.convs)}</span></div>
        </div>
        {!editing && (
          <button onClick={() => setEditing(true)} className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-muted hover:text-white transition-all">
            <Pencil className="w-3 h-3" />
          </button>
        )}
      </div>
      {expanded && ads.map(ad => (
        <AdRow key={ad.id} ad={ad} metrics={adMetrics[ad.id]} thumb={creativesHD?.[ad.id] || (ad as any).creative?.thumbnail_url}
          token={token} onUpdate={onUpdateAd} />
      ))}
    </div>
  );
}

// ── Campaign row ──────────────────────────────────────────────────────────
function CampaignRow({ campaign, adsets, ads, metrics, adMetrics, creativesHD, token, onUpdate, onUpdateAdset, onUpdateAd }: {
  campaign: any; adsets: any[]; ads: any[]; metrics: any; adMetrics: Record<string, any>;
  creativesHD: Record<string, string>; token: string;
  onUpdate: (id: string, p: any) => void;
  onUpdateAdset: (id: string, p: any) => void;
  onUpdateAd: (id: string, p: any) => void;
}) {
  const { toast } = useToast();
  const [expanded, setExpanded] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(campaign.name);
  const [editBudget, setEditBudget] = useState(campaign.daily_budget ? (parseInt(campaign.daily_budget) / 100).toFixed(2) : "");

  const toggle = async (active: boolean) => {
    setToggling(true);
    const status = active ? "ACTIVE" : "PAUSED";
    const r = await updateCampaign(campaign.id, token, { status });
    if (r.success) { onUpdate(campaign.id, { effective_status: status }); toast(`Campanha ${active ? "ativada" : "pausada"}`, "success"); }
    else toast(r.error || "Erro ao atualizar", "error");
    setToggling(false);
  };

  const save = async () => {
    const updates: any = {};
    if (editName !== campaign.name) updates.name = editName;
    if (editBudget && !isNaN(Number(editBudget))) updates.daily_budget = Math.round(Number(editBudget) * 100);
    if (Object.keys(updates).length === 0) { setEditing(false); return; }
    const r = await updateCampaign(campaign.id, token, updates);
    if (r.success) { onUpdate(campaign.id, { ...updates, daily_budget: updates.daily_budget ? String(updates.daily_budget) : campaign.daily_budget }); toast("Campanha atualizada", "success"); }
    else toast(r.error || "Erro", "error");
    setEditing(false);
  };

  const m = metrics || { spend: 0, impressions: 0, clicks: 0, convs: 0 };
  const ctr = m.impressions > 0 ? (m.clicks / m.impressions * 100).toFixed(2) : "0.00";
  const cpl = m.convs > 0 ? m.spend / m.convs : 0;

  return (
    <div className="glass overflow-hidden group">
      <div className="flex items-center gap-3 p-4 hover:bg-white/[0.02] transition-all">
        <Toggle checked={campaign.effective_status === "ACTIVE"} onChange={toggle} disabled={toggling} />
        <button onClick={() => setExpanded(e => !e)} className="text-muted hover:text-white flex-shrink-0">
          {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>
        <div className="flex-1 min-w-0">
          {editing ? (
            <div className="flex items-center gap-2 flex-wrap">
              <input value={editName} onChange={e => setEditName(e.target.value)}
                className="bg-black/50 border border-white/20 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-accent w-56" />
              <input value={editBudget} onChange={e => setEditBudget(e.target.value)} placeholder="Orçamento R$/dia"
                className="bg-black/50 border border-white/20 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-accent w-32 mono" />
              <button onClick={save} className="text-success hover:text-success/80"><Save className="w-4 h-4" /></button>
              <button onClick={() => setEditing(false)} className="text-muted hover:text-white"><X className="w-4 h-4" /></button>
            </div>
          ) : (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-bold text-white">{campaign.name}</span>
              <StatusPill status={campaign.effective_status} />
              <span className="text-[10px] text-accent font-bold">{OBJ[campaign.objective as string] || campaign.objective || "—"}</span>
              <span className="text-[10px] text-muted">•</span>
              <BudgetDisplay obj={campaign} />
              <span className="text-[10px] text-muted">• {adsets.length} conjuntos</span>
            </div>
          )}
        </div>
        <div className="hidden lg:grid grid-cols-5 gap-5 text-right text-xs mono flex-shrink-0">
          <div><span className="text-[9px] text-muted block">Gasto</span><span className="font-bold">{formatCurrency(m.spend)}</span></div>
          <div><span className="text-[9px] text-muted block">Imps</span>{formatNumber(m.impressions)}</div>
          <div><span className="text-[9px] text-muted block">Cliques</span>{formatNumber(m.clicks)}</div>
          <div><span className="text-[9px] text-muted block">CTR</span>{ctr}%</div>
          <div><span className="text-[9px] text-muted block">Conv.</span><span className="text-warning font-bold">{formatNumber(m.convs)}</span></div>
        </div>
        <div className="hidden xl:block text-right text-xs mono flex-shrink-0 w-20">
          <span className="text-[9px] text-muted block">CPL</span>
          <span className={cpl > 0 ? "font-bold" : "text-muted"}>{cpl > 0 ? formatCurrency(cpl) : "—"}</span>
        </div>
        {!editing && (
          <button onClick={() => setEditing(true)} className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-muted hover:text-white transition-all opacity-0 group-hover:opacity-100">
            <Pencil className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {expanded && (
        <div className="border-t border-white/5">
          {adsets.length === 0
            ? <p className="px-12 py-4 text-[11px] text-muted">Nenhum conjunto encontrado.</p>
            : adsets.map(adset => (
              <AdsetRow key={adset.id} adset={adset}
                ads={ads.filter(a => a.adset_id === adset.id)}
                adMetrics={adMetrics} creativesHD={creativesHD}
                token={token} onUpdateAdset={onUpdateAdset} onUpdateAd={onUpdateAd} />
            ))}
        </div>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────
export default function CampaignsPage() {
  const { token, accountId, dataA, dataAds, hierarchy, creativesHD, isLoading, apiError, searchQuery, setSearchQuery, updateHierarchyCampaign, updateHierarchyAdset, updateHierarchyAd } = useAppStore();

  useEffect(() => {
    if (token && accountId) { clearFetchCache(); runRefresh(); }
  }, [token, accountId]);

  const campaignMetrics = useMemo(() => {
    const map: Record<string, any> = {};
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
    const map: Record<string, any> = {};
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
    return safeArray(hierarchy?.campaigns)
      .filter(c => !searchQuery || c.name.toLowerCase().includes(searchQuery.toLowerCase()))
      .sort((a, b) => (campaignMetrics[b.id]?.spend || 0) - (campaignMetrics[a.id]?.spend || 0));
  }, [hierarchy, searchQuery, campaignMetrics]);

  if (!token || !accountId) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-2">
          <p className="text-sm font-bold text-muted uppercase tracking-widest">Token não configurado</p>
          <a href="/settings" className="text-accent text-sm underline">Ir para Configurações</a>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Gestão de Campanhas</h1>
          <p className="text-xs sm:text-sm text-muted">{campaigns.length} campanhas • Expanda para ver conjuntos e anúncios</p>
        </div>
        <button onClick={() => { clearFetchCache(); runRefresh(); }} disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-xl text-[11px] font-bold uppercase tracking-widest hover:bg-accent/90 transition-all disabled:opacity-50 w-fit">
          <RefreshCw className={cn("w-3.5 h-3.5", isLoading && "animate-spin")} />
          Sincronizar
        </button>
      </div>

      {apiError && (
        <div className="p-3 bg-danger/10 border border-danger/20 rounded-xl text-danger text-xs font-bold">{apiError}</div>
      )}

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
        <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Buscar campanha..."
          className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-accent" />
      </div>

      {isLoading && campaigns.length === 0 && (
        <div className="flex items-center justify-center py-20">
          <RefreshCw className="w-8 h-8 text-accent animate-spin" />
        </div>
      )}

      {!isLoading && campaigns.length === 0 && (
        <div className="glass p-12 text-center">
          <Layers className="w-12 h-12 text-muted/20 mx-auto mb-4" />
          <p className="text-sm font-bold text-muted uppercase tracking-widest">Nenhuma campanha encontrada</p>
          <p className="text-xs text-muted/50 mt-1">Clique em Sincronizar para carregar as campanhas.</p>
        </div>
      )}

      <div className="space-y-2">
        {campaigns.map(campaign => (
          <CampaignRow key={campaign.id} campaign={campaign}
            adsets={safeArray(hierarchy?.adsets).filter(a => a.campaign_id === campaign.id)}
            ads={safeArray(hierarchy?.ads).filter(a => a.campaign_id === campaign.id)}
            metrics={campaignMetrics[campaign.id]}
            adMetrics={adMetrics}
            creativesHD={creativesHD || {}}
            token={token}
            onUpdate={updateHierarchyCampaign}
            onUpdateAdset={updateHierarchyAdset}
            onUpdateAd={updateHierarchyAd}
          />
        ))}
      </div>
    </div>
  );
}

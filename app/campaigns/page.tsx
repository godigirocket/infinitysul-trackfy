"use client";

import { useMetaData, clearFetchCache } from "@/hooks/useMetaData";
import { useAppStore } from "@/store/useAppStore";
import { useState, useMemo, useEffect, useRef } from "react";
import { formatCurrency, formatNumber, extractMetric, CONVERSATION_ACTION_TYPES } from "@/lib/formatters";
import { safeArray } from "@/lib/safeArray";
import { cn } from "@/lib/utils";
import { Toggle } from "@/components/ui/Toggle";
import { useToast } from "@/components/ui/Toast";
import { updateCampaign, updateAdset, updateAd, batchUpdateStatus } from "@/services/metaApi";
import {
  Search, ChevronDown, ChevronRight, RotateCw, Pencil, X, Check,
  CheckCircle, PauseCircle, AlertCircle, Archive, Layers, ImageIcon,
  Eye, Filter, ArrowUpDown, Square, CheckSquare
} from "lucide-react";

// ── Constants ──────────────────────────────────────────────────────────────
const OBJ: Record<string, string> = {
  OUTCOME_LEADS: "Geração de Leads", OUTCOME_MESSAGING: "Mensagens",
  OUTCOME_SALES: "Vendas", OUTCOME_ENGAGEMENT: "Engajamento",
  OUTCOME_TRAFFIC: "Tráfego", OUTCOME_AWARENESS: "Reconhecimento",
  OUTCOME_APP_PROMOTION: "App", LEAD_GENERATION: "Lead Gen",
  MESSAGES: "Mensagens", CONVERSIONS: "Conversões",
  LINK_CLICKS: "Cliques", POST_ENGAGEMENT: "Engajamento",
  REACH: "Alcance", BRAND_AWARENESS: "Reconhecimento",
};

type SortKey = "spend" | "convs" | "cpl" | "name" | "impressions";
type StatusFilter = "all" | "ACTIVE" | "PAUSED" | "ARCHIVED";

// ── Sub-components ─────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const s = (status || "").toUpperCase();
  if (s === "ACTIVE") return <span className="flex items-center gap-1 text-success text-[10px] font-bold"><CheckCircle className="w-3 h-3" />Ativa</span>;
  if (s === "PAUSED") return <span className="flex items-center gap-1 text-muted text-[10px] font-bold"><PauseCircle className="w-3 h-3" />Pausada</span>;
  if (s === "ARCHIVED") return <span className="flex items-center gap-1 text-warning text-[10px] font-bold"><Archive className="w-3 h-3" />Arquivada</span>;
  return <span className="flex items-center gap-1 text-accent text-[10px] font-bold"><AlertCircle className="w-3 h-3" />{status}</span>;
}

function formatBudget(obj: any): string {
  if (obj.daily_budget) return `R$ ${(parseInt(obj.daily_budget) / 100).toFixed(2)}/dia`;
  if (obj.lifetime_budget) return `R$ ${(parseInt(obj.lifetime_budget) / 100).toFixed(2)} total`;
  return "—";
}

// Inline editable field
function InlineEdit({ value, onSave, className }: { value: string; onSave: (v: string) => Promise<void>; className?: string }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(value);
  const [saving, setSaving] = useState(false);
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => { if (editing) ref.current?.focus(); }, [editing]);
  const save = async () => {
    if (val === value) { setEditing(false); return; }
    setSaving(true);
    await onSave(val);
    setSaving(false);
    setEditing(false);
  };
  if (!editing) return (
    <button onClick={() => setEditing(true)} className={cn("flex items-center gap-1.5 group text-left", className)}>
      <span className="truncate">{value}</span>
      <Pencil className="w-3 h-3 text-muted opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
    </button>
  );
  return (
    <div className="flex items-center gap-1">
      <input ref={ref} value={val} onChange={e => setVal(e.target.value)}
        onKeyDown={e => { if (e.key === "Enter") save(); if (e.key === "Escape") setEditing(false); }}
        className="bg-white/10 border border-accent/40 rounded px-2 py-0.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-accent w-48" />
      <button onClick={save} disabled={saving} className="text-success hover:text-success/80"><Check className="w-3.5 h-3.5" /></button>
      <button onClick={() => setEditing(false)} className="text-muted hover:text-white"><X className="w-3.5 h-3.5" /></button>
    </div>
  );
}

// Budget inline edit (in R$, stored as cents)
function BudgetEdit({ valueCents, onSave }: { valueCents: number | null; onSave: (cents: number) => Promise<void> }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(valueCents ? (valueCents / 100).toFixed(2) : "");
  const [saving, setSaving] = useState(false);
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => { if (editing) ref.current?.focus(); }, [editing]);
  const save = async () => {
    const cents = Math.round(parseFloat(val.replace(",", ".")) * 100);
    if (!isNaN(cents) && cents > 0) { setSaving(true); await onSave(cents); setSaving(false); }
    setEditing(false);
  };
  const display = valueCents ? `R$ ${(valueCents / 100).toFixed(2)}/dia` : "—";
  if (!editing) return (
    <button onClick={() => setEditing(true)} className="flex items-center gap-1 group text-left">
      <span className="text-xs mono">{display}</span>
      <Pencil className="w-3 h-3 text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
    </button>
  );
  return (
    <div className="flex items-center gap-1">
      <span className="text-xs text-muted">R$</span>
      <input ref={ref} value={val} onChange={e => setVal(e.target.value)}
        onKeyDown={e => { if (e.key === "Enter") save(); if (e.key === "Escape") setEditing(false); }}
        className="bg-white/10 border border-accent/40 rounded px-2 py-0.5 text-xs text-white focus:outline-none w-20 mono" />
      <button onClick={save} disabled={saving} className="text-success"><Check className="w-3 h-3" /></button>
      <button onClick={() => setEditing(false)} className="text-muted"><X className="w-3 h-3" /></button>
    </div>
  );
}

// ── Creative Preview Modal ─────────────────────────────────────────────────
function CreativeModal({ ad, thumb, onClose }: { ad: any; thumb?: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md" onClick={onClose}>
      <div className="glass w-full max-w-lg rounded-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-white/5">
          <h3 className="text-sm font-bold text-white truncate">{ad.name}</h3>
          <button onClick={onClose} className="text-muted hover:text-white"><X className="w-4 h-4" /></button>
        </div>
        <div className="aspect-video bg-white/5 flex items-center justify-center">
          {thumb ? <img src={thumb} alt={ad.name} className="w-full h-full object-contain" /> : <ImageIcon className="w-12 h-12 text-muted/20" />}
        </div>
        <div className="p-4 grid grid-cols-2 gap-3">
          <div><span className="text-[9px] font-bold text-muted uppercase block">Status</span><StatusBadge status={ad.effective_status} /></div>
          <div><span className="text-[9px] font-bold text-muted uppercase block">ID</span><span className="text-xs mono text-muted">{ad.id}</span></div>
        </div>
      </div>
    </div>
  );
}

// ── Ad Row ─────────────────────────────────────────────────────────────────
function AdRow({ ad, metrics, thumb, token, onUpdate }: {
  ad: any; metrics: any; thumb?: string; token: string;
  onUpdate: (id: string, patch: any) => void;
}) {
  const { toast } = useToast();
  const [toggling, setToggling] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const handleToggle = async (active: boolean) => {
    setToggling(true);
    const status = active ? "ACTIVE" : "PAUSED";
    const r = await updateAd(ad.id, token, { status });
    if (r.success) { onUpdate(ad.id, { effective_status: status }); toast(`Anúncio ${active ? "ativado" : "pausado"}`, "success"); }
    else toast(r.error || "Erro ao atualizar", "error");
    setToggling(false);
  };

  const handleRename = async (name: string) => {
    const r = await updateAd(ad.id, token, { name });
    if (r.success) { onUpdate(ad.id, { name }); toast("Nome atualizado", "success"); }
    else toast(r.error || "Erro", "error");
  };

  const m = metrics || { spend: 0, impressions: 0, clicks: 0, convs: 0 };
  const ctr = m.impressions > 0 ? (m.clicks / m.impressions * 100).toFixed(2) : "0.00";

  return (
    <>
      <div className="flex items-center gap-3 px-16 py-2.5 bg-white/[0.01] border-b border-white/[0.03] last:border-0 hover:bg-white/[0.03] transition-all">
        <Toggle checked={ad.effective_status === "ACTIVE"} onChange={handleToggle} disabled={toggling} size="sm" />
        <div className="w-10 h-10 rounded-lg overflow-hidden bg-white/5 flex-shrink-0 flex items-center justify-center">
          {thumb ? <img src={thumb} alt="" className="w-full h-full object-cover" /> : <ImageIcon className="w-4 h-4 text-muted/30" />}
        </div>
        <div className="flex-1 min-w-0">
          <InlineEdit value={ad.name} onSave={handleRename} className="text-xs font-bold text-white/80" />
          <StatusBadge status={ad.effective_status} />
        </div>
        <div className="hidden sm:grid grid-cols-4 gap-4 text-right text-xs mono flex-shrink-0">
          <div><span className="text-[9px] text-muted block">Gasto</span>{formatCurrency(m.spend)}</div>
          <div><span className="text-[9px] text-muted block">Imps</span>{formatNumber(m.impressions)}</div>
          <div><span className="text-[9px] text-muted block">CTR</span>{ctr}%</div>
          <div><span className="text-[9px] text-muted block">Conv.</span><span className="text-warning">{formatNumber(m.convs)}</span></div>
        </div>
        <button onClick={() => setShowPreview(true)} className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-muted hover:text-white transition-all" title="Ver criativo">
          <Eye className="w-3.5 h-3.5" />
        </button>
      </div>
      {showPreview && <CreativeModal ad={ad} thumb={thumb} onClose={() => setShowPreview(false)} />}
    </>
  );
}

// ── Adset Row ──────────────────────────────────────────────────────────────
function AdsetRow({ adset, ads, adMetrics, creativesHD, token, onUpdateAdset, onUpdateAd }: {
  adset: any; ads: any[]; adMetrics: Record<string, any>; creativesHD: Record<string, string>;
  token: string; onUpdateAdset: (id: string, p: any) => void; onUpdateAd: (id: string, p: any) => void;
}) {
  const { toast } = useToast();
  const [expanded, setExpanded] = useState(false);
  const [toggling, setToggling] = useState(false);

  const handleToggle = async (active: boolean) => {
    setToggling(true);
    const status = active ? "ACTIVE" : "PAUSED";
    const r = await updateAdset(adset.id, token, { status });
    if (r.success) { onUpdateAdset(adset.id, { effective_status: status }); toast(`Conjunto ${active ? "ativado" : "pausado"}`, "success"); }
    else toast(r.error || "Erro", "error");
    setToggling(false);
  };

  const handleRename = async (name: string) => {
    const r = await updateAdset(adset.id, token, { name });
    if (r.success) { onUpdateAdset(adset.id, { name }); toast("Nome atualizado", "success"); }
    else toast(r.error || "Erro", "error");
  };

  const handleBudget = async (cents: number) => {
    const r = await updateAdset(adset.id, token, { daily_budget: cents });
    if (r.success) { onUpdateAdset(adset.id, { daily_budget: String(cents) }); toast("Orçamento atualizado", "success"); }
    else toast(r.error || "Erro", "error");
  };

  // Aggregate adset metrics from its ads
  const m = ads.reduce((acc, ad) => {
    const am = adMetrics[ad.id] || {};
    return { spend: acc.spend + (am.spend || 0), impressions: acc.impressions + (am.impressions || 0), clicks: acc.clicks + (am.clicks || 0), convs: acc.convs + (am.convs || 0) };
  }, { spend: 0, impressions: 0, clicks: 0, convs: 0 });

  return (
    <div className="border-b border-white/[0.03] last:border-0">
      <div className="flex items-center gap-3 px-8 py-3 hover:bg-white/[0.02] transition-all cursor-pointer" onClick={() => setExpanded(e => !e)}>
        <div onClick={e => e.stopPropagation()}>
          <Toggle checked={adset.effective_status === "ACTIVE"} onChange={handleToggle} disabled={toggling} size="sm" />
        </div>
        <button className="text-muted hover:text-white ml-2 flex-shrink-0">
          {expanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
        </button>
        <Layers className="w-3.5 h-3.5 text-accent/50 flex-shrink-0" />
        <div className="flex-1 min-w-0" onClick={e => e.stopPropagation()}>
          <InlineEdit value={adset.name} onSave={handleRename} className="text-xs font-bold text-white/80" />
          <div className="flex items-center gap-2 mt-0.5">
            <StatusBadge status={adset.effective_status} />
            <span className="text-[10px] text-muted">•</span>
            <div onClick={e => e.stopPropagation()}>
              <BudgetEdit valueCents={adset.daily_budget ? parseInt(adset.daily_budget) : null} onSave={handleBudget} />
            </div>
            <span className="text-[10px] text-muted">• {ads.length} anúncios</span>
          </div>
        </div>
        <div className="hidden sm:grid grid-cols-3 gap-4 text-right text-xs mono flex-shrink-0">
          <div><span className="text-[9px] text-muted block">Gasto</span>{formatCurrency(m.spend)}</div>
          <div><span className="text-[9px] text-muted block">Imps</span>{formatNumber(m.impressions)}</div>
          <div><span className="text-[9px] text-muted block">Conv.</span><span className="text-warning">{formatNumber(m.convs)}</span></div>
        </div>
      </div>
      {expanded && ads.map(ad => (
        <AdRow key={ad.id} ad={ad} metrics={adMetrics[ad.id]} thumb={creativesHD?.[ad.id]} token={token} onUpdate={onUpdateAd} />
      ))}
    </div>
  );
}

// ── Campaign Row ───────────────────────────────────────────────────────────
function CampaignRow({ campaign, adsets, ads, campaignMetrics, adMetrics, creativesHD, token, selected, onSelect, onUpdateCampaign, onUpdateAdset, onUpdateAd }: {
  campaign: any; adsets: any[]; ads: any[]; campaignMetrics: any; adMetrics: Record<string, any>;
  creativesHD: Record<string, string>; token: string; selected: boolean;
  onSelect: (id: string, v: boolean) => void;
  onUpdateCampaign: (id: string, p: any) => void;
  onUpdateAdset: (id: string, p: any) => void;
  onUpdateAd: (id: string, p: any) => void;
}) {
  const { toast } = useToast();
  const [expanded, setExpanded] = useState(false);
  const [toggling, setToggling] = useState(false);

  const handleToggle = async (active: boolean) => {
    setToggling(true);
    const status = active ? "ACTIVE" : "PAUSED";
    const r = await updateCampaign(campaign.id, token, { status });
    if (r.success) { onUpdateCampaign(campaign.id, { effective_status: status }); toast(`Campanha ${active ? "ativada" : "pausada"}`, "success"); }
    else toast(r.error || "Erro ao atualizar", "error");
    setToggling(false);
  };

  const handleRename = async (name: string) => {
    const r = await updateCampaign(campaign.id, token, { name });
    if (r.success) { onUpdateCampaign(campaign.id, { name }); toast("Nome atualizado", "success"); }
    else toast(r.error || "Erro", "error");
  };

  const handleBudget = async (cents: number) => {
    const r = await updateCampaign(campaign.id, token, { daily_budget: cents });
    if (r.success) { onUpdateCampaign(campaign.id, { daily_budget: String(cents) }); toast("Orçamento atualizado", "success"); }
    else toast(r.error || "Erro", "error");
  };

  const m = campaignMetrics || { spend: 0, impressions: 0, clicks: 0, convs: 0 };
  const ctr = m.impressions > 0 ? (m.clicks / m.impressions * 100).toFixed(2) : "0.00";
  const cpl = m.convs > 0 ? m.spend / m.convs : 0;
  const objective = OBJ[campaign.objective as string] || campaign.objective || "—";

  return (
    <div className="glass overflow-hidden">
      <div className="flex items-center gap-3 p-4 hover:bg-white/[0.02] transition-all">
        {/* Checkbox */}
        <button onClick={() => onSelect(campaign.id, !selected)} className="text-muted hover:text-white flex-shrink-0">
          {selected ? <CheckSquare className="w-4 h-4 text-accent" /> : <Square className="w-4 h-4" />}
        </button>
        {/* Toggle */}
        <div onClick={e => e.stopPropagation()}>
          <Toggle checked={campaign.effective_status === "ACTIVE"} onChange={handleToggle} disabled={toggling} />
        </div>
        {/* Expand */}
        <button onClick={() => setExpanded(e => !e)} className="text-muted hover:text-white flex-shrink-0">
          {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>
        {/* Name + meta */}
        <div className="flex-1 min-w-0">
          <InlineEdit value={campaign.name} onSave={handleRename} className="text-sm font-bold text-white" />
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            <StatusBadge status={campaign.effective_status} />
            <span className="text-[10px] text-muted">•</span>
            <span className="text-[10px] text-accent font-bold">{objective}</span>
            <span className="text-[10px] text-muted">•</span>
            <BudgetEdit valueCents={campaign.daily_budget ? parseInt(campaign.daily_budget) : null} onSave={handleBudget} />
            <span className="text-[10px] text-muted">• {adsets.length} conjuntos</span>
          </div>
        </div>
        {/* Metrics */}
        <div className="hidden lg:grid grid-cols-5 gap-5 text-right text-xs mono flex-shrink-0">
          <div><span className="text-[9px] text-muted block uppercase">Gasto</span><span className="font-bold">{formatCurrency(m.spend)}</span></div>
          <div><span className="text-[9px] text-muted block uppercase">Imps</span>{formatNumber(m.impressions)}</div>
          <div><span className="text-[9px] text-muted block uppercase">Cliques</span>{formatNumber(m.clicks)}</div>
          <div><span className="text-[9px] text-muted block uppercase">CTR</span>{ctr}%</div>
          <div><span className="text-[9px] text-muted block uppercase">Conv.</span><span className="text-warning font-bold">{formatNumber(m.convs)}</span></div>
        </div>
        <div className="hidden xl:block text-right text-xs mono flex-shrink-0 w-24">
          <span className="text-[9px] text-muted block uppercase">CPL</span>
          <span className={cn("font-bold", cpl > 0 ? "text-white" : "text-muted")}>{cpl > 0 ? formatCurrency(cpl) : "—"}</span>
        </div>
      </div>

      {/* Adsets */}
      {expanded && (
        <div className="border-t border-white/5">
          {adsets.length === 0 ? (
            <p className="px-12 py-4 text-[11px] text-muted">Nenhum conjunto encontrado.</p>
          ) : adsets.map(adset => {
            const adsetAds = ads.filter(a => a.adset_id === adset.id);
            return (
              <AdsetRow key={adset.id} adset={adset} ads={adsetAds} adMetrics={adMetrics}
                creativesHD={creativesHD} token={token}
                onUpdateAdset={onUpdateAdset} onUpdateAd={onUpdateAd} />
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────
export default function CampaignsPage() {
  const { refresh } = useMetaData();
  const { toast } = useToast();
  const {
    dataA, dataAds, hierarchy, creativesHD, isLoading, token,
    searchQuery, setSearchQuery,
    updateHierarchyCampaign, updateHierarchyAdset, updateHierarchyAd,
  } = useAppStore();

  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sortKey, setSortKey] = useState<SortKey>("spend");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [batchLoading, setBatchLoading] = useState(false);

  // Aggregate campaign metrics
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
    let list = safeArray(hierarchy?.campaigns);
    if (statusFilter !== "all") list = list.filter(c => c.effective_status === statusFilter);
    if (searchQuery) list = list.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()));
    const m = campaignMetrics;
    list = [...list].sort((a, b) => {
      const ma = m[a.id] || { spend: 0, convs: 0, impressions: 0 };
      const mb = m[b.id] || { spend: 0, convs: 0, impressions: 0 };
      if (sortKey === "spend") return mb.spend - ma.spend;
      if (sortKey === "convs") return mb.convs - ma.convs;
      if (sortKey === "impressions") return mb.impressions - ma.impressions;
      if (sortKey === "cpl") {
        const ca = ma.convs > 0 ? ma.spend / ma.convs : 999999;
        const cb = mb.convs > 0 ? mb.spend / mb.convs : 999999;
        return ca - cb;
      }
      return a.name.localeCompare(b.name);
    });
    return list;
  }, [hierarchy, statusFilter, searchQuery, sortKey, campaignMetrics]);

  const handleSelect = (id: string, v: boolean) => {
    setSelected(prev => { const n = new Set(prev); v ? n.add(id) : n.delete(id); return n; });
  };

  const handleSelectAll = () => {
    if (selected.size === campaigns.length) setSelected(new Set());
    else setSelected(new Set(campaigns.map(c => c.id)));
  };

  const handleBatch = async (status: "ACTIVE" | "PAUSED" | "ARCHIVED") => {
    if (selected.size === 0) return;
    setBatchLoading(true);
    const ids = Array.from(selected);
    const results = await batchUpdateStatus(ids, token, status);
    const ok = results.filter(r => r.success).length;
    const fail = results.filter(r => !r.success).length;
    results.filter(r => r.success).forEach(r => updateHierarchyCampaign(r.id, { effective_status: status }));
    if (ok > 0) toast(`${ok} campanha(s) ${status === "ACTIVE" ? "ativada(s)" : status === "PAUSED" ? "pausada(s)" : "arquivada(s)"}`, "success");
    if (fail > 0) toast(`${fail} falha(s)`, "error");
    setSelected(new Set());
    setBatchLoading(false);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Gestão de Campanhas</h1>
          <p className="text-xs sm:text-sm text-muted">{campaigns.length} campanhas • Clique para expandir conjuntos e anúncios</p>
        </div>
        <button onClick={() => { clearFetchCache(); refresh(); }} disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-xl text-[11px] font-bold uppercase tracking-widest hover:bg-accent/90 transition-all disabled:opacity-50 w-fit">
          <RotateCw className={cn("w-3.5 h-3.5", isLoading && "animate-spin")} />
          Sincronizar
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Buscar campanha..."
            className="bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-accent w-56" />
        </div>
        <div className="flex bg-white/5 rounded-xl border border-white/10 p-0.5">
          {(["all", "ACTIVE", "PAUSED", "ARCHIVED"] as StatusFilter[]).map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={cn("px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all",
                statusFilter === s ? "bg-accent text-white" : "text-muted hover:text-white")}>
              {s === "all" ? "Todas" : s === "ACTIVE" ? "Ativas" : s === "PAUSED" ? "Pausadas" : "Arquivadas"}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1.5 ml-auto">
          <ArrowUpDown className="w-3.5 h-3.5 text-muted" />
          <select value={sortKey} onChange={e => setSortKey(e.target.value as SortKey)}
            className="bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-[11px] text-white focus:outline-none">
            <option value="spend">Gasto ↓</option>
            <option value="convs">Conversas ↓</option>
            <option value="cpl">CPL ↑</option>
            <option value="impressions">Impressões ↓</option>
            <option value="name">Nome A-Z</option>
          </select>
        </div>
      </div>

      {/* Batch actions */}
      {selected.size > 0 && (
        <div className="flex items-center gap-3 p-3 bg-accent/10 border border-accent/20 rounded-xl">
          <span className="text-xs font-bold text-accent">{selected.size} selecionada(s)</span>
          <div className="flex gap-2 ml-auto">
            {[
              { label: "Ativar", status: "ACTIVE" as const, color: "bg-success/20 text-success border-success/30" },
              { label: "Pausar", status: "PAUSED" as const, color: "bg-muted/20 text-muted border-white/10" },
              { label: "Arquivar", status: "ARCHIVED" as const, color: "bg-warning/20 text-warning border-warning/30" },
            ].map(({ label, status, color }) => (
              <button key={status} onClick={() => handleBatch(status)} disabled={batchLoading}
                className={cn("px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase border transition-all disabled:opacity-50", color)}>
                {label}
              </button>
            ))}
            <button onClick={() => setSelected(new Set())} className="px-3 py-1.5 rounded-lg text-[10px] font-bold text-muted hover:text-white">
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Table header */}
      {campaigns.length > 0 && (
        <div className="flex items-center gap-3 px-4 py-2 text-[9px] font-bold text-muted uppercase tracking-widest border-b border-white/5">
          <button onClick={handleSelectAll} className="text-muted hover:text-white">
            {selected.size === campaigns.length && campaigns.length > 0 ? <CheckSquare className="w-4 h-4 text-accent" /> : <Square className="w-4 h-4" />}
          </button>
          <span className="w-11 shrink-0" />
          <span className="w-4 shrink-0" />
          <span className="flex-1">Campanha</span>
          <div className="hidden lg:grid grid-cols-5 gap-5 text-right w-64 shrink-0">
            <span>Gasto</span><span>Imps</span><span>Cliques</span><span>CTR</span><span>Conv.</span>
          </div>
          <span className="hidden xl:block w-24 text-right">CPL</span>
        </div>
      )}

      {/* Loading */}
      {isLoading && campaigns.length === 0 && (
        <div className="flex items-center justify-center py-20"><RotateCw className="w-8 h-8 text-accent animate-spin" /></div>
      )}

      {/* Empty */}
      {!isLoading && campaigns.length === 0 && (
        <div className="glass p-12 text-center">
          <Layers className="w-12 h-12 text-muted/20 mx-auto mb-4" />
          <p className="text-sm font-bold text-muted uppercase tracking-widest">Nenhuma campanha encontrada</p>
          <p className="text-xs text-muted/50 mt-1">Sincronize sua conta Meta ou ajuste os filtros.</p>
        </div>
      )}

      {/* Campaign rows */}
      <div className="space-y-2">
        {campaigns.map(campaign => {
          const campAdsets = safeArray(hierarchy?.adsets).filter(as => as.campaign_id === campaign.id);
          const campAds = safeArray(hierarchy?.ads).filter(ad => ad.campaign_id === campaign.id);
          return (
            <CampaignRow key={campaign.id} campaign={campaign}
              adsets={campAdsets} ads={campAds}
              campaignMetrics={campaignMetrics[campaign.id]}
              adMetrics={adMetrics} creativesHD={creativesHD || {}}
              token={token} selected={selected.has(campaign.id)}
              onSelect={handleSelect}
              onUpdateCampaign={updateHierarchyCampaign}
              onUpdateAdset={updateHierarchyAdset}
              onUpdateAd={updateHierarchyAd}
            />
          );
        })}
      </div>
    </div>
  );
}

"use client";

import { useAppStore } from "@/store/useAppStore";
import { runRefresh, clearFetchCache } from "@/hooks/useMetaData";
import { useMemo, useState, useEffect } from "react";
import { safeArray } from "@/lib/safeArray";
import { formatCurrency, formatNumber, extractMetric, CONVERSATION_ACTION_TYPES } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import {
  Search, SlidersHorizontal, RotateCw, Sparkles, ImageOff,
  Play, Pause, Eye, Copy, Bot, TrendingUp, TrendingDown,
  Zap, AlertTriangle, CheckCircle2, Filter, X,
} from "lucide-react";

// ── Skeleton ──────────────────────────────────────────────────────────────
function CreativeSkeleton() {
  return (
    <div className="rounded-2xl overflow-hidden border border-white/[0.06] bg-surface">
      <div className="aspect-video shimmer" />
      <div className="p-4 space-y-3">
        <div className="h-3 w-3/4 shimmer rounded" />
        <div className="h-3 w-1/2 shimmer rounded" />
        <div className="grid grid-cols-3 gap-2 pt-1">
          {[1,2,3].map(i => <div key={i} className="h-8 shimmer rounded-lg" />)}
        </div>
      </div>
    </div>
  );
}

// ── Score badge ───────────────────────────────────────────────────────────
function ScoreBadge({ score }: { score: number }) {
  const color = score >= 70 ? "text-success bg-success/10 border-success/20"
    : score >= 40 ? "text-warning bg-warning/10 border-warning/20"
    : "text-danger bg-danger/10 border-danger/20";
  const icon = score >= 70 ? <TrendingUp className="w-3 h-3" />
    : score >= 40 ? <AlertTriangle className="w-3 h-3" />
    : <TrendingDown className="w-3 h-3" />;
  return (
    <span className={cn("flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border", color)}>
      {icon} {score}
    </span>
  );
}

// ── Platform badge ────────────────────────────────────────────────────────
function PlatformBadge({ platform }: { platform: string }) {
  const isMeta = platform?.toLowerCase().includes("facebook") || platform?.toLowerCase().includes("instagram") || !platform;
  return (
    <span className={cn("text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider",
      isMeta ? "bg-blue-500/15 text-blue-400 border border-blue-500/20" : "bg-green-500/15 text-green-400 border border-green-500/20")}>
      {isMeta ? "Meta" : "Google"}
    </span>
  );
}

// ── Creative Card ─────────────────────────────────────────────────────────
function CreativeCard({ creative, thumb }: { creative: any; thumb?: string }) {
  const [hovered, setHovered] = useState(false);
  const [imgError, setImgError] = useState(false);

  const cpl = creative._convs > 0 ? creative._spend / creative._convs : 0;
  const ctr = creative._impressions > 0 ? (creative._clicks / creative._impressions) * 100 : 0;
  const score = Math.min(100, Math.round(
    (ctr > 2 ? 30 : ctr > 1 ? 20 : ctr > 0.5 ? 10 : 0) +
    (creative._convs > 10 ? 40 : creative._convs > 5 ? 25 : creative._convs > 0 ? 15 : 0) +
    (creative._spend > 0 ? 30 : 0)
  ));

  const isActive = creative.effective_status === "ACTIVE";

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={cn(
        "rounded-2xl overflow-hidden border transition-all duration-200 cursor-pointer group",
        "bg-surface border-white/[0.06]",
        hovered ? "border-white/[0.12] shadow-card-hover -translate-y-0.5" : "shadow-card"
      )}
    >
      {/* Thumbnail */}
      <div className="relative aspect-video bg-surface-2 overflow-hidden">
        {thumb && !imgError ? (
          <img src={thumb} alt={creative.ad_name || ""} onError={() => setImgError(true)}
            className={cn("w-full h-full object-cover transition-transform duration-500", hovered && "scale-105")}
            loading="lazy" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ImageOff className="w-8 h-8 text-white/10" />
          </div>
        )}

        {/* Overlay on hover */}
        <div className={cn("absolute inset-0 bg-black/60 flex items-center justify-center gap-2 transition-opacity duration-200",
          hovered ? "opacity-100" : "opacity-0")}>
          <button className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-all" title="Ver">
            <Eye className="w-4 h-4 text-white" />
          </button>
          <button className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-all" title="Duplicar">
            <Copy className="w-4 h-4 text-white" />
          </button>
          <button className="p-2 bg-accent/80 hover:bg-accent rounded-lg transition-all" title="Analisar com IA">
            <Bot className="w-4 h-4 text-white" />
          </button>
          <button className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-all" title={isActive ? "Pausar" : "Ativar"}>
            {isActive ? <Pause className="w-4 h-4 text-white" /> : <Play className="w-4 h-4 text-white" />}
          </button>
        </div>

        {/* Badges */}
        <div className="absolute top-2 left-2 flex items-center gap-1.5">
          <PlatformBadge platform={creative.publisher_platform} />
        </div>
        <div className="absolute top-2 right-2">
          <ScoreBadge score={score} />
        </div>
        <div className="absolute bottom-2 left-2">
          <span className={cn("text-[9px] font-bold px-2 py-0.5 rounded-full",
            isActive ? "bg-success/20 text-success border border-success/30" : "bg-white/10 text-white/50 border border-white/10")}>
            {isActive ? "● Ativo" : "⏸ Pausado"}
          </span>
        </div>
      </div>

      {/* Info */}
      <div className="p-4 space-y-3">
        <div>
          <p className="text-[13px] font-semibold text-white truncate">{creative.ad_name || "Anúncio sem nome"}</p>
          <p className="text-[11px] text-white/40 truncate mt-0.5">{creative.campaign_name}</p>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "Gasto", value: formatCurrency(creative._spend) },
            { label: "Conv.", value: formatNumber(creative._convs) },
            { label: "CTR",   value: `${ctr.toFixed(1)}%` },
          ].map(m => (
            <div key={m.label} className="bg-surface-2 rounded-lg p-2 text-center">
              <p className="text-[9px] text-white/30 uppercase tracking-wider mb-0.5">{m.label}</p>
              <p className="text-[12px] font-bold text-white mono">{m.value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Bottom metrics strip ──────────────────────────────────────────────────
function MetricsStrip({ creatives, loading }: { creatives: any[]; loading: boolean }) {
  const totals = useMemo(() => {
    const active = creatives.filter(c => c.effective_status === "ACTIVE").length;
    const imps = creatives.reduce((s, c) => s + c._impressions, 0);
    const avgCtr = creatives.length > 0
      ? creatives.reduce((s, c) => s + (c._impressions > 0 ? c._clicks / c._impressions * 100 : 0), 0) / creatives.length
      : 0;
    const winning = creatives.filter(c => {
      const ctr = c._impressions > 0 ? c._clicks / c._impressions * 100 : 0;
      return ctr > 2 && c._convs > 5;
    }).length;
    return { active, imps, avgCtr, winning, total: creatives.length };
  }, [creatives]);

  const items = [
    { label: "Impressões",        value: loading ? "—" : formatNumber(totals.imps) },
    { label: "CTR Médio",         value: loading ? "—" : `${totals.avgCtr.toFixed(2)}%` },
    { label: "Criativos Ativos",  value: loading ? "—" : String(totals.active) },
    { label: "Criativos Vencedores", value: loading ? "—" : String(totals.winning) },
    { label: "Total Analisados",  value: loading ? "—" : String(totals.total) },
  ];

  return (
    <div className="fixed bottom-0 z-30 border-t border-white/[0.06]"
      style={{ left: "220px", right: 0, background: "rgba(2,6,23,0.95)", backdropFilter: "blur(20px)" }}>
      <div className="flex items-center divide-x divide-white/[0.06] max-w-[1440px] mx-auto">
        {items.map(item => (
          <div key={item.label} className="flex-1 px-5 py-3 text-center">
            <p className="text-[9px] font-semibold text-white/30 uppercase tracking-widest mb-0.5">{item.label}</p>
            <p className="text-[15px] font-bold text-white mono">{item.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────
function EmptyState({ onSync }: { onSync: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="relative mb-6">
        <div className="w-20 h-20 rounded-2xl bg-surface-2 border border-white/[0.06] flex items-center justify-center">
          <ImageOff className="w-9 h-9 text-white/20" />
        </div>
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-accent/5 to-transparent animate-pulse" />
      </div>
      <h3 className="text-xl font-bold text-white mb-2">Nenhum criativo encontrado</h3>
      <p className="text-[13px] text-white/40 max-w-sm mb-6 leading-relaxed">
        Sincronize suas contas de anúncios para começar a analisar criativos em tempo real.
      </p>
      <div className="flex items-center gap-3">
        <button onClick={onSync}
          className="flex items-center gap-2 px-5 py-2.5 bg-accent hover:bg-accent-2 text-white text-[13px] font-semibold rounded-xl transition-all">
          <RotateCw className="w-4 h-4" /> Sincronizar Meta
        </button>
        <button className="flex items-center gap-2 px-5 py-2.5 bg-white/[0.05] hover:bg-white/[0.08] text-white/60 text-[13px] font-semibold rounded-xl border border-white/[0.08] transition-all">
          Conectar Google Ads
        </button>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────
export default function CreativeHubPage() {
  const { dataAds, searchQuery, setSearchQuery, creativesHD, isLoading, hierarchy } = useAppStore();
  const [mounted, setMounted] = useState(false);
  const [statusFilter, setStatusFilter] = useState<"all" | "ACTIVE" | "PAUSED">("all");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    setMounted(true);
    runRefresh(); // uses cache if fresh
  }, []);

  const safeHD: Record<string, string> = creativesHD || {};

  const creativeList = useMemo(() => {
    const map: Record<string, any> = {};
    safeArray(dataAds).forEach(item => {
      const id = item.ad_id || item.campaign_id;
      if (!id) return;
      if (!map[id]) map[id] = { ...item, _spend: 0, _impressions: 0, _clicks: 0, _convs: 0 };
      map[id]._spend += parseFloat(item.spend || "0");
      map[id]._impressions += parseInt(item.impressions || "0");
      map[id]._clicks += parseInt(item.clicks || "0");
      map[id]._convs += extractMetric(item.actions, CONVERSATION_ACTION_TYPES);
    });

    safeArray(hierarchy?.ads).forEach(ad => {
      if (map[ad.id]) {
        const c = (ad as any).creative;
        if (c && !safeHD[ad.id]) map[ad.id]._thumb = c.thumbnail_url || c.image_url;
      }
    });

    return Object.values(map)
      .filter((c: any) => {
        const q = (searchQuery || "").toLowerCase();
        const matchSearch = !q || (c.ad_name || "").toLowerCase().includes(q) || (c.campaign_name || "").toLowerCase().includes(q);
        const matchStatus = statusFilter === "all" || c.effective_status === statusFilter;
        return matchSearch && matchStatus;
      })
      .sort((a: any, b: any) => b._spend - a._spend);
  }, [dataAds, searchQuery, hierarchy, safeHD, statusFilter]);

  const handleSync = () => { clearFetchCache(); runRefresh(true); };

  if (!mounted) return <div className="min-h-[60vh]" />;

  return (
    <div className="pb-20 fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Creative Hub</h1>
          <p className="text-[13px] text-white/40 mt-1">Analise, compare e otimize cada criativo em tempo real.</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button className="flex items-center gap-2 px-4 py-2 bg-accent hover:bg-accent-2 text-white text-[12px] font-semibold rounded-xl transition-all">
            <Sparkles className="w-3.5 h-3.5" />
            AI Insights
          </button>
        </div>
      </div>

      {/* Search + Filters */}
      <div className="flex items-center gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            placeholder="Buscar criativo ou campanha..."
            className="w-full bg-surface border border-white/[0.06] rounded-xl pl-10 pr-4 py-2.5 text-[13px] text-white placeholder:text-white/25 focus:outline-none focus:border-accent/40 transition-colors" />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Status filter */}
        <div className="flex items-center bg-surface border border-white/[0.06] rounded-xl p-1 gap-0.5">
          {(["all", "ACTIVE", "PAUSED"] as const).map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={cn("px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all",
                statusFilter === s ? "bg-accent text-white" : "text-white/40 hover:text-white/70")}>
              {s === "all" ? "Todos" : s === "ACTIVE" ? "Ativos" : "Pausados"}
            </button>
          ))}
        </div>

        <div className="text-[12px] text-white/30 font-medium ml-auto">
          {creativeList.length} criativo{creativeList.length !== 1 ? "s" : ""}
        </div>
      </div>

      {/* Grid */}
      {isLoading && creativeList.length === 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => <CreativeSkeleton key={i} />)}
        </div>
      ) : creativeList.length === 0 ? (
        <EmptyState onSync={handleSync} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {creativeList.map((creative: any) => {
            const id = creative.ad_id || creative.campaign_id;
            return (
              <CreativeCard key={id} creative={creative} thumb={safeHD[id] || creative._thumb} />
            );
          })}
        </div>
      )}

      {/* Bottom metrics strip */}
      <MetricsStrip creatives={creativeList} loading={isLoading && creativeList.length === 0} />
    </div>
  );
}

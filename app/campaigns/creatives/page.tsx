"use client";

import { useAppStore } from "@/store/useAppStore";
import { useMetaData, clearFetchCache } from "@/hooks/useMetaData";
import { useMemo, useState, useEffect } from "react";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { safeArray } from "@/lib/safeArray";
import { formatCurrency, formatNumber, extractMetric, CONVERSATION_ACTION_TYPES } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import dynamic from "next/dynamic";
import { Image, Sparkles, Loader2, Search, Eye, RotateCw } from "lucide-react";
import { clearFetchCache as clearCache } from "@/hooks/useMetaData";

const CreativeCard = dynamic(
  () => import("@/components/creatives/CreativeCard").then(m => ({ default: m.CreativeCard })),
  { ssr: false }
);

export default function CreativeHubPage() {
  const { dataAds, searchQuery, setSearchQuery, creativesHD, isLoading, hierarchy } = useAppStore();
  const [mounted, setMounted] = useState(false);
  const { refresh } = useMetaData();

  useEffect(() => {
    setMounted(true);
    clearFetchCache();
    refresh();
  }, []);

  const safeHD: Record<string, string> = creativesHD || {};

  // Build creative list from dataAds, enriched with hierarchy creative data
  const creativeList = useMemo(() => {
    const map: Record<string, any> = {};

    safeArray(dataAds).forEach(item => {
      const id = item.ad_id || item.campaign_id;
      if (!id) return;
      if (!map[id]) {
        map[id] = { ...item, _spend: 0, _impressions: 0, _clicks: 0, _convs: 0 };
      }
      map[id]._spend += parseFloat(item.spend || "0");
      map[id]._impressions += parseInt(item.impressions || "0");
      map[id]._clicks += parseInt(item.clicks || "0");
      map[id]._convs += extractMetric(item.actions, CONVERSATION_ACTION_TYPES);
    });

    // Enrich with hierarchy creative thumbnails
    safeArray(hierarchy?.ads).forEach(ad => {
      if (map[ad.id]) {
        const creative = (ad as any).creative;
        if (creative && !safeHD[ad.id]) {
          map[ad.id]._thumb = creative.thumbnail_url || creative.image_url;
        }
      }
    });

    return Object.values(map)
      .filter((c: any) =>
        !searchQuery ||
        (c.ad_name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.campaign_name || "").toLowerCase().includes(searchQuery.toLowerCase())
      )
      .sort((a: any, b: any) => b._spend - a._spend);
  }, [dataAds, searchQuery, hierarchy, safeHD]);

  if (!mounted) return <div className="min-h-[60vh]" />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-white/40">
            Creative Hub
          </h1>
          <p className="text-sm text-muted">Performance visual dos seus anúncios.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-lg border border-white/10">
            <Sparkles className="w-3.5 h-3.5 text-warning animate-pulse" />
            <span className="text-[10px] font-bold text-muted uppercase tracking-widest">
              {creativeList.length} Criativos
            </span>
          </div>
          <button onClick={() => { clearFetchCache(); refresh(); }} disabled={isLoading}
            className="flex items-center gap-2 px-3 py-1.5 bg-accent text-white rounded-lg text-[10px] font-bold uppercase disabled:opacity-50">
            <RotateCw className={cn("w-3.5 h-3.5", isLoading && "animate-spin")} />
            Atualizar
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
        <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Buscar anúncio..."
          className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-accent" />
      </div>

      {/* Loading */}
      {isLoading && creativeList.length === 0 && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-accent animate-spin" />
        </div>
      )}

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {creativeList.map((creative: any) => {
          const id = creative.ad_id || creative.campaign_id;
          const thumb = safeHD[id] || creative._thumb;
          const cpl = creative._convs > 0 ? creative._spend / creative._convs : 0;

          return (
            <ErrorBoundary key={id} name={`CreativeCard-${id}`}>
              <div className="glass overflow-hidden group hover:scale-[1.02] transition-all">
                {/* Thumbnail */}
                <div className="aspect-video bg-white/5 relative overflow-hidden">
                  {thumb ? (
                    <img src={thumb} alt={creative.ad_name || ""} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Image className="w-8 h-8 text-muted/20" />
                    </div>
                  )}
                  {/* Status badge */}
                  <div className="absolute top-2 left-2">
                    <span className={cn("text-[9px] font-bold px-2 py-0.5 rounded-full",
                      creative.effective_status === "ACTIVE" ? "bg-success/20 text-success" : "bg-white/10 text-muted")}>
                      {creative.effective_status === "ACTIVE" ? "● Ativo" : "⏸ Pausado"}
                    </span>
                  </div>
                </div>

                {/* Info */}
                <div className="p-3 space-y-2">
                  <div>
                    <p className="text-xs font-bold text-white truncate">{creative.ad_name || creative.campaign_name}</p>
                    <p className="text-[10px] text-muted truncate">{creative.campaign_name}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-white/[0.03] rounded-lg p-2">
                      <span className="text-[9px] font-bold text-muted uppercase block">Gasto</span>
                      <span className="text-xs font-bold mono text-white">{formatCurrency(creative._spend)}</span>
                    </div>
                    <div className="bg-white/[0.03] rounded-lg p-2">
                      <span className="text-[9px] font-bold text-muted uppercase block">Conversas</span>
                      <span className="text-xs font-bold mono text-warning">{formatNumber(creative._convs)}</span>
                    </div>
                    <div className="bg-white/[0.03] rounded-lg p-2">
                      <span className="text-[9px] font-bold text-muted uppercase block">Imps</span>
                      <span className="text-xs font-bold mono">{formatNumber(creative._impressions)}</span>
                    </div>
                    <div className="bg-white/[0.03] rounded-lg p-2">
                      <span className="text-[9px] font-bold text-muted uppercase block">CPL</span>
                      <span className="text-xs font-bold mono">{cpl > 0 ? formatCurrency(cpl) : "—"}</span>
                    </div>
                  </div>
                </div>
              </div>
            </ErrorBoundary>
          );
        })}
      </div>

      {/* Empty */}
      {!isLoading && creativeList.length === 0 && (
        <div className="py-40 text-center glass rounded-2xl border-dashed">
          <Image className="w-12 h-12 text-muted/20 mx-auto mb-4" />
          <h3 className="text-sm font-bold text-muted uppercase tracking-widest">Nenhum criativo encontrado</h3>
          <p className="text-xs text-muted/50 mt-1">Sincronize sua conta Meta para ver os criativos.</p>
        </div>
      )}
    </div>
  );
}

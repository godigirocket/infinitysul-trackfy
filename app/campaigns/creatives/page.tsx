"use client";

import { useAppStore } from "@/store/useAppStore";
import { useMetaData, clearFetchCache } from "@/hooks/useMetaData";
import { useMemo, useState, useEffect } from "react";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { safeArray } from "@/lib/safeArray";
import dynamic from "next/dynamic";
import { Image, Sparkles, Loader2 } from "lucide-react";

const CreativeCard = dynamic(
  () => import("@/components/creatives/CreativeCard").then(m => ({ default: m.CreativeCard })),
  { ssr: false }
);

export default function CreativeHubPage() {
  const { dataAds, searchQuery, creativesHD, isLoading } = useAppStore();
  const [mounted, setMounted] = useState(false);
  const { refresh } = useMetaData();

  useEffect(() => {
    setMounted(true);
    // Clear cache so creatives always refresh when visiting this page
    clearFetchCache();
    refresh();
  }, []);

  const safeHD: Record<string, string> = creativesHD || {};

  const creativeList = useMemo(() => {
    const map: Record<string, any> = {};
    safeArray(dataAds).forEach(item => {
      const id = item.ad_id || item.campaign_id;
      if (!id) return;
      if (!map[id]) {
        map[id] = { ...item };
      } else {
        map[id].spend = (parseFloat(map[id].spend || "0") + parseFloat(item.spend || "0")).toString();
        map[id].impressions = (parseInt(map[id].impressions || "0") + parseInt(item.impressions || "0")).toString();
      }
    });
    return Object.values(map)
      .filter((c: any) =>
        (c.ad_name || "").toLowerCase().includes((searchQuery || "").toLowerCase()) ||
        (c.campaign_name || "").toLowerCase().includes((searchQuery || "").toLowerCase())
      )
      .sort((a: any, b: any) => parseFloat(b.spend || "0") - parseFloat(a.spend || "0"));
  }, [dataAds, searchQuery]);

  if (!mounted) return <div className="min-h-[60vh]" />;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-white/40">
            Creative Hub (Visual Insight)
          </h1>
          <p className="text-sm text-muted">A performance visual dos seus anúncios ao vivo.</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-lg border border-white/10">
          <Sparkles className="w-3.5 h-3.5 text-warning animate-pulse" />
          <span className="text-[10px] font-bold text-muted uppercase tracking-widest">
            {creativeList.length} Criativos Analisados
          </span>
        </div>
      </div>

      {isLoading && creativeList.length === 0 && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-accent animate-spin" />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {creativeList.map((creative) => {
          const id = creative.ad_id || creative.campaign_id;
          return (
            <ErrorBoundary key={id} name={`CreativeCard-${id}`}>
              <CreativeCard insight={creative} thumbnail={safeHD[id]} />
            </ErrorBoundary>
          );
        })}
      </div>

      {!isLoading && creativeList.length === 0 && (
        <div className="py-40 text-center glass rounded-2xl border-dashed">
          <Image className="w-12 h-12 text-muted/20 mx-auto mb-4" />
          <h3 className="text-sm font-bold text-muted uppercase tracking-widest">Nenhum criativo encontrado</h3>
          <p className="text-xs text-muted/50">Sincronize sua conta Meta para ver os criativos.</p>
        </div>
      )}
    </div>
  );
}

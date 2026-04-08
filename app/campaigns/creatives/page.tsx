"use client";

import { useAppStore } from "@/store/useAppStore";
import { CreativeCard } from "@/components/creatives/CreativeCard";
import { useMetaData } from "@/hooks/useMetaData";
import { useMemo } from "react";
import { Image, Sparkles } from "lucide-react";

export default function CreativeHubPage() {
  const { dataAds, searchQuery, creativesHD } = useAppStore();

  // Group by Ad ID to avoid duplicate creatives
  const creativeList = useMemo(() => {
    const map: Record<string, any> = {};
    dataAds.forEach(item => {
      const id = item.ad_id || item.campaign_id;
      if (!map[id]) {
        map[id] = { ...item };
      } else {
        map[id].spend = (parseFloat(map[id].spend || "0") + parseFloat(item.spend || "0")).toString();
        map[id].impressions = (parseInt(map[id].impressions || "0") + parseInt(item.impressions || "0")).toString();
      }
    });

    return Object.values(map).filter((c: any) => 
      (c.ad_name || "").toLowerCase().includes(searchQuery.toLowerCase()) || 
      (c.campaign_name || "").toLowerCase().includes(searchQuery.toLowerCase())
    ).sort((a: any, b: any) => parseFloat(b.spend) - parseFloat(a.spend));
  }, [dataAds, searchQuery]);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {creativeList.map((creative) => (
          <CreativeCard 
            key={creative.ad_id || creative.campaign_id} 
            insight={creative} 
            thumbnail={creativesHD[creative.ad_id || creative.campaign_id]}
          />
        ))}
      </div>

      {creativeList.length === 0 && (
        <div className="py-40 text-center glass rounded-2xl border-dashed">
          <Image className="w-12 h-12 text-muted/20 mx-auto mb-4" />
          <h3 className="text-sm font-bold text-muted uppercase tracking-widest">Nenhum criativo encontrado</h3>
          <p className="text-xs text-muted/50">Tente ajustar seus filtros ou verifique a conexão com o Meta Ads.</p>
        </div>
      )}
    </div>
  );
}

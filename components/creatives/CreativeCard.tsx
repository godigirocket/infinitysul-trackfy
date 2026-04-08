"use client";

import { MetaInsight } from "@/types";
import { calculateHookRate, calculateHoldRate } from "@/services/rulesEngine";
import { formatPercent } from "@/lib/formatters";
import { Play, MousePointer2, Star, AlertTriangle, ImageIcon } from "lucide-react";
import { cn } from "@/components/ui/Button";
import { useAppStore } from "@/store/useAppStore";

interface CreativeCardProps {
  insight: MetaInsight;
  thumbnail?: string;
}

export function CreativeCard({ insight, thumbnail }: CreativeCardProps) {
  const { hierarchy, creativesHD } = useAppStore(s => ({ hierarchy: s.hierarchy, creativesHD: s.creativesHD }));
  
  // Priority: creativesHD map (HD from /ads→creative) > hierarchy > thumbnail prop
  let imageUrl: string | undefined =
    (insight.ad_id ? creativesHD[insight.ad_id] : undefined) || thumbnail;

  if (!imageUrl && hierarchy?.ads) {
    const hierarchyAd = hierarchy.ads.find(a => a.id === insight.ad_id);
    if (hierarchyAd) {
      const creative = (hierarchyAd as any).creative || (hierarchyAd as any).adcreatives?.data?.[0];
      imageUrl = creative?.image_url || creative?.thumbnail_url;
    }
  }

  const hookRate = calculateHookRate(insight);
  const holdRate = calculateHoldRate(insight);
  
  const isHighHook = hookRate > 25;
  const isLowHook = hookRate < 10 && hookRate > 0;
  
  return (
    <div className="glass group overflow-hidden transition-all hover:scale-[1.02] hover:shadow-2xl">
      <div className="relative aspect-video bg-background overflow-hidden">
        {imageUrl ? (
          <img 
            src={imageUrl} 
            alt={insight.ad_name || "Creative"} 
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-muted/20 gap-2 bg-white/[0.01]">
            <ImageIcon className="w-8 h-8" />
            <span className="text-[9px] font-bold uppercase tracking-widest text-muted/30">Sem imagem</span>
          </div>
        )}
        
        {/* Performance Overlays */}
        <div className="absolute top-2 left-2 flex gap-2">
          <div className={cn(
            "px-2 py-1 rounded backdrop-blur-md border flex items-center gap-1.5",
            isHighHook ? "bg-success/20 border-success/30 text-success" : 
            isLowHook ? "bg-danger/20 border-danger/30 text-danger" : "bg-white/10 border-white/20 text-white"
          )}>
            <MousePointer2 className="w-3 h-3" />
            <span className="text-[10px] font-bold">Hook: {formatPercent(hookRate)}</span>
          </div>
        </div>

        {isHighHook && (
          <div className="absolute top-2 right-2 p-1.5 bg-warning/20 border border-warning/30 text-warning rounded-full shadow-lg animate-pulse">
            <Star className="w-3.5 h-3.5 fill-warning" />
          </div>
        )}
      </div>

      <div className="p-3 sm:p-4 space-y-3">
        <div className="flex flex-col">
          <span className="text-xs font-bold truncate text-white/90">{insight.ad_name || insight.campaign_name}</span>
          <span className="text-[10px] text-muted uppercase tracking-tighter mono">ID: {(insight.ad_id || insight.campaign_id || "").slice(-8)}</span>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-2">
          <div className="space-y-1">
            <span className="text-[9px] font-bold text-muted uppercase">Retenção</span>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold mono">{formatPercent(holdRate)}</span>
              <div className="h-1 flex-1 bg-white/5 rounded-full overflow-hidden">
                <div 
                  className={cn("h-full transition-all duration-1000", holdRate > 15 ? "bg-success" : holdRate > 5 ? "bg-warning" : "bg-danger")}
                  style={{ width: `${Math.min(100, (holdRate / 20) * 100)}%` }}
                />
              </div>
            </div>
          </div>
          <div className="space-y-1 text-right">
             <span className="text-[9px] font-bold text-muted uppercase">Investido</span>
             <p className="text-sm font-bold mono text-accent">R$ {parseFloat(insight.spend).toFixed(2)}</p>
          </div>
        </div>

        {isLowHook && (
          <div className="flex items-center gap-1.5 mt-2 text-danger">
            <AlertTriangle className="w-3 h-3" />
            <span className="text-[9px] font-bold uppercase">Troca recomendada: Gancho fraco</span>
          </div>
        )}
      </div>
    </div>
  );
}

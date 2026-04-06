"use client";

import { MetaInsight } from "@/types";
import { calculateHookRate, calculateHoldRate } from "@/services/rulesEngine";
import { formatPercent } from "@/lib/formatters";
import { Play, MousePointer2, Star, AlertTriangle } from "lucide-react";
import { cn } from "@/components/ui/Button";

interface CreativeCardProps {
  insight: MetaInsight;
  thumbnail?: string;
}

export function CreativeCard({ insight, thumbnail }: CreativeCardProps) {
  const hookRate = calculateHookRate(insight);
  const holdRate = calculateHoldRate(insight);
  
  const isHighHook = hookRate > 25;
  const isLowHook = hookRate < 10;
  
  return (
    <div className="glass group overflow-hidden transition-all hover:scale-[1.02] hover:shadow-2xl">
      <div className="relative aspect-video bg-background overflow-hidden">
        {thumbnail ? (
          <img src={thumbnail} alt={insight.ad_name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted/20">
            <Play className="w-12 h-12" />
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

      <div className="p-4 space-y-3">
        <div className="flex flex-col">
          <span className="text-xs font-bold truncate text-white/90">{insight.ad_name || insight.campaign_name}</span>
          <span className="text-[10px] text-muted uppercase tracking-tighter">ID: {insight.ad_id || insight.campaign_id}</span>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-2">
          <div className="space-y-1">
            <span className="text-[9px] font-bold text-muted uppercase">Retenção (Hold)</span>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold mono">{formatPercent(holdRate)}</span>
              <div className="h-1 flex-1 bg-white/5 rounded-full overflow-hidden">
                <div 
                  className={cn("h-full", holdRate > 15 ? "bg-success" : "bg-warning")}
                  style={{ width: `${Math.min(100, (holdRate / 20) * 100)}%` }}
                />
              </div>
            </div>
          </div>
          <div className="space-y-1 text-right">
             <span className="text-[9px] font-bold text-muted uppercase">Gasto Ad</span>
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

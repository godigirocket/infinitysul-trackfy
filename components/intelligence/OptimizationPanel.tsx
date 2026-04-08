"use client";

import { useMemo } from "react";
import { useAppStore } from "@/store/useAppStore";
import { formatCurrency, extractMetric } from "@/lib/formatters";
import { Zap, Target, AlertTriangle, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

// --- Types ---
type SignalType = 'scale' | 'monitor' | 'optimize';

interface CampaignIntel {
  campaign_id: string;
  campaign_name: string;
  leads: number;
  cpl: number;
  signal: SignalType;
  signalReason: string;
}

export function OptimizationPanel({ intel }: { intel: CampaignIntel[] }) {
  const scale = intel.filter(c => c.signal === 'scale');
  const monitor = intel.filter(c => c.signal === 'monitor');
  const optimize = intel.filter(c => c.signal === 'optimize');

  const Section = ({ title, items, color, bg, icon: Icon, badgeColor }: any) => (
    <div className={cn("glass p-6 border-l-4 transition-all hover:bg-white/[0.04] group", color)}>
      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/5">
        <div className={cn("p-2 rounded-xl", bg)}>
          <Icon className={cn("w-5 h-5", badgeColor)} />
        </div>
        <div>
          <h4 className="text-[10px] font-black text-white uppercase tracking-[0.2em]">{title}</h4>
          <p className="text-[10px] text-muted font-medium">{items.length} Campanhas Identificadas</p>
        </div>
        <span className={cn("ml-auto text-[11px] font-black px-3 py-1 rounded-full", bg, badgeColor)}>
          {items.length}
        </span>
      </div>

      <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
        {items.length === 0 ? (
          <div className="py-12 text-center flex flex-col items-center gap-3 opacity-30">
            <Minus className="w-6 h-6 text-muted" />
            <p className="text-[10px] text-muted uppercase font-bold tracking-widest">Nada pendente</p>
          </div>
        ) : (
          items.map((c: any) => (
            <div key={c.campaign_id} className="p-3 bg-white/5 rounded-xl border border-white/5 space-y-2 hover:border-white/10 transition-all">
              <div className="flex justify-between items-start gap-4">
                <p className="text-[11px] font-bold text-white leading-tight truncate">{c.campaign_name}</p>
                <div className="flex flex-col items-end shrink-0">
                  <span className="text-[10px] font-bold text-white mono">{formatCurrency(c.cpl)}</span>
                  <span className="text-[9px] text-muted uppercase">CPL</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={cn("w-1.5 h-1.5 rounded-full animate-pulse", badgeColor.replace('text-', 'bg-'))} />
                <p className="text-[10px] text-muted leading-relaxed italic">{c.signalReason}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <Section title="Escalar Operação" items={scale} color="border-success" bg="bg-success/10" badgeColor="text-success" icon={TrendingUp} />
      <Section title="Atenção / Monitorar" items={monitor} color="border-warning" bg="bg-warning/10" badgeColor="text-warning" icon={Zap} />
      <Section title="Otimizar / Cortar" items={optimize} color="border-danger" bg="bg-danger/10" badgeColor="text-danger" icon={TrendingDown} />
    </div>
  );
}

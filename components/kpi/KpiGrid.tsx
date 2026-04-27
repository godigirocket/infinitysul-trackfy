"use client";

import { useAppStore } from "@/store/useAppStore";
import { 
  formatCurrency, 
  formatNumber, 
  formatPercent, 
  extractMetric, 
  calcDiff,
  CONVERSATION_ACTION_TYPES
} from "@/lib/formatters";
import { safeArray } from "@/lib/safeArray";
import { cn } from "@/components/ui/Button";
import { DollarSign, MessageSquare, Eye, MousePointer2 } from "lucide-react";

interface KpiCardProps {
  title: string;
  value: string;
  diff?: number;
  subtitle?: string;
  icon: any;
  color: string;
}

function KpiCard({ title, value, diff, subtitle, icon: Icon, color }: KpiCardProps) {
  const isPositive = diff !== undefined && diff > 0;
  const isNegative = diff !== undefined && diff < 0;

  return (
    <div className="glass p-4 sm:p-6 transition-all hover:translate-y-[-2px] hover:shadow-xl group">
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <span className="text-[9px] sm:text-[11px] font-bold text-muted uppercase tracking-wider">{title}</span>
        <div className={cn("p-1.5 rounded-lg bg-white/5 group-hover:scale-110 transition-transform", color)}>
          <Icon className="w-3.5 h-3.5" />
        </div>
      </div>
      <div className="space-y-1">
        <div className="text-xl sm:text-3xl font-bold mono tracking-tight">{value}</div>
        <div className="flex items-center gap-2 flex-wrap">
          {diff !== undefined && diff !== 0 && (
            <span className={cn(
              "text-[10px] sm:text-xs font-bold",
              isPositive ? "text-success" : isNegative ? "text-danger" : "text-muted"
            )}>
              {formatPercent(diff)}
            </span>
          )}
          {subtitle && <span className="text-[10px] sm:text-[11px] text-muted font-medium">{subtitle}</span>}
        </div>
      </div>
    </div>
  );
}

export function KpiGrid() {
  const { dataA, dataB, isCompare, searchQuery } = useAppStore();

  const filterData = (data: any[]) =>
    safeArray(data).filter(item =>
      !searchQuery ||
      (item.campaign_name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.ad_name || "").toLowerCase().includes(searchQuery.toLowerCase())
    );

  const aggregate = (data: any[]) => {
    let spend = 0, convs = 0, impressions = 0, clicks = 0;
    safeArray(data).forEach(r => {
      spend += parseFloat(r.spend || "0");
      convs += extractMetric(r.actions, CONVERSATION_ACTION_TYPES);
      impressions += parseInt(r.impressions || "0");
      clicks += parseInt(r.clicks || "0");
    });
    const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;
    const cpc = clicks > 0 ? spend / clicks : 0;
    return { spend, convs, impressions, clicks, ctr, cpc };
  };

  const tA = aggregate(filterData(dataA));
  const tB = isCompare ? aggregate(filterData(dataB)) : null;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
      <KpiCard
        title="Investimento"
        value={formatCurrency(tA.spend)}
        diff={tB ? calcDiff(tA.spend, tB.spend) : undefined}
        icon={DollarSign}
        color="text-white"
      />
      <KpiCard
        title="Conversas"
        value={formatNumber(tA.convs)}
        diff={tB ? calcDiff(tA.convs, tB.convs) : undefined}
        subtitle={`Custo: ${formatCurrency(tA.convs > 0 ? tA.spend / tA.convs : 0)}`}
        icon={MessageSquare}
        color="text-warning"
      />
      <KpiCard
        title="Impressões"
        value={formatNumber(tA.impressions)}
        diff={tB ? calcDiff(tA.impressions, tB.impressions) : undefined}
        subtitle={`CTR: ${tA.ctr.toFixed(2)}%`}
        icon={Eye}
        color="text-accent"
      />
      <KpiCard
        title="Cliques"
        value={formatNumber(tA.clicks)}
        diff={tB ? calcDiff(tA.clicks, tB.clicks) : undefined}
        subtitle={`CPC: ${formatCurrency(tA.cpc)}`}
        icon={MousePointer2}
        color="text-success"
      />
    </div>
  );
}

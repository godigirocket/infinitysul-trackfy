"use client";

import { useAppStore } from "@/store/useAppStore";
import { 
  formatCurrency, 
  formatNumber, 
  formatPercent, 
  extractMetric, 
  calcDiff,
  LEAD_ACTION_TYPES,
  CONVERSATION_ACTION_TYPES
} from "@/lib/formatters";
import { cn } from "@/components/ui/Button";
import { DollarSign, Users, MessageSquare, ClipboardCheck } from "lucide-react";

interface KpiCardProps {
  title: string;
  value: string;
  diff?: number;
  subtitle?: string;
  icon: any;
  color: string;
}

function KpiCard({ title, value, diff, subtitle, icon: Icon, color }: KpiCardProps) {
  const isPositive = diff && diff > 0;
  const isNegative = diff && diff < 0;

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

  const filterData = (data: any[]) => {
    return data.filter(item => {
      if (!searchQuery) return true;
      const matchesSearch = (item.campaign_name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
                            (item.ad_name || "").toLowerCase().includes(searchQuery.toLowerCase());
      return matchesSearch;
    });
  };

  const aggregate = (data: any[]) => {
    let totals = { spend: 0, leads: 0, convs: 0, regs: 0 };
    data.forEach(r => {
      totals.spend += parseFloat(r.spend || "0");
      totals.leads += extractMetric(r.actions, LEAD_ACTION_TYPES);
      totals.convs += extractMetric(r.actions, CONVERSATION_ACTION_TYPES);
      totals.regs += extractMetric(r.actions, ['complete_registration']);
    });
    return totals;
  };

  const filteredA = filterData(dataA);
  const filteredB = isCompare ? filterData(dataB) : [];

  const tA = aggregate(filteredA);
  const tB = isCompare ? aggregate(filteredB) : null;

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
        title="Leads Gerados" 
        value={formatNumber(tA.leads)} 
        diff={tB ? calcDiff(tA.leads, tB.leads) : undefined}
        subtitle={`CPL: ${formatCurrency(tA.leads > 0 ? tA.spend / tA.leads : 0)}`}
        icon={Users}
        color="text-accent"
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
        title="Cadastros" 
        value={formatNumber(tA.regs)} 
        diff={tB ? calcDiff(tA.regs, tB.regs) : undefined}
        subtitle={`Custo: ${formatCurrency(tA.regs > 0 ? tA.spend / tA.regs : 0)}`}
        icon={ClipboardCheck}
        color="text-success"
      />
    </div>
  );
}

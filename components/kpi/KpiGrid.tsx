"use client";

import { useAppStore } from "@/store/useAppStore";
import { 
  formatCurrency, 
  formatNumber, 
  formatPercent, 
  extractMetric, 
  calcDiff 
} from "@/lib/formatters";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/components/ui/Button";

interface KpiCardProps {
  title: string;
  value: string;
  diff?: number;
  subtitle?: string;
  icon?: React.ReactNode;
}

function KpiCard({ title, value, diff, subtitle, icon }: KpiCardProps) {
  const isPositive = diff && diff > 0;
  const isNegative = diff && diff < 0;

  return (
    <div className="glass p-6 transition-all hover:translate-y-[-2px] hover:shadow-xl group">
      <div className="flex items-center justify-between mb-4">
        <span className="text-[11px] font-bold text-muted uppercase tracking-wider">{title}</span>
        {icon && <div className="text-muted group-hover:text-accent transition-colors">{icon}</div>}
      </div>
      <div className="space-y-1">
        <div className="text-3xl font-bold mono tracking-tight">{value}</div>
        <div className="flex items-center gap-2">
          {diff !== undefined && (
            <span className={cn(
              "text-xs font-bold",
              isPositive ? "text-success" : isNegative ? "text-danger" : "text-muted"
            )}>
              {formatPercent(diff)}
            </span>
          )}
          {subtitle && <span className="text-[11px] text-muted font-medium">{subtitle}</span>}
        </div>
      </div>
    </div>
  );
}

export function KpiGrid() {
  const { dataA, dataB, isCompare, searchQuery, statusFilter } = useAppStore();

  const filterData = (data: any[]) => {
    return data.filter(item => {
      const matchesSearch = item.campaign_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            item.ad_name?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = statusFilter === "all" || 
                            (statusFilter === "active" && item.campaign_status === "ACTIVE") ||
                            (statusFilter === "paused" && item.campaign_status === "PAUSED");

      return matchesSearch && matchesStatus;
    });
  };

  const aggregate = (data: any[]) => {
    let totals = { spend: 0, leads: 0, convs: 0, regs: 0 };
    data.forEach(r => {
      totals.spend += parseFloat(r.spend || "0");
      totals.leads += extractMetric(r.actions, ['lead']);
      totals.convs += extractMetric(r.actions, ['onsite_conversion.messaging_conversation_started_7d']);
      totals.regs += extractMetric(r.actions, ['complete_registration']);
    });
    return totals;
  };

  const filteredA = filterData(dataA);
  const filteredB = isCompare ? filterData(dataB) : [];

  const tA = aggregate(filteredA);
  const tB = isCompare ? aggregate(filteredB) : null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <KpiCard 
        title="Investimento" 
        value={formatCurrency(tA.spend)} 
        diff={tB ? calcDiff(tA.spend, tB.spend) : undefined}
      />
      <KpiCard 
        title="Leads (Form)" 
        value={formatNumber(tA.leads)} 
        diff={tB ? calcDiff(tA.leads, tB.leads) : undefined}
        subtitle={`CPL: ${formatCurrency(tA.leads > 0 ? tA.spend / tA.leads : 0)}`}
      />
      <KpiCard 
        title="Conversas" 
        value={formatNumber(tA.convs)} 
        diff={tB ? calcDiff(tA.convs, tB.convs) : undefined}
        subtitle={`Custo: ${formatCurrency(tA.convs > 0 ? tA.spend / tA.convs : 0)}`}
      />
      <KpiCard 
        title="Cadastros" 
        value={formatNumber(tA.regs)} 
        diff={tB ? calcDiff(tA.regs, tB.regs) : undefined}
        subtitle={`Custo: ${formatCurrency(tA.regs > 0 ? tA.spend / tA.regs : 0)}`}
      />
    </div>
  );
}

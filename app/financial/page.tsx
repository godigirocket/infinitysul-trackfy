"use client";

import { useFinancialStore } from "@/store/useFinancialStore";
import { useAppStore } from "@/store/useAppStore";
import { safeArray } from "@/lib/safeArray";
import { formatCurrency } from "@/lib/formatters";
import { TrendingUp, TrendingDown, DollarSign, Target, BarChart3, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

function MetricCard({ label, value, sub, color, icon: Icon, trend }: any) {
  return (
    <div className="glass p-5 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold text-muted uppercase tracking-wider">{label}</span>
        <div className={cn("p-1.5 rounded-lg bg-white/5", color)}>
          <Icon className="w-3.5 h-3.5" />
        </div>
      </div>
      <div>
        <span className={cn("text-2xl font-black mono", color)}>{value}</span>
        {sub && <p className="text-[10px] text-muted mt-1">{sub}</p>}
      </div>
      {trend !== undefined && (
        <div className={cn("flex items-center gap-1 text-[10px] font-bold", trend >= 0 ? "text-success" : "text-danger")}>
          {trend >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          {trend >= 0 ? "+" : ""}{trend.toFixed(1)}%
        </div>
      )}
    </div>
  );
}

export default function FinancialPage() {
  const { dataA } = useAppStore();
  const { computeMetrics } = useFinancialStore();

  const adSpend = safeArray(dataA).reduce((s, r) => s + parseFloat(r.spend || "0"), 0);
  const m = computeMetrics(adSpend);

  const metrics = [
    { label: "Faturamento Bruto",   value: formatCurrency(m.grossRevenue),  color: "text-white",   icon: DollarSign,   sub: `${m.totalOrders} pedidos pagos` },
    { label: "Faturamento Líquido", value: formatCurrency(m.netRevenue),    color: "text-success", icon: TrendingUp,   sub: `Após taxas de gateway` },
    { label: "Lucro Líquido",       value: formatCurrency(m.profit),        color: m.profit >= 0 ? "text-success" : "text-danger", icon: Target, sub: `Receita - Ads - Impostos - Despesas` },
    { label: "ROAS",                value: `${m.roas.toFixed(2)}x`,         color: m.roas >= 2 ? "text-success" : m.roas >= 1 ? "text-warning" : "text-danger", icon: BarChart3, sub: `Faturamento / Investimento` },
    { label: "ROI",                 value: `${m.roi.toFixed(1)}%`,          color: m.roi >= 0 ? "text-success" : "text-danger", icon: TrendingUp, sub: `Lucro / Investimento` },
    { label: "Margem",              value: `${m.margin.toFixed(1)}%`,       color: m.margin >= 20 ? "text-success" : "text-warning", icon: Target, sub: `Lucro / Faturamento Bruto` },
    { label: "ARPU",                value: formatCurrency(m.arpu),          color: "text-accent",  icon: DollarSign,   sub: `Ticket médio por pedido` },
    { label: "Investimento Ads",    value: formatCurrency(m.totalAdSpend),  color: "text-white",   icon: BarChart3,    sub: `Meta Ads no período` },
    { label: "Impostos",            value: formatCurrency(m.totalTaxes),    color: "text-warning", icon: AlertTriangle, sub: `Calculado sobre faturamento` },
    { label: "Despesas",            value: formatCurrency(m.totalExpenses), color: "text-warning", icon: AlertTriangle, sub: `Despesas fixas e variáveis` },
    { label: "Taxa de Reembolso",   value: `${m.refundRate.toFixed(1)}%`,   color: m.refundRate > 5 ? "text-danger" : "text-muted", icon: TrendingDown, sub: `Reembolsos / Total de pedidos` },
    { label: "Taxa de Chargeback",  value: `${m.chargebackRate.toFixed(1)}%`, color: m.chargebackRate > 1 ? "text-danger" : "text-muted", icon: AlertTriangle, sub: `Chargebacks / Total de pedidos` },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Motor Financeiro</h1>
        <p className="text-sm text-muted mt-1">ROI, ROAS, Margem e métricas financeiras calculadas em tempo real.</p>
      </div>

      {m.totalOrders === 0 && (
        <div className="glass p-4 border border-warning/20 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-warning flex-shrink-0" />
          <p className="text-sm text-muted">
            Nenhum pedido registrado. Adicione pedidos em <a href="/orders" className="text-accent underline">Pedidos & Vendas</a> ou configure um webhook em <a href="/integrations" className="text-accent underline">Integrações</a>.
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {metrics.map(m => <MetricCard key={m.label} {...m} />)}
      </div>
    </div>
  );
}

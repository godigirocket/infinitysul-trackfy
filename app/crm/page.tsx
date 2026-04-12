"use client";

import { LeadManagement } from "@/components/crm/LeadManagement";
import { useAppStore } from "@/store/useAppStore";
import { formatCurrency, formatPercent, extractMetric, LEAD_ACTION_TYPES } from "@/lib/formatters";
import { safeArray } from "@/lib/safeArray";
import { Users, DollarSign, Target, TrendingUp, Sparkles, AlertCircle } from "lucide-react";
import { useMemo } from "react";

export default function CRMPage() {
  const { crmLeads, dataA } = useAppStore();

  const crmStats = useMemo(() => {
    const totalCrmLeads = safeArray(crmLeads).length;
    const convertedLeads = safeArray(crmLeads).filter(l => l.status === "converted");
    const totalRevenue = convertedLeads.reduce((acc, curr) => acc + (curr.sale_value || 0), 0);
    const conversionRate = totalCrmLeads > 0 ? (convertedLeads.length / totalCrmLeads) * 100 : 0;
    const totalSpend = safeArray(dataA).reduce((acc, r) => acc + parseFloat(r.spend || "0"), 0);
    const metaLeads = safeArray(dataA).reduce((acc, r) => acc + extractMetric(r.actions, LEAD_ACTION_TYPES), 0);
    const realRoas = totalSpend > 0 && totalRevenue > 0 ? totalRevenue / totalSpend : null;
    const hasSalesData = totalRevenue > 0;

    return { totalCrmLeads, totalRevenue, conversionRate, realRoas, totalSpend, metaLeads, hasSalesData };
  }, [crmLeads, dataA]);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-success to-success/40">
            Gestão VIP / CRM
          </h1>
          <p className="text-sm text-muted">Acompanhe as vendas reais vindas dos seus leads do Meta.</p>
        </div>
      </div>

      {/* No Supabase banner */}
      {crmStats.totalCrmLeads === 0 && (
        <div className="glass p-4 border-warning/20 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-bold text-white">Supabase não configurado</p>
            <p className="text-[10px] text-muted mt-0.5">
              Para sincronizar leads automaticamente, configure <code className="text-accent">NEXT_PUBLIC_SUPABASE_URL</code> e <code className="text-accent">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> nas variáveis de ambiente da Vercel.
              Enquanto isso, você pode adicionar leads manualmente abaixo.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-accent/10 text-accent"><Users className="w-5 h-5" /></div>
            <h3 className="text-[10px] font-bold text-muted uppercase tracking-widest">Leads Meta (período)</h3>
          </div>
          <p className="text-2xl font-bold mono text-accent">{crmStats.metaLeads}</p>
          <p className="text-[10px] text-muted mt-1">Extraídos da Meta API</p>
        </div>

        <div className="glass p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-success/10 text-success"><Target className="w-5 h-5" /></div>
            <h3 className="text-[10px] font-bold text-muted uppercase tracking-widest">Taxa de Conversão</h3>
          </div>
          <p className="text-2xl font-bold mono">{crmStats.totalCrmLeads > 0 ? formatPercent(crmStats.conversionRate) : "—"}</p>
          <p className="text-[10px] text-muted mt-1">De Lead para Venda Real</p>
        </div>

        <div className="glass p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-warning/10 text-warning"><TrendingUp className="w-5 h-5" /></div>
            <h3 className="text-[10px] font-bold text-muted uppercase tracking-widest">ROAS Real</h3>
          </div>
          <p className="text-2xl font-bold mono">{crmStats.realRoas !== null ? `${crmStats.realRoas.toFixed(2)}x` : "—"}</p>
          <p className="text-[10px] text-muted mt-1">{crmStats.hasSalesData ? "Baseado no faturamento real" : "Sem vendas registradas"}</p>
        </div>

        <div className="glass p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-white/5 text-muted"><DollarSign className="w-5 h-5" /></div>
            <h3 className="text-[10px] font-bold text-muted uppercase tracking-widest">Faturamento Real</h3>
          </div>
          <p className="text-2xl font-bold mono text-success">{crmStats.hasSalesData ? formatCurrency(crmStats.totalRevenue) : "—"}</p>
          <p className="text-[10px] text-muted mt-1">Vendas convertidas no CRM</p>
        </div>
      </div>

      <LeadManagement />

      {crmStats.hasSalesData && crmStats.realRoas !== null && (
        <div className="flex items-center gap-2 p-4 bg-accent/5 border border-accent/10 rounded-xl">
          <Sparkles className="w-4 h-4 text-accent animate-pulse" />
          <p className="text-xs text-muted leading-relaxed">
            <span className="font-bold text-accent">Insight:</span> ROAS Real de{" "}
            <span className="font-bold">{crmStats.realRoas.toFixed(2)}x</span> — cada R$ 1,00 investido retorna{" "}
            <span className="font-bold">{formatCurrency(crmStats.realRoas)}</span>.
          </p>
        </div>
      )}
    </div>
  );
}

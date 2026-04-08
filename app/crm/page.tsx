"use client";

import { LeadManagement } from "@/components/crm/LeadManagement";
import { useAppStore } from "@/store/useAppStore";
import { formatCurrency, formatPercent } from "@/lib/formatters";
import { Users, DollarSign, Target, TrendingUp, Sparkles } from "lucide-react";
import { useMemo } from "react";

export default function CRMPage() {
  const { crmLeads, dataA } = useAppStore();

  const crmStats = useMemo(() => {
    const totalLeads = crmLeads.length;
    const convertedLeads = crmLeads.filter(l => l.status === 'converted');
    const totalRevenue = convertedLeads.reduce((acc, curr) => acc + (curr.sale_value || 0), 0);
    const conversionRate = totalLeads > 0 ? (convertedLeads.length / totalLeads) * 100 : 0;
    
    // Total spend from Meta (A)
    const totalSpend = dataA.reduce((acc, curr) => acc + parseFloat(curr.spend || "0"), 0);
    const realRoas = totalSpend > 0 ? totalRevenue / totalSpend : 0;

    return {
      totalLeads,
      totalRevenue,
      conversionRate,
      realRoas,
      totalSpend
    };
  }, [crmLeads, dataA]);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-success to-success/40">
            Gestão Real de ROI (CRM Lite)
          </h1>
          <p className="text-sm text-muted">Acompanhe as vendas reais vindas dos seus leads do Meta.</p>
        </div>
        <div className="p-3 bg-success/10 border border-success/20 rounded-xl flex items-center gap-3">
          <DollarSign className="w-5 h-5 text-success" />
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-muted uppercase">Faturamento Real</span>
            <span className="text-lg font-bold mono text-success">{formatCurrency(crmStats.totalRevenue)}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass p-6 group">
          <div className="flex items-center gap-3 mb-4">
             <div className="p-2 rounded-lg bg-accent/10 text-accent"><Users className="w-5 h-5" /></div>
             <h3 className="text-[10px] font-bold text-muted uppercase tracking-widest">Leads Qualificados</h3>
          </div>
          <p className="text-2xl font-bold mono">{crmStats.totalLeads}</p>
          <p className="text-[10px] text-muted mt-1">Sincronizados via Meta API</p>
        </div>

        <div className="glass p-6 group">
          <div className="flex items-center gap-3 mb-4">
             <div className="p-2 rounded-lg bg-success/10 text-success"><Target className="w-5 h-5" /></div>
             <h3 className="text-[10px] font-bold text-muted uppercase tracking-widest">Taxa de Conversão</h3>
          </div>
          <p className="text-2xl font-bold mono">{formatPercent(crmStats.conversionRate)}</p>
          <p className="text-[10px] text-muted mt-1">De Lead para Venda Real</p>
        </div>

        <div className="glass p-6 group">
          <div className="flex items-center gap-3 mb-4">
             <div className="p-2 rounded-lg bg-warning/10 text-warning"><TrendingUp className="w-5 h-5" /></div>
             <h3 className="text-[10px] font-bold text-muted uppercase tracking-widest">ROAS Real (vendas)</h3>
          </div>
          <p className="text-2xl font-bold mono">{crmStats.realRoas.toFixed(2)}x</p>
          <p className="text-[10px] text-muted mt-1">Baseado no faturamento real</p>
        </div>

        <div className="glass p-6 group">
          <div className="flex items-center gap-3 mb-4">
             <div className="p-2 rounded-lg bg-white/5 text-muted"><DollarSign className="w-5 h-5" /></div>
             <h3 className="text-[10px] font-bold text-muted uppercase tracking-widest">Lucro Líquido Est.</h3>
          </div>
          <p className="text-2xl font-bold mono">{formatCurrency(crmStats.totalRevenue - crmStats.totalSpend)}</p>
          <p className="text-[10px] text-muted mt-1">Faturamento - Investimento</p>
        </div>
      </div>

      <LeadManagement />

      <div className="flex items-center gap-2 p-4 bg-accent/5 border border-accent/10 rounded-xl">
        <Sparkles className="w-4 h-4 text-accent animate-pulse" />
        <p className="text-xs text-muted leading-relaxed">
          <span className="font-bold text-accent">Dica de Elite:</span> O seu ROAS Real de <span className="font-bold">{crmStats.realRoas.toFixed(2)}x</span> indica que cada R$ 1,00 investido retorna <span className="font-bold">{formatCurrency(crmStats.realRoas)}</span> no bolso. Use isso para justificar aumentos de verba ao diretor.
        </p>
      </div>
    </div>
  );
}

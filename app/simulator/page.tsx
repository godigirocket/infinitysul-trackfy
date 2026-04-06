"use client";

import { useAppStore } from "@/store/useAppStore";
import { 
  formatCurrency, 
  formatPercent, 
  extractMetric, 
  formatNumber 
} from "@/lib/formatters";
import { Input } from "@/components/ui/Input";
import { useState, useEffect } from "react";
import { 
  TrendingUp, 
  ArrowRight, 
  Target, 
  Coins, 
  BadgePercent,
  CheckCircle2
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/components/ui/Button";

export default function SimulatorPage() {
  const { dataA } = useAppStore();
  
  const [budget, setBudget] = useState(1000);
  const [ticket, setTicket] = useState(297);
  const [conversion, setConversion] = useState(5);

  const [topCpl, setTopCpl] = useState(20);

  useEffect(() => {
    const campaignMap: Record<string, any> = {};
    dataA.forEach((r) => {
      const id = r.campaign_id;
      if (!campaignMap[id]) {
        campaignMap[id] = { id, spend: 0, leads: 0 };
      }
      campaignMap[id].spend += parseFloat(r.spend || "0");
      campaignMap[id].leads += extractMetric(r.actions, ["lead"]);
    });

    const active = Object.values(campaignMap).filter((c: any) => c.leads > 0);
    active.sort((a: any, b: any) => (a.spend / a.leads) - (b.spend / b.leads));
    
    if (active.length > 0) {
      const top3 = active.slice(0, 3);
      const totalS = top3.reduce((acc, c: any) => acc + c.spend, 0);
      const totalL = top3.reduce((acc, c: any) => acc + c.leads, 0);
      setTopCpl(totalS / totalL);
    }
  }, [dataA]);

  const projectedLeads = Math.floor(budget / topCpl);
  const projectedSales = Math.floor(projectedLeads * (conversion / 100));
  const incrementalRevenue = projectedSales * ticket;
  const incrementalRoi = budget > 0 ? ((incrementalRevenue / budget) - 1) * 100 : 0;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Simulador de Escala</h1>
          <p className="text-sm text-muted">Projete o faturamento com base no seu CPL campeão.</p>
        </div>
        <Badge variant="secondary" className="px-3 py-1 gap-2 font-bold mono bg-accent/10 border-accent/20 text-accent">
          <CheckCircle2 className="w-3 h-3" />
          Algoritmo Baseado em Top 3 Campanhas
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="glass p-8 space-y-8 h-fit">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Coins className="w-4 h-4 text-muted" />
              <label className="text-[11px] font-bold text-muted uppercase tracking-wider">Orçamento Adicional (R$)</label>
            </div>
            <Input 
              type="number" 
              value={budget} 
              onChange={(e) => setBudget(parseFloat(e.target.value) || 0)}
              className="text-lg font-bold mono h-12"
            />
          </div>

          <div>
            <div className="flex items-center gap-2 mb-4">
              <Target className="w-4 h-4 text-muted" />
              <label className="text-[11px] font-bold text-muted uppercase tracking-wider">Ticket Médio (R$)</label>
            </div>
            <Input 
              type="number" 
              value={ticket} 
              onChange={(e) => setTicket(parseFloat(e.target.value) || 0)}
              className="text-lg font-bold mono h-12"
            />
          </div>

          <div>
            <div className="flex items-center gap-2 mb-4">
              <BadgePercent className="w-4 h-4 text-muted" />
              <label className="text-[11px] font-bold text-muted uppercase tracking-wider">Taxa de Venda (%)</label>
            </div>
            <Input 
              type="number" 
              value={conversion} 
              onChange={(e) => setConversion(parseFloat(e.target.value) || 0)}
              className="text-lg font-bold mono h-12"
            />
          </div>
        </div>

        <div className="lg:col-span-2 glass p-10 flex flex-col justify-center items-center text-center relative overflow-hidden bg-white/[0.01]">
          {/* Projections */}
          <div className="w-full max-w-2xl space-y-12">
             <div className="flex items-center justify-center gap-6 mb-4">
                <span className="text-xs font-bold text-muted uppercase tracking-widest leading-loose">
                  Baseado no CPL Médio Atual:
                </span>
                <span className="text-xl font-bold mono text-white px-4 py-2 bg-white/5 rounded-xl border border-white/5 shadow-inner">
                  {formatCurrency(topCpl)}
                </span>
             </div>

             <div className="grid grid-cols-2 md:grid-cols-4 gap-12">
                <div className="space-y-2">
                   <div className="text-3xl font-bold mono">+{formatNumber(projectedLeads)}</div>
                   <p className="text-[10px] font-bold text-muted uppercase">Novos Leads</p>
                </div>
                <div className="space-y-2">
                   <div className="text-3xl font-bold mono">+{formatNumber(projectedSales)}</div>
                   <p className="text-[10px] font-bold text-muted uppercase">Vendas/+</p>
                </div>
                <div className="space-y-2">
                   <div className="text-4xl font-bold mono text-success">{formatCurrency(incrementalRevenue)}</div>
                   <p className="text-[10px] font-bold text-muted uppercase">Receita Inc.</p>
                </div>
                <div className="space-y-2">
                   <div className={cn(
                     "text-4xl font-bold mono",
                     incrementalRoi > 0 ? "text-accent" : "text-danger"
                   )}>
                     {incrementalRoi.toFixed(0)}%
                   </div>
                   <p className="text-[10px] font-bold text-muted uppercase">ROI Projeta</p>
                </div>
             </div>

             {/* Incremental Graphic mockup logic */}
             <div className="pt-20">
                <div className="p-8 rounded-2xl bg-gradient-to-br from-accent/10 to-transparent border border-accent/20 shadow-2xl relative">
                   <div className="absolute top-4 right-6">
                      <TrendingUp className="w-8 h-8 text-accent/20" />
                   </div>
                   <p className="text-sm font-bold text-muted mb-4 flex items-center justify-center gap-2">
                     O seu potencial de escala é 
                     <span className="text-success font-black uppercase text-base">Altíssimo</span>
                   </p>
                   <div className="flex items-center justify-center gap-4 text-2xl font-bold tracking-tight">
                     <span className="text-muted">Aumentar verba em</span>
                     <span className="px-4 py-1.5 bg-white text-black rounded-lg shadow-lg">{formatCurrency(budget)}</span>
                     <ArrowRight className="w-5 h-5 text-muted" />
                     <span className="text-success">{formatCurrency(incrementalRevenue)} de Faturamento</span>
                   </div>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}

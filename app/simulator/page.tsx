"use client";

import { useAppStore } from "@/store/useAppStore";
import { useMemo } from "react";
import { formatCurrency, formatNumber, extractMetric } from "@/lib/formatters";
import { 
  DollarSign, TrendingUp, Users, Target, 
  ArrowUpRight, ArrowDownRight, BarChart3, ShieldCheck
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ProductROI {
  product: string;
  spend: number;
  leads: number;
  cpl: number;
  sales: number;
  revenue: number;
  roas: number;
}

export default function ProductROIPage() {
  const { dataA, crmLeads, biData } = useAppStore();

  const products = useMemo((): ProductROI[] => {
    // Aggregate Meta spend by product from campaign names
    const productMap: Record<string, { spend: number; leads: number }> = {};

    const tokens: Record<string, string> = {
      bradesco: "Bradesco", hapvida: "Hapvida", amil: "Amil",
      unimed: "Unimed", sulamerica: "SulAmérica", porto: "Porto Seguro",
      notredame: "NotreDame", prevent: "Prevent Senior",
      sao: "São Cristóvão", golden: "Golden Cross",
    };

    dataA.forEach(row => {
      const name = (row.campaign_name || "").toLowerCase();
      let product = "Outros";
      for (const [key, label] of Object.entries(tokens)) {
        if (name.includes(key)) { product = label; break; }
      }

      if (!productMap[product]) productMap[product] = { spend: 0, leads: 0 };
      productMap[product].spend += parseFloat(row.spend || "0");
      productMap[product].leads += extractMetric(row.actions, [
        "lead", "leadgen.other", "offsite_conversion.fb_pixel_lead", "complete_registration"
      ]);
    });

    // Merge CRM sales data
    const salesMap: Record<string, { sales: number; revenue: number }> = {};
    crmLeads.filter(l => l.status === "converted").forEach((lead: any) => {
      const product = lead.product || "Outros";
      if (!salesMap[product]) salesMap[product] = { sales: 0, revenue: 0 };
      salesMap[product].sales += 1;
      salesMap[product].revenue += lead.sale_value || 0;
    });

    // Merge BI data
    biData.forEach((row: any) => {
      const product = row.product || "Outros";
      if (!salesMap[product]) salesMap[product] = { sales: 0, revenue: 0 };
      salesMap[product].sales += row.sales || 0;
      salesMap[product].revenue += row.revenue || 0;
    });

    // Combine
    const allProducts = new Set([...Object.keys(productMap), ...Object.keys(salesMap)]);
    const results: ProductROI[] = [];

    allProducts.forEach(product => {
      const meta = productMap[product] || { spend: 0, leads: 0 };
      const sales = salesMap[product] || { sales: 0, revenue: 0 };
      results.push({
        product,
        spend: meta.spend,
        leads: meta.leads,
        cpl: meta.leads > 0 ? meta.spend / meta.leads : 0,
        sales: sales.sales,
        revenue: sales.revenue,
        roas: meta.spend > 0 ? sales.revenue / meta.spend : 0,
      });
    });

    return results.sort((a, b) => b.revenue - a.revenue);
  }, [dataA, crmLeads, biData]);

  const totals = useMemo(() => {
    return products.reduce((acc, p) => ({
      spend: acc.spend + p.spend,
      leads: acc.leads + p.leads,
      sales: acc.sales + p.sales,
      revenue: acc.revenue + p.revenue,
    }), { spend: 0, leads: 0, sales: 0, revenue: 0 });
  }, [products]);

  const realROAS = totals.spend > 0 ? totals.revenue / totals.spend : 0;

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-white/40">
            ROI Real por Produto
          </h1>
          <p className="text-xs sm:text-sm text-muted">Meta Ads × Vendas Reais — qual plano dá mais lucro?</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-success/10 border border-success/20 rounded-lg w-fit">
          <ShieldCheck className="w-4 h-4 text-success" />
          <span className="text-[10px] font-bold text-success uppercase tracking-widest">
            {products.length} Produtos • {totals.sales} Vendas
          </span>
        </div>
      </div>

      {/* Top-level KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[
          { label: "Investimento Total", value: formatCurrency(totals.spend), icon: DollarSign, color: "text-white" },
          { label: "Faturamento Real", value: formatCurrency(totals.revenue), icon: TrendingUp, color: "text-success" },
          { label: "Leads Gerados", value: formatNumber(totals.leads), icon: Users, color: "text-accent" },
          { label: "ROAS Real", value: `${realROAS.toFixed(2)}x`, icon: Target, color: realROAS >= 1 ? "text-success" : "text-danger" },
        ].map(kpi => (
          <div key={kpi.label} className="glass p-4 sm:p-5 group hover:scale-[1.02] transition-all">
            <div className="flex items-center gap-2 mb-3">
              <kpi.icon className={cn("w-4 h-4", kpi.color)} />
              <span className="text-[9px] sm:text-[10px] font-bold text-muted uppercase tracking-widest">{kpi.label}</span>
            </div>
            <span className={cn("text-lg sm:text-2xl font-black mono", kpi.color)}>{kpi.value}</span>
          </div>
        ))}
      </div>

      {/* Product breakdown table */}
      <div className="glass overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-white/5">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-accent" />
            <h3 className="text-xs font-bold text-white uppercase tracking-widest">Desempenho por Produto / Operadora</h3>
          </div>
        </div>

        {/* Desktop table */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                {["Produto", "Investimento", "Leads", "CPL", "Vendas", "Faturamento", "ROAS"].map(h => (
                  <th key={h} className="px-4 sm:px-6 py-3 text-[9px] font-bold text-muted uppercase tracking-widest text-left">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {products.map((p, i) => (
                <tr key={p.product} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 sm:px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-2 h-8 rounded-full",
                        p.roas >= 2 ? "bg-success" : p.roas >= 1 ? "bg-warning" : "bg-danger"
                      )} />
                      <span className="text-xs font-bold text-white">{p.product}</span>
                    </div>
                  </td>
                  <td className="px-4 sm:px-6 py-4 text-xs font-bold mono text-white/80">{formatCurrency(p.spend)}</td>
                  <td className="px-4 sm:px-6 py-4 text-xs font-bold mono text-accent">{formatNumber(p.leads)}</td>
                  <td className="px-4 sm:px-6 py-4 text-xs font-bold mono">{formatCurrency(p.cpl)}</td>
                  <td className="px-4 sm:px-6 py-4 text-xs font-bold mono text-white">{p.sales}</td>
                  <td className="px-4 sm:px-6 py-4 text-xs font-bold mono text-success">{formatCurrency(p.revenue)}</td>
                  <td className="px-4 sm:px-6 py-4">
                    <div className={cn(
                      "flex items-center gap-1 text-xs font-bold mono",
                      p.roas >= 2 ? "text-success" : p.roas >= 1 ? "text-warning" : "text-danger"
                    )}>
                      {p.roas >= 1 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                      {p.roas.toFixed(2)}x
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="sm:hidden divide-y divide-white/5">
          {products.map(p => (
            <div key={p.product} className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-white">{p.product}</span>
                <span className={cn(
                  "text-xs font-black mono px-2 py-0.5 rounded",
                  p.roas >= 2 ? "bg-success/20 text-success" : p.roas >= 1 ? "bg-warning/20 text-warning" : "bg-danger/20 text-danger"
                )}>
                  {p.roas.toFixed(2)}x ROAS
                </span>
              </div>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div>
                  <span className="text-[9px] font-bold text-muted uppercase block">Investido</span>
                  <span className="text-xs font-bold mono">{formatCurrency(p.spend)}</span>
                </div>
                <div>
                  <span className="text-[9px] font-bold text-muted uppercase block">Leads</span>
                  <span className="text-xs font-bold mono text-accent">{p.leads}</span>
                </div>
                <div>
                  <span className="text-[9px] font-bold text-muted uppercase block">Vendas</span>
                  <span className="text-xs font-bold mono text-success">{formatCurrency(p.revenue)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {products.length === 0 && (
          <div className="p-12 text-center">
            <BarChart3 className="w-10 h-10 text-muted/20 mx-auto mb-3" />
            <p className="text-xs text-muted font-bold uppercase tracking-widest">Nenhum dado de produto encontrado</p>
            <p className="text-[10px] text-muted mt-1">Sincronize suas campanhas ou importe dados do BI/Supabase.</p>
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import { useMemo } from "react";
import { useAppStore } from "@/store/useAppStore";
import { runIntelligence, buildFilters, calcIntelSummary } from "@/lib/intelligenceEngine";
import { cn } from "@/components/ui/Button";
import { formatCurrency } from "@/lib/formatters";
import { 
  TrendingUp, TrendingDown, Minus, 
  Zap, Target, AlertTriangle, Brain,
  ChevronDown, ChevronUp, ArrowRight
} from "lucide-react";

// ─── Dynamic Filter Bar ────────────────────────────────────────────────────
function IntelFilterBar() {
  const {
    dataA, 
    intelProductFilter, setIntelProductFilter,
    intelCampaignFilter, setIntelCampaignFilter,
    intelSignalFilter, setIntelSignalFilter,
  } = useAppStore();

  const filters = useMemo(() => buildFilters(dataA), [dataA]);

  const selectClass = "bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs font-bold text-white focus:outline-none focus:ring-1 focus:ring-accent cursor-pointer hover:bg-white/10 transition-colors appearance-none pr-8";

  return (
    <div className="flex flex-wrap items-center gap-3 pb-6 mb-6 border-b border-white/5">
      <div className="flex items-center gap-2 text-muted mr-2">
        <Brain className="w-4 h-4 text-accent" />
        <span className="text-[10px] font-bold uppercase tracking-widest">Filtros Automáticos</span>
      </div>

      {/* Product filter — auto-generated from campaign names */}
      <div className="relative">
        <select
          value={intelProductFilter}
          onChange={(e) => setIntelProductFilter(e.target.value)}
          className={selectClass}
        >
          <option value="all">Todos os Produtos</option>
          {filters.products.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
        <ChevronDown className="w-3 h-3 absolute right-2 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
      </div>

      {/* Campaign filter — all campaigns, live */}
      <div className="relative">
        <select
          value={intelCampaignFilter}
          onChange={(e) => setIntelCampaignFilter(e.target.value)}
          className={selectClass}
        >
          <option value="all">Todas as Campanhas</option>
          {filters.campaigns.map((c) => (
            <option key={c} value={c}>{c.length > 40 ? `${c.slice(0, 40)}…` : c}</option>
          ))}
        </select>
        <ChevronDown className="w-3 h-3 absolute right-2 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
      </div>

      {/* Signal filter */}
      <div className="relative">
        <select
          value={intelSignalFilter}
          onChange={(e) => setIntelSignalFilter(e.target.value)}
          className={selectClass}
        >
          <option value="all">Todos os Sinais</option>
          <option value="scale">🟢 Escalar</option>
          <option value="monitor">🟡 Monitorar</option>
          <option value="optimize">🔴 Otimizar</option>
        </select>
        <ChevronDown className="w-3 h-3 absolute right-2 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
      </div>

      {/* Reset */}
      {(intelProductFilter !== 'all' || intelCampaignFilter !== 'all' || intelSignalFilter !== 'all') && (
        <button
          onClick={() => {
            setIntelProductFilter('all');
            setIntelCampaignFilter('all');
            setIntelSignalFilter('all');
          }}
          className="text-[10px] font-bold text-accent hover:text-accent/70 uppercase tracking-widest transition-colors"
        >
          Limpar ×
        </button>
      )}
    </div>
  );
}

// ─── Summary KPI Cards ─────────────────────────────────────────────────────
function SummaryCards({ summary }: { summary: ReturnType<typeof calcIntelSummary> }) {
  const cards = [
    { label: "Investimento Total", value: formatCurrency(summary.totalSpend), icon: "💰", color: "text-white" },
    { label: "Total de Leads", value: summary.totalLeads.toLocaleString("pt-BR"), icon: "👤", color: "text-success" },
    { label: "CPL Médio", value: formatCurrency(summary.avgCpl), icon: "📊", color: "text-accent" },
    { label: "Conversas Iniciadas", value: summary.totalConversations.toLocaleString("pt-BR"), icon: "💬", color: "text-warning" },
    { label: "Para Escalar 🟢", value: summary.scalable.toString(), icon: "🚀", color: "text-success" },
    { label: "Precisam Atenção 🔴", value: summary.needsAttention.toString(), icon: "⚠️", color: "text-danger" },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
      {cards.map((card) => (
        <div key={card.label} className="glass p-5 flex flex-col gap-2 hover:bg-white/[0.04] transition-all group">
          <span className="text-lg">{card.icon}</span>
          <span className={`text-xl font-bold mono ${card.color}`}>{card.value}</span>
          <span className="text-[10px] font-bold text-muted uppercase tracking-wider leading-tight">{card.label}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Optimization Signals ──────────────────────────────────────────────────
function OptimizationPanel({ intel }: { intel: ReturnType<typeof runIntelligence> }) {
  const scale = intel.filter(c => c.signal === 'scale');
  const monitor = intel.filter(c => c.signal === 'monitor');
  const optimize = intel.filter(c => c.signal === 'optimize');

  const Section = ({ title, items, color, bg, icon }: any) => (
    <div className={`glass p-6 border-l-4 ${color}`}>
      <div className={`flex items-center gap-2 mb-4 pb-3 border-b border-white/5`}>
        <span className="text-lg">{icon}</span>
        <span className="text-xs font-bold uppercase tracking-wider text-white">{title}</span>
        <span className={`ml-auto text-xs font-bold px-2 py-0.5 rounded-full ${bg}`}>
          {items.length}
        </span>
      </div>
      <div className="space-y-3 max-h-48 overflow-y-auto">
        {items.length === 0 ? (
          <p className="text-[11px] text-muted italic">Nenhuma campanha neste momento.</p>
        ) : (
          items.map((c: any) => (
            <div key={c.campaign_id} className="space-y-1">
              <p className="text-[11px] font-bold text-white leading-tight truncate">{c.campaign_name}</p>
              <p className="text-[10px] text-muted">{c.signalReason}</p>
              <div className="flex gap-3 text-[10px] font-bold text-muted">
                <span>CPL: {formatCurrency(c.cpl)}</span>
                <span>Leads: {c.leads}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      <Section title="Escalar Agora" items={scale} color="border-success" bg="bg-success/10 text-success" icon="🟢" />
      <Section title="Monitorar" items={monitor} color="border-warning" bg="bg-warning/10 text-warning" icon="🟡" />
      <Section title="Otimizar Urgent" items={optimize} color="border-danger" bg="bg-danger/10 text-danger" icon="🔴" />
    </div>
  );
}

// ─── Funnel Visualization ──────────────────────────────────────────────────
function FunnelViz({ intel }: { intel: ReturnType<typeof runIntelligence> }) {
  const topCampaigns = intel.slice(0, 6);
  const maxImp = Math.max(...topCampaigns.map(c => c.impressions), 1);

  return (
    <div className="glass p-6 mb-8">
      <h3 className="text-xs font-bold text-muted uppercase tracking-widest mb-6 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
        Visualização de Funil por Campanha
      </h3>
      <div className="space-y-6">
        {topCampaigns.map((c) => {
          const impW = (c.impressions / maxImp) * 100;
          const clkW = c.impressions > 0 ? (c.clicks / c.impressions) * impW : 0;
          const ldW = c.impressions > 0 ? (c.leads / c.impressions) * impW : 0;
          const cvW = c.impressions > 0 ? (c.conversations / c.impressions) * impW : 0;

          return (
            <div key={c.campaign_id} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-white truncate max-w-[60%]">{c.campaign_name}</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full 
                  ${c.signal === 'scale' ? 'bg-success/10 text-success' : 
                    c.signal === 'optimize' ? 'bg-danger/10 text-danger' : 
                    'bg-warning/10 text-warning'}`}>
                  {c.signal === 'scale' ? '🟢 Escalar' : c.signal === 'optimize' ? '🔴 Otimizar' : '🟡 Monitor'}
                </span>
              </div>
              <div className="space-y-1.5">
                {[
                  { label: "Impressões", width: impW, value: c.impressions.toLocaleString("pt-BR"), color: "bg-white/20" },
                  { label: "Cliques", width: clkW, value: c.clicks.toLocaleString("pt-BR"), color: "bg-accent/60" },
                  { label: "Leads", width: ldW, value: c.leads, color: "bg-success/70" },
                  { label: "Conversas", width: cvW, value: c.conversations, color: "bg-warning/70" },
                ].map((stage) => (
                  <div key={stage.label} className="flex items-center gap-3">
                    <span className="text-[9px] font-bold text-muted uppercase tracking-wider w-20 shrink-0">{stage.label}</span>
                    <div className="flex-1 h-4 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${stage.color} rounded-full transition-all duration-500`}
                        style={{ width: `${Math.max(stage.width, 0.5)}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-bold text-white mono w-16 text-right">{stage.value}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Campaign Intel Table ──────────────────────────────────────────────────
function CampaignIntelTable({ intel }: { intel: ReturnType<typeof runIntelligence> }) {
  const signalBadge = (signal: string) => {
    if (signal === 'scale') return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-success/10 text-success">🟢 Escalar</span>;
    if (signal === 'optimize') return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-danger/10 text-danger">🔴 Otimizar</span>;
    return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-warning/10 text-warning">🟡 Monitor</span>;
  };

  return (
    <div className="glass p-6 mb-8">
      <h3 className="text-xs font-bold text-muted uppercase tracking-widest mb-6 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
        Análise Profunda de Campanhas
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-white/5">
              {["Campanha", "Produto", "Gasto", "Leads", "CPL", "CPL vs Média", "Conversas", "Freq", "Status"].map((h) => (
                <th key={h} className="text-left py-3 px-2 text-[10px] font-bold text-muted uppercase tracking-wider first:pl-0 last:pr-0">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.03]">
            {intel.map((c) => (
              <tr key={c.campaign_id} className="hover:bg-white/[0.03] transition-colors group">
                <td className="py-3 px-2 pl-0 max-w-[200px]">
                  <p className="font-bold text-white truncate">{c.campaign_name}</p>
                </td>
                <td className="py-3 px-2">
                  <span className="px-2 py-0.5 bg-accent/10 text-accent rounded text-[9px] font-bold">{c.product}</span>
                </td>
                <td className="py-3 px-2 font-bold mono text-white">{formatCurrency(c.spend)}</td>
                <td className="py-3 px-2 font-bold mono text-success">{c.leads}</td>
                <td className="py-3 px-2 font-bold mono">{c.cpl > 0 && c.cpl < 9999 ? formatCurrency(c.cpl) : "—"}</td>
                <td className="py-3 px-2">
                  <span className={`font-bold mono text-[11px] ${
                    c.cplVsAvg < -10 ? "text-success" : c.cplVsAvg > 20 ? "text-danger" : "text-muted"
                  }`}>
                    {c.leads === 0 ? "sem leads" : `${c.cplVsAvg > 0 ? "+" : ""}${c.cplVsAvg.toFixed(0)}%`}
                  </span>
                </td>
                <td className="py-3 px-2 font-bold mono text-warning">{c.conversations}</td>
                <td className="py-3 px-2">
                  <span className={`font-bold mono text-[11px] ${c.frequency > 3.5 ? "text-danger" : "text-muted"}`}>
                    {c.frequency.toFixed(1)}
                  </span>
                </td>
                <td className="py-3 px-2 pr-0">{signalBadge(c.signal)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {intel.length === 0 && (
          <div className="py-16 text-center">
            <Brain className="w-8 h-8 text-muted/20 mx-auto mb-3" />
            <p className="text-sm text-muted">Nenhum dado encontrado para os filtros selecionados.</p>
            <p className="text-xs text-muted/60 mt-1">Sincronize os dados da Meta ou ajuste os filtros.</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Scaling Opportunities ─────────────────────────────────────────────────
function ScalingOpportunities({ intel }: { intel: ReturnType<typeof runIntelligence> }) {
  const opportunities = intel
    .filter(c => c.signal === 'scale')
    .slice(0, 3);

  if (opportunities.length === 0) return null;

  return (
    <div className="glass p-6 mb-8">
      <h3 className="text-xs font-bold text-muted uppercase tracking-widest mb-6 flex items-center gap-2">
        <Zap className="w-4 h-4 text-success" />
        Oportunidades de Escala Identificadas
      </h3>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {opportunities.map((c, i) => (
          <div key={c.campaign_id} className="bg-success/5 border border-success/15 rounded-xl p-4 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <span className="text-xl font-black text-success">#{i + 1}</span>
              <span className="px-2 py-0.5 bg-accent/10 text-accent rounded text-[9px] font-bold">{c.product}</span>
            </div>
            <p className="text-[11px] font-bold text-white leading-tight">{c.campaign_name}</p>
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/5">
              <div>
                <p className="text-[9px] font-bold text-muted uppercase tracking-wider">CPL</p>
                <p className="text-sm font-bold text-success mono">{formatCurrency(c.cpl)}</p>
              </div>
              <div>
                <p className="text-[9px] font-bold text-muted uppercase tracking-wider">Leads</p>
                <p className="text-sm font-bold text-white mono">{c.leads}</p>
              </div>
            </div>
            <p className="text-[10px] text-success/80 italic">{c.signalReason}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Intelligence Page ────────────────────────────────────────────────
export default function IntelligencePage() {
  const {
    dataA,
    intelProductFilter,
    intelCampaignFilter,
    intelSignalFilter,
  } = useAppStore();

  const allIntel = useMemo(() => runIntelligence(dataA), [dataA]);

  const filteredIntel = useMemo(() => {
    return allIntel.filter(c => {
      if (intelProductFilter !== 'all' && c.product !== intelProductFilter) return false;
      if (intelCampaignFilter !== 'all' && c.campaign_name !== intelCampaignFilter) return false;
      if (intelSignalFilter !== 'all' && c.signal !== intelSignalFilter) return false;
      return true;
    });
  }, [allIntel, intelProductFilter, intelCampaignFilter, intelSignalFilter]);

  const summary = useMemo(() => calcIntelSummary(filteredIntel), [filteredIntel]);

  const hasData = dataA.length > 0;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-white/40">
            Central de Inteligência
          </h1>
          <p className="text-sm text-muted mt-1">
            Decisões automáticas baseadas nos seus dados da Meta — sem configuração manual.
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 bg-accent/10 border border-accent/20 rounded-lg">
          <Brain className="w-4 h-4 text-accent" />
          <span className="text-[10px] font-bold text-accent uppercase tracking-wider">
            {allIntel.length} campanhas analisadas
          </span>
        </div>
      </div>

      {!hasData ? (
        <div className="glass p-16 flex flex-col items-center justify-center text-center gap-4">
          <Brain className="w-12 h-12 text-muted/20" />
          <h3 className="text-lg font-bold text-white">Aguardando Dados da Meta</h3>
          <p className="text-sm text-muted max-w-sm">
            Configure seu token e ID de conta em Configurações para a inteligência começar a trabalhar.
          </p>
          <a href="/settings" className="px-4 py-2 bg-accent text-white rounded-lg text-xs font-bold hover:bg-accent/90 transition-colors">
            Ir para Configurações →
          </a>
        </div>
      ) : (
        <>
          <IntelFilterBar />
          <SummaryCards summary={summary} />
          <OptimizationPanel intel={filteredIntel} />
          <ScalingOpportunities intel={filteredIntel} />
          <FunnelViz intel={filteredIntel} />
          <CampaignIntelTable intel={filteredIntel} />
        </>
      )}
    </div>
  );
}

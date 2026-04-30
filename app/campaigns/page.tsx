"use client";

import { useEffect, useState, useMemo } from "react";
import { useAppStore } from "@/store/useAppStore";
import { runRefresh, clearFetchCache } from "@/hooks/useMetaData";
import { updateCampaign, updateAdset, updateAd } from "@/services/metaApi";
import { formatCurrency, formatNumber, extractMetric, CONVERSATION_ACTION_TYPES } from "@/lib/formatters";
import { safeArray } from "@/lib/safeArray";
import { 
  ChevronDown, ChevronRight, Edit2, Save, X, ImageIcon, RefreshCw, 
  Search, Plus, Copy, Trash2, MoreHorizontal, Filter, Calendar, 
  Columns, ArrowDownUp, Settings, Download, FlaskConical, LayoutGrid, Check
} from "lucide-react";
import { cn } from "@/lib/utils";

const OBJECTIVE_LABELS: Record<string, string> = {
  OUTCOME_TRAFFIC: "Tráfego", OUTCOME_ENGAGEMENT: "Engajamento",
  OUTCOME_LEADS: "Leads", OUTCOME_SALES: "Vendas",
  OUTCOME_AWARENESS: "Reconhecimento", OUTCOME_MESSAGING: "Mensagens",
  MESSAGES: "Mensagens", LINK_CLICKS: "Cliques", CONVERSIONS: "Conversões",
};

function budgetDisplay(obj: any): { amount: string, type: string } {
  if (obj.daily_budget) return { amount: `R$ ${(parseInt(obj.daily_budget) / 100).toLocaleString("pt-BR", {minimumFractionDigits: 2})}`, type: "Diário" };
  if (obj.lifetime_budget) return { amount: `R$ ${(parseInt(obj.lifetime_budget) / 100).toLocaleString("pt-BR", {minimumFractionDigits: 2})}`, type: "Total" };
  return { amount: "Usando o orçam...", type: "" };
}

function StatusToggle({ active, onChange, size = "md" }: { active: boolean; onChange: () => void; size?: "sm" | "md" }) {
  const w = size === "sm" ? "w-8 h-4" : "w-10 h-5";
  const dot = size === "sm" ? "w-3 h-3" : "w-4 h-4";
  const translate = size === "sm" ? "translate-x-4" : "translate-x-5";
  return (
    <button onClick={e => { e.stopPropagation(); onChange(); }}
      className={cn("relative inline-flex items-center rounded-full transition-colors duration-200 focus:outline-none flex-shrink-0", w,
        active ? "bg-[#1877f2]" : "bg-[var(--surface-3)]")}
      title={active ? "Pausar" : "Ativar"}>
      <span className={cn("inline-block rounded-full bg-white shadow transition-transform duration-200", dot,
        active ? translate : "translate-x-0.5")} />
    </button>
  );
}

function StatusDot({ status }: { status: string }) {
  const color = status === "ACTIVE" ? "#22c55e" : status === "PAUSED" ? "#94a3b8" : "#ef4444";
  const label = status === "ACTIVE" ? "Ativo" : status === "PAUSED" ? "Pausado" : status;
  return (
    <div className="flex items-center gap-1.5">
      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: color }} />
      <span className="text-[13px]" style={{ color: "var(--text)" }}>{label}</span>
    </div>
  );
}

function Th({ children, right, width }: { children: React.ReactNode; right?: boolean; width?: string }) {
  return (
    <th className={cn("px-3 py-2 text-[12px] font-medium whitespace-nowrap select-none border-b border-r last:border-r-0 relative group",
      right ? "text-right" : "text-left")}
      style={{ color: "var(--text)", borderColor: "var(--border)", background: "var(--surface)", width }}>
      <div className={cn("flex items-center gap-1.5", right ? "justify-end" : "justify-start")}>
        {children}
        <div className="flex flex-col opacity-30 group-hover:opacity-100 cursor-pointer">
          <ArrowDownUp className="w-3 h-3" />
        </div>
      </div>
      {/* Drag handle mockup */}
      <div className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-[#1877f2] opacity-0 hover:opacity-100 transition-opacity" />
    </th>
  );
}

export default function CampaignsPage() {
  const { token, accountId, hierarchy, dataA, dataAds, creativesHD, isLoading, apiError } = useAppStore();
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editBudget, setEditBudget] = useState("");
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [activeTab, setActiveTab] = useState<"campaigns" | "adsets" | "ads">("campaigns");

  useEffect(() => { if (token && accountId) runRefresh(); }, [token, accountId]);

  const campaignMetrics = useMemo(() => {
    const map: Record<string, { spend: number; impressions: number; clicks: number; convs: number; reach: number }> = {};
    safeArray(dataA).forEach(r => {
      if (!map[r.campaign_id]) map[r.campaign_id] = { spend: 0, impressions: 0, clicks: 0, convs: 0, reach: 0 };
      map[r.campaign_id].spend += parseFloat(r.spend || "0");
      map[r.campaign_id].impressions += parseInt(r.impressions || "0");
      map[r.campaign_id].clicks += parseInt(r.clicks || "0");
      map[r.campaign_id].reach += parseInt((r as any).reach || "0");
      map[r.campaign_id].convs += extractMetric(r.actions, CONVERSATION_ACTION_TYPES);
    });
    return map;
  }, [dataA]);

  const adMetrics = useMemo(() => {
    const map: Record<string, { spend: number; convs: number }> = {};
    safeArray(dataAds).forEach(r => {
      const id = r.ad_id || "";
      if (!map[id]) map[id] = { spend: 0, convs: 0 };
      map[id].spend += parseFloat(r.spend || "0");
      map[id].convs += extractMetric(r.actions, CONVERSATION_ACTION_TYPES);
    });
    return map;
  }, [dataAds]);

  const toggle = (id: string) => setExpanded(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleSelect = (id: string) => setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const getAdsets = (cid: string) => safeArray(hierarchy?.adsets).filter((a: any) => a.campaign_id === cid);
  const getAds = (aid: string) => safeArray(hierarchy?.ads).filter((a: any) => a.adset_id === aid);

  const handleToggleStatus = async (type: "campaign" | "adset" | "ad", id: string, cur: string) => {
    const ns = cur === "ACTIVE" ? "PAUSED" : "ACTIVE";
    try {
      if (type === "campaign") await updateCampaign(id, token, { status: ns as any });
      if (type === "adset") await updateAdset(id, token, { status: ns as any });
      if (type === "ad") await updateAd(id, token, { status: ns as any });
      clearFetchCache(); runRefresh();
    } catch (e) { console.error(e); }
  };

  const startEdit = (obj: any) => {
    setEditingId(obj.id); setEditName(obj.name);
    const b = obj.daily_budget || obj.lifetime_budget;
    setEditBudget(b ? (parseInt(b) / 100).toFixed(2) : "");
  };

  const saveEdit = async (id: string) => {
    setSaving(true);
    const u: any = { name: editName };
    if (editBudget && !isNaN(Number(editBudget))) u.daily_budget = Math.round(Number(editBudget) * 100);
    await updateCampaign(id, token, u);
    setEditingId(null); setSaving(false); clearFetchCache(); runRefresh();
  };

  if (!token || !accountId) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] flex-col gap-4">
        <p className="text-sm font-semibold" style={{ color: "var(--text-2)" }}>Token não configurado</p>
        <a href="/settings" className="px-4 py-2 bg-[#1877f2] text-white rounded-lg text-sm font-semibold hover:bg-[#166fe5] transition-colors">
          Ir para Configurações →
        </a>
      </div>
    );
  }

  const allCampaigns = safeArray(hierarchy?.campaigns)
    .sort((a, b) => (campaignMetrics[b.id]?.spend || 0) - (campaignMetrics[a.id]?.spend || 0));

  const campaigns = allCampaigns.filter(c => {
    if (statusFilter !== "ALL" && c.effective_status !== statusFilter) return false;
    if (search && !c.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const allSelected = campaigns.length > 0 && campaigns.every(c => selected.has(c.id));
  const someSelected = selected.size > 0;

  const totals = campaigns.reduce((acc, c) => {
    const m = campaignMetrics[c.id] || {};
    acc.spend += m.spend || 0;
    acc.impressions += m.impressions || 0;
    acc.clicks += m.clicks || 0;
    acc.convs += m.convs || 0;
    acc.reach += m.reach || 0;
    return acc;
  }, { spend: 0, impressions: 0, clicks: 0, convs: 0, reach: 0 });

  const btnBase = "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[13px] font-medium border transition-all hover:bg-black/5 dark:hover:bg-white/5";
  const btnStyle = { borderColor: "var(--border-2)", color: "var(--text)", background: "var(--surface)" };

  const activeTabStyle = "bg-[#e2e8f0] dark:bg-[var(--surface-3)]";
  const inactiveTabStyle = "bg-transparent hover:bg-black/5 dark:hover:bg-white/5";

  return (
    <div className="-mx-6 lg:-mx-8">
      {/* ── Top Tabs (FB-style) ── */}
      <div className="sticky top-14 z-30 flex items-center justify-between px-4 lg:px-6 py-2 border-b"
        style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
        
        <div className="flex flex-wrap items-center gap-1">
          {/* Campanhas Tab */}
          <button 
            onClick={() => setActiveTab("campaigns")}
            className={cn("flex items-center gap-2 px-3 py-1.5 rounded-md text-[14px] font-medium transition-colors border",
              activeTab === "campaigns" ? activeTabStyle + " border-[var(--border-2)]" : inactiveTabStyle + " border-transparent",
              someSelected && activeTab === "campaigns" ? "bg-[#e8f4ff] dark:bg-[rgba(24,119,242,0.15)] text-[#1877f2]" : "text-[var(--text)]")}
          >
            <div className={cn("flex items-center justify-center w-5 h-5 rounded-[4px]", 
              someSelected && activeTab === "campaigns" ? "bg-[#1877f2] text-white" : "bg-[var(--surface-3)] text-[var(--text-3)]")}>
              <LayoutGrid className="w-3.5 h-3.5" />
            </div>
            Campanhas
            {someSelected && activeTab === "campaigns" && (
              <span className="flex items-center gap-1 bg-[#1877f2] text-white px-2 py-0.5 rounded-full text-[11px] font-semibold ml-1">
                {selected.size} selecionado
                <X className="w-3 h-3 cursor-pointer hover:opacity-80" onClick={(e) => { e.stopPropagation(); setSelected(new Set()); }} />
              </span>
            )}
          </button>

          {/* Conjuntos Tab */}
          <button 
            onClick={() => setActiveTab("adsets")}
            className={cn("flex items-center gap-2 px-3 py-1.5 rounded-md text-[14px] font-medium transition-colors border border-transparent",
              activeTab === "adsets" ? activeTabStyle + " border-[var(--border-2)]" : inactiveTabStyle,
              "text-[var(--text-2)] hover:text-[var(--text)]")}
          >
            <div className="flex flex-wrap gap-[1px] w-5 h-5 p-[2px] rounded-[4px] border border-[var(--text-3)] opacity-70">
              <div className="bg-[var(--text-3)] w-[6px] h-[6px] rounded-[1px]" />
              <div className="bg-[var(--text-3)] w-[6px] h-[6px] rounded-[1px]" />
              <div className="bg-[var(--text-3)] w-[6px] h-[6px] rounded-[1px]" />
              <div className="bg-[var(--text-3)] w-[6px] h-[6px] rounded-[1px]" />
            </div>
            Conjuntos de anúncios {someSelected ? `para ${selected.size} campanha${selected.size > 1 ? 's' : ''}` : ''}
          </button>

          {/* Anúncios Tab */}
          <button 
            onClick={() => setActiveTab("ads")}
            className={cn("flex items-center gap-2 px-3 py-1.5 rounded-md text-[14px] font-medium transition-colors border border-transparent",
              activeTab === "ads" ? activeTabStyle + " border-[var(--border-2)]" : inactiveTabStyle,
              "text-[var(--text-2)] hover:text-[var(--text)]")}
          >
            <div className="w-5 h-5 rounded-[4px] border border-[var(--text-3)] flex items-center justify-center opacity-70">
              <div className="w-3 h-3 border border-[var(--text-3)] rounded-[1px]" />
            </div>
            Anúncios {someSelected ? `para ${selected.size} campanha${selected.size > 1 ? 's' : ''}` : ''}
          </button>
        </div>

        {/* Date Picker Mock */}
        <button className="flex items-center gap-2 px-3 py-1.5 rounded-md text-[13px] border hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
          style={{ borderColor: "var(--border-2)", color: "var(--text)", background: "var(--surface)" }}>
          <Calendar className="w-3.5 h-3.5" />
          <span>Hoje: {new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }).replace(' de ', ' ')}</span>
          <ChevronDown className="w-3.5 h-3.5 opacity-50" />
        </button>
      </div>

      {/* ── Action toolbar (FB-style) ── */}
      <div className="sticky top-[105px] z-20 flex flex-wrap items-center justify-between gap-2 px-4 lg:px-6 py-2 border-b"
        style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
        <div className="flex items-center gap-2 flex-wrap">
          <button className="flex items-center gap-1.5 px-4 py-1.5 rounded-md text-[13px] font-semibold bg-[#0064e0] text-white hover:bg-[#0054bd] transition-colors">
            <Plus className="w-4 h-4" /> Criar
          </button>
          
          <div className="flex items-center bg-[var(--surface-2)] rounded-md border" style={{ borderColor: "var(--border-2)" }}>
            <button className="flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-medium hover:bg-black/5 dark:hover:bg-white/5 transition-colors border-r" style={{ borderColor: "var(--border-2)", color: "var(--text)" }}>
              <Copy className="w-3.5 h-3.5" /> Duplicar
            </button>
            <button className="px-2 py-1.5 hover:bg-black/5 dark:hover:bg-white/5 transition-colors" style={{ color: "var(--text)" }}>
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex items-center bg-[var(--surface-2)] rounded-md border" style={{ borderColor: "var(--border-2)" }}>
            <button className="flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-medium hover:bg-black/5 dark:hover:bg-white/5 transition-colors border-r" style={{ borderColor: "var(--border-2)", color: "var(--text)" }}
              onClick={() => { const c = campaigns.find(x => selected.has(x.id)); if (c) startEdit(c); }}>
              <Edit2 className="w-3.5 h-3.5" /> Editar
            </button>
            <button className="px-2 py-1.5 hover:bg-black/5 dark:hover:bg-white/5 transition-colors" style={{ color: "var(--text)" }}>
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
          </div>

          <button className={btnBase} style={btnStyle} disabled={!someSelected}>
            <Trash2 className="w-3.5 h-3.5 opacity-70" />
          </button>

          <button className={btnBase} style={btnStyle}>
            <FlaskConical className="w-3.5 h-3.5" /> Teste A/B
          </button>

          <button className={btnBase} style={btnStyle}>
            Mais <ChevronDown className="w-3.5 h-3.5 opacity-50" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button className={btnBase} style={btnStyle}>
            <Columns className="w-3.5 h-3.5" /> Colunas: Desempenho <ChevronDown className="w-3.5 h-3.5 opacity-50" />
          </button>
          <button className={btnBase} style={btnStyle}>
            <Settings className="w-3.5 h-3.5" /> Detalhamento <ChevronDown className="w-3.5 h-3.5 opacity-50" />
          </button>
          <button className={btnBase} style={btnStyle}>
            <Download className="w-3.5 h-3.5" />
          </button>
          <button className={btnBase} style={btnStyle}>
            <Calendar className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="px-4 lg:px-6 py-2 border-b flex items-center gap-3" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
        <button className="flex items-center gap-1.5 text-[13px] font-medium" style={{ color: "var(--text)" }}>
          <Filter className="w-3.5 h-3.5" /> Filtros:
        </button>
        
        <div className="flex items-center gap-2">
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="text-[13px] rounded-full px-3 py-1 border hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer appearance-none"
            style={{ background: "var(--surface-2)", borderColor: "var(--border-2)", color: "var(--text)" }}>
            <option value="ALL">Todos os anúncios</option>
            <option value="ACTIVE">Anúncios ativos</option>
            <option value="PAUSED">Pausados</option>
            <option value="ARCHIVED">Arquivados</option>
          </select>
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: "var(--text-3)" }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Pesquisar e filtrar"
              className="pl-8 pr-3 py-1 text-[13px] rounded-full border focus:outline-none focus:border-[#1877f2] w-64 transition-all"
              style={{ background: "var(--surface-2)", borderColor: "var(--border-2)", color: "var(--text)" }} />
          </div>
        </div>
      </div>

      {/* Error */}
      {apiError && (
        <div className="mx-6 lg:mx-8 mt-3 p-3 rounded-lg text-[13px] border flex items-center gap-2"
          style={{ background: "rgba(239,68,68,0.08)", borderColor: "rgba(239,68,68,0.2)", color: "#ef4444" }}>
          <span className="font-semibold">Erro:</span> {apiError}
        </div>
      )}

      {/* Loading */}
      {isLoading && campaigns.length === 0 && (
        <div className="flex items-center justify-center py-20">
          <RefreshCw className="w-8 h-8 text-[#1877f2] animate-spin" />
        </div>
      )}

      {/* Empty */}
      {!isLoading && campaigns.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <p className="text-[15px] font-medium" style={{ color: "var(--text-2)" }}>Nenhuma campanha encontrada</p>
        </div>
      )}

      {/* ── Table ── */}
      {campaigns.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[13px]" style={{ minWidth: 1200 }}>
            <thead>
              <tr>
                <th className="w-10 px-3 py-2 border-b border-r" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
                  <div className="flex items-center justify-center w-full h-full">
                    <input type="checkbox" checked={allSelected}
                      onChange={() => setSelected(allSelected ? new Set() : new Set(campaigns.map(c => c.id)))}
                      className="w-4 h-4 rounded-[3px] border-[var(--border-2)] cursor-pointer accent-[#1877f2]" />
                  </div>
                </th>
                <Th width="280px">campanha</Th>
                <Th>Veiculação</Th>
                <Th>Ações</Th>
                <Th right>Resultados</Th>
                <Th right>Custo por resultado</Th>
                <Th right>Orçamento</Th>
                <Th right>Valor usado</Th>
                <Th right>Impressões</Th>
                <Th right>Alcance</Th>
                <th className="w-12 px-3 py-2 border-b" style={{ borderColor: "var(--border)", background: "var(--surface)" }} />
              </tr>
            </thead>
            <tbody>
              {campaigns.map((campaign: any) => {
                const isExpanded = expanded.has(campaign.id);
                const isSelected = selected.has(campaign.id);
                const adsets = getAdsets(campaign.id);
                const m = campaignMetrics[campaign.id] || { spend: 0, impressions: 0, clicks: 0, convs: 0, reach: 0 };
                const cpl = m.convs > 0 ? m.spend / m.convs : 0;
                const isActive = campaign.effective_status === "ACTIVE";
                const rowBg = isSelected ? "rgba(24,119,242,0.08)" : "var(--surface)";
                const hoverBg = isSelected ? "rgba(24,119,242,0.12)" : "var(--surface-2)";
                const bDisplay = budgetDisplay(campaign);

                return [
                  <tr key={campaign.id} className="group border-b transition-colors"
                    style={{ borderColor: "var(--border)", background: rowBg }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = hoverBg; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = rowBg; }}>

                    {/* Checkbox */}
                    <td className="px-3 py-3 w-10 border-r" style={{ borderColor: "var(--border)" }}>
                      <div className="flex items-center justify-center w-full h-full">
                        <input type="checkbox" checked={isSelected} onChange={() => toggleSelect(campaign.id)}
                          className="w-4 h-4 rounded-[3px] border-[var(--border-2)] cursor-pointer accent-[#1877f2]" />
                      </div>
                    </td>

                    {/* Name + expand */}
                    <td className="px-3 py-3 border-r" style={{ borderColor: "var(--border)" }}>
                      <div className="flex items-start gap-2">
                        <StatusToggle active={isActive}
                          onChange={() => handleToggleStatus("campaign", campaign.id, campaign.effective_status)} />
                        
                        <div className="min-w-0 flex-1">
                          {editingId === campaign.id ? (
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <input value={editName} onChange={e => setEditName(e.target.value)}
                                className="border rounded px-2 py-0.5 text-[13px] focus:outline-none focus:border-[#1877f2] w-40"
                                style={{ background: "var(--surface-2)", borderColor: "var(--border-2)", color: "var(--text)" }}
                                onClick={e => e.stopPropagation()} />
                              <button onClick={e => { e.stopPropagation(); saveEdit(campaign.id); }} disabled={saving}
                                className="text-[#22c55e] hover:bg-[#22c55e]/10 p-1 rounded transition-colors"><Save className="w-4 h-4" /></button>
                              <button onClick={e => { e.stopPropagation(); setEditingId(null); }}
                                className="text-[#ef4444] hover:bg-[#ef4444]/10 p-1 rounded transition-colors"><X className="w-4 h-4" /></button>
                            </div>
                          ) : (
                            <div className="group/name flex items-center gap-2">
                              <div className="font-medium text-[13px] text-[#1877f2] hover:underline cursor-pointer leading-tight truncate max-w-[220px]">
                                {campaign.name}
                              </div>
                              <button onClick={e => { e.stopPropagation(); startEdit(campaign); }}
                                className="opacity-0 group-hover/name:opacity-100 transition-opacity p-1 rounded hover:bg-black/5 dark:hover:bg-white/5"
                                style={{ color: "var(--text-3)" }}>
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Veiculação */}
                    <td className="px-3 py-3 border-r" style={{ borderColor: "var(--border)" }}>
                      <StatusDot status={campaign.effective_status} />
                    </td>

                    {/* Ações (Mock) */}
                    <td className="px-3 py-3 border-r" style={{ borderColor: "var(--border)" }}>
                      <div className="flex items-center gap-1.5 text-[12px] text-[#1877f2] cursor-pointer hover:underline font-medium">
                        <Check className="w-3.5 h-3.5 p-[1px] bg-[#1877f2]/10 rounded-full" />
                        2 recomendações
                      </div>
                    </td>

                    {/* Resultados */}
                    <td className="px-3 py-3 text-right border-r" style={{ borderColor: "var(--border)" }}>
                      <div className="font-semibold text-[14px]" style={{ color: "var(--text)" }}>{m.convs > 0 ? m.convs.toLocaleString("pt-BR") : "—"}</div>
                      {m.convs > 0 && <div className="text-[11px] mt-0.5" style={{ color: "var(--text-3)" }}>Conversas por mensa...</div>}
                    </td>

                    {/* Custo por resultado */}
                    <td className="px-3 py-3 text-right border-r" style={{ borderColor: "var(--border)" }}>
                      <div className="font-semibold text-[14px]" style={{ color: "var(--text)" }}>{cpl > 0 ? `R$ ${cpl.toLocaleString("pt-BR", {minimumFractionDigits: 2})}` : "—"}</div>
                      {cpl > 0 && <div className="text-[11px] mt-0.5" style={{ color: "var(--text-3)" }}>Por conversa por me...</div>}
                    </td>

                    {/* Orçamento */}
                    <td className="px-3 py-3 text-right border-r" style={{ borderColor: "var(--border)" }}>
                      {editingId === campaign.id ? (
                        <input value={editBudget} onChange={e => setEditBudget(e.target.value)}
                          placeholder="R$/dia"
                          className="border rounded px-2 py-0.5 text-[13px] text-right focus:outline-none focus:border-[#1877f2] w-24"
                          style={{ background: "var(--surface-2)", borderColor: "var(--border-2)", color: "var(--text)" }}
                          onClick={e => e.stopPropagation()} />
                      ) : (
                        <>
                          <div className={cn("text-[13px]", !bDisplay.type && "text-[var(--text-2)]")} style={{ color: bDisplay.type ? "var(--text)" : undefined }}>
                            {bDisplay.type ? <><Edit2 className="w-3 h-3 inline mr-1 opacity-0 group-hover:opacity-50 text-[var(--text-3)] cursor-pointer" />{bDisplay.amount}</> : bDisplay.amount}
                          </div>
                          {bDisplay.type && <div className="text-[11px] mt-0.5" style={{ color: "var(--text-3)" }}>{bDisplay.type}</div>}
                        </>
                      )}
                    </td>

                    {/* Valor usado */}
                    <td className="px-3 py-3 text-right border-r" style={{ borderColor: "var(--border)" }}>
                      <div className="text-[13px]" style={{ color: "var(--text)" }}>
                        {m.spend > 0 ? `R$ ${m.spend.toLocaleString("pt-BR", {minimumFractionDigits: 2})}` : "—"}
                      </div>
                    </td>

                    {/* Impressões */}
                    <td className="px-3 py-3 text-right border-r" style={{ borderColor: "var(--border)" }}>
                      <div className="text-[13px]" style={{ color: "var(--text)" }}>
                        {m.impressions > 0 ? m.impressions.toLocaleString("pt-BR") : "—"}
                      </div>
                    </td>

                    {/* Alcance */}
                    <td className="px-3 py-3 text-right border-r" style={{ borderColor: "var(--border)" }}>
                      <div className="text-[13px]" style={{ color: "var(--text)" }}>
                        {m.reach > 0 ? m.reach.toLocaleString("pt-BR") : "—"}
                      </div>
                    </td>

                    {/* Empty Space */}
                    <td className="px-3 py-3 w-12" />
                  </tr>,

                  // ── Adsets (expanded) ──
                  ...(isExpanded ? adsets.map((adset: any) => {
                    const ads = getAds(adset.id);
                    const isAdsetExpanded = expanded.has(`adset_${adset.id}`);
                    const isAdsetActive = adset.effective_status === "ACTIVE";
                    const bDisplayAdset = budgetDisplay(adset);
                    return [
                      <tr key={`adset_${adset.id}`} className="group border-b transition-colors"
                        style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}
                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "var(--surface-3)"}
                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "var(--surface-2)"}>
                        <td className="px-3 py-2 w-10 border-r" style={{ borderColor: "var(--border)" }} />
                        <td className="px-3 py-2 border-r" style={{ borderColor: "var(--border)" }}>
                          <div className="flex items-center gap-2 pl-8">
                            <StatusToggle size="sm" active={isAdsetActive}
                              onChange={() => handleToggleStatus("adset", adset.id, adset.effective_status)} />
                            <div>
                              <div className="text-[13px] text-[#1877f2] hover:underline cursor-pointer truncate max-w-[200px]">
                                {adset.name}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-2 border-r" style={{ borderColor: "var(--border)" }}><StatusDot status={adset.effective_status} /></td>
                        <td className="px-3 py-2 border-r" style={{ borderColor: "var(--border)" }} />
                        <td className="px-3 py-2 text-right text-[13px] border-r" style={{ color: "var(--text-2)", borderColor: "var(--border)" }}>—</td>
                        <td className="px-3 py-2 text-right text-[13px] border-r" style={{ color: "var(--text-2)", borderColor: "var(--border)" }}>—</td>
                        <td className="px-3 py-2 text-right border-r" style={{ borderColor: "var(--border)" }}>
                          <div className="text-[13px]" style={{ color: "var(--text)" }}>{bDisplayAdset.amount}</div>
                          {bDisplayAdset.type && <div className="text-[11px] mt-0.5" style={{ color: "var(--text-3)" }}>{bDisplayAdset.type}</div>}
                        </td>
                        <td className="px-3 py-2 text-right text-[13px] border-r" style={{ color: "var(--text-2)", borderColor: "var(--border)" }}>—</td>
                        <td className="px-3 py-2 text-right text-[13px] border-r" style={{ color: "var(--text-2)", borderColor: "var(--border)" }}>—</td>
                        <td className="px-3 py-2 text-right text-[13px] border-r" style={{ color: "var(--text-2)", borderColor: "var(--border)" }}>—</td>
                        <td className="px-3 py-2 w-12" />
                      </tr>,

                      // ── Ads (expanded adset) ──
                      ...(isAdsetExpanded ? ads.map((ad: any) => {
                        const thumb = creativesHD?.[ad.id] || (ad as any).creative?.thumbnail_url;
                        const am = adMetrics[ad.id] || { spend: 0, convs: 0 };
                        const isAdActive = ad.effective_status === "ACTIVE";
                        return (
                          <tr key={`ad_${ad.id}`} className="border-b transition-colors"
                            style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}
                            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "var(--surface-3)"}
                            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "var(--surface-2)"}>
                            <td className="px-3 py-2 w-10 border-r" style={{ borderColor: "var(--border)" }} />
                            <td className="px-3 py-2 border-r" style={{ borderColor: "var(--border)" }}>
                              <div className="flex items-center gap-2 pl-16">
                                <StatusToggle size="sm" active={isAdActive}
                                  onChange={() => handleToggleStatus("ad", ad.id, ad.effective_status)} />
                                <div className="w-8 h-8 rounded overflow-hidden flex-shrink-0 flex items-center justify-center border"
                                  style={{ background: "var(--surface-3)", borderColor: "var(--border)" }}>
                                  {thumb
                                    ? <img src={thumb} alt="" className="w-full h-full object-cover" />
                                    : <ImageIcon className="w-3.5 h-3.5" style={{ color: "var(--text-3)" }} />}
                                </div>
                                <span className="text-[13px] text-[#1877f2] hover:underline cursor-pointer truncate max-w-[160px]">
                                  {ad.name}
                                </span>
                              </div>
                            </td>
                            <td className="px-3 py-2 border-r" style={{ borderColor: "var(--border)" }}><StatusDot status={ad.effective_status} /></td>
                            <td className="px-3 py-2 border-r" style={{ borderColor: "var(--border)" }} />
                            <td className="px-3 py-2 text-right text-[13px] font-semibold border-r" style={{ color: "var(--text)", borderColor: "var(--border)" }}>
                              {am.convs > 0 ? am.convs.toLocaleString("pt-BR") : "—"}
                            </td>
                            <td className="px-3 py-2 text-right text-[13px] border-r" style={{ color: "var(--text)", borderColor: "var(--border)" }}>
                              {am.convs > 0 ? `R$ ${(am.spend / am.convs).toLocaleString("pt-BR", {minimumFractionDigits: 2})}` : "—"}
                            </td>
                            <td className="px-3 py-2 text-right text-[13px] border-r" style={{ color: "var(--text-2)", borderColor: "var(--border)" }}>—</td>
                            <td className="px-3 py-2 text-right text-[13px] border-r" style={{ color: "var(--text)", borderColor: "var(--border)" }}>
                              {am.spend > 0 ? `R$ ${am.spend.toLocaleString("pt-BR", {minimumFractionDigits: 2})}` : "—"}
                            </td>
                            <td className="px-3 py-2 text-right text-[13px] border-r" style={{ color: "var(--text-2)", borderColor: "var(--border)" }}>—</td>
                            <td className="px-3 py-2 text-right text-[13px] border-r" style={{ color: "var(--text-2)", borderColor: "var(--border)" }}>—</td>
                            <td className="px-3 py-2 w-12" />
                          </tr>
                        );
                      }) : [])
                    ];
                  }).flat() : [])
                ];
              }).flat()}
            </tbody>

            {/* ── Totals footer ── */}
            <tfoot>
              <tr style={{ background: "var(--surface)", borderTop: `1px solid var(--border)` }}>
                <td className="px-3 py-3 border-r" style={{ borderColor: "var(--border)" }} />
                <td colSpan={3} className="px-3 py-3 border-r" style={{ borderColor: "var(--border)" }}>
                  <div className="flex items-center gap-1.5 font-semibold text-[13px]" style={{ color: "var(--text)" }}>
                    Resultados de {campaigns.length} campanhas <Settings className="w-3.5 h-3.5 opacity-50 cursor-pointer" />
                  </div>
                </td>
                <td className="px-3 py-3 text-right border-r" style={{ borderColor: "var(--border)" }}>
                  <div className="text-[14px] font-semibold" style={{ color: "var(--text)" }}>{totals.convs > 0 ? totals.convs.toLocaleString("pt-BR") : "—"}</div>
                  {totals.convs > 0 && <div className="text-[11px] mt-0.5" style={{ color: "var(--text-3)" }}>Múltiplas conversões</div>}
                </td>
                <td className="px-3 py-3 text-right border-r" style={{ borderColor: "var(--border)" }}>
                  <div className="text-[14px] font-semibold" style={{ color: "var(--text)" }}>
                    {totals.convs > 0 ? `R$ ${(totals.spend / totals.convs).toLocaleString("pt-BR", {minimumFractionDigits: 2})}` : "—"}
                  </div>
                  {totals.convs > 0 && <div className="text-[11px] mt-0.5" style={{ color: "var(--text-3)" }}>Múltiplas conversões</div>}
                </td>
                <td className="px-3 py-3 text-right border-r" style={{ borderColor: "var(--border)" }}>
                  <div className="text-[13px]" style={{ color: "var(--text-2)" }}>—</div>
                </td>
                <td className="px-3 py-3 text-right border-r" style={{ borderColor: "var(--border)" }}>
                  <div className="text-[14px] font-semibold" style={{ color: "var(--text)" }}>
                    {totals.spend > 0 ? `R$ ${totals.spend.toLocaleString("pt-BR", {minimumFractionDigits: 2})}` : "—"}
                  </div>
                  {totals.spend > 0 && <div className="text-[11px] mt-0.5" style={{ color: "var(--text-3)" }}>Total usado</div>}
                </td>
                <td className="px-3 py-3 text-right border-r" style={{ borderColor: "var(--border)" }}>
                  <div className="text-[14px] font-semibold" style={{ color: "var(--text)" }}>{totals.impressions > 0 ? totals.impressions.toLocaleString("pt-BR") : "—"}</div>
                  {totals.impressions > 0 && <div className="text-[11px] mt-0.5" style={{ color: "var(--text-3)" }}>Total</div>}
                </td>
                <td className="px-3 py-3 text-right border-r" style={{ borderColor: "var(--border)" }}>
                  <div className="text-[14px] font-semibold" style={{ color: "var(--text)" }}>{totals.reach > 0 ? totals.reach.toLocaleString("pt-BR") : "—"}</div>
                  {totals.reach > 0 && <div className="text-[11px] mt-0.5" style={{ color: "var(--text-3)" }}>Total</div>}
                </td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}

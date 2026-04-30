"use client";

import { useEffect, useState, useMemo } from "react";
import { useAppStore } from "@/store/useAppStore";
import { runRefresh, clearFetchCache } from "@/hooks/useMetaData";
import { updateCampaign, updateAdset, updateAd } from "@/services/metaApi";
import { formatCurrency, formatNumber, extractMetric, CONVERSATION_ACTION_TYPES } from "@/lib/formatters";
import { safeArray } from "@/lib/safeArray";
import { ChevronDown, ChevronRight, Edit2, Save, X, ImageIcon, RefreshCw, Search, Plus, Copy, BarChart3, MoreHorizontal, Filter } from "lucide-react";
import { cn } from "@/lib/utils";

const OBJECTIVE_LABELS: Record<string, string> = {
  OUTCOME_TRAFFIC: "Tráfego", OUTCOME_ENGAGEMENT: "Engajamento",
  OUTCOME_LEADS: "Leads", OUTCOME_SALES: "Vendas",
  OUTCOME_AWARENESS: "Reconhecimento", OUTCOME_MESSAGING: "Mensagens",
  MESSAGES: "Mensagens", LINK_CLICKS: "Cliques", CONVERSIONS: "Conversões",
};

function budgetDisplay(obj: any): string {
  if (obj.daily_budget) return `R$ ${(parseInt(obj.daily_budget) / 100).toFixed(2)}/dia`;
  if (obj.lifetime_budget) return `R$ ${(parseInt(obj.lifetime_budget) / 100).toFixed(2)} total`;
  return "Usando o orçam...";
}

function StatusToggle({ active, onChange, size = "md" }: { active: boolean; onChange: () => void; size?: "sm" | "md" }) {
  const w = size === "sm" ? "w-7 h-4" : "w-9 h-5";
  const dot = size === "sm" ? "w-3 h-3" : "w-4 h-4";
  const translate = size === "sm" ? "translate-x-3" : "translate-x-4";
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
      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />
      <span className="text-[12px]" style={{ color: "var(--text)" }}>{label}</span>
    </div>
  );
}

function Th({ children, right }: { children: React.ReactNode; right?: boolean }) {
  return (
    <th className={cn("px-3 py-2.5 text-[11px] font-semibold whitespace-nowrap select-none border-b",
      right ? "text-right" : "text-left")}
      style={{ color: "var(--text-2)", borderColor: "var(--border)", background: "var(--surface-2)" }}>
      {children}
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

  useEffect(() => { if (token && accountId) runRefresh(); }, [token, accountId]);

  const campaignMetrics = useMemo(() => {
    const map: Record<string, { spend: number; impressions: number; clicks: number; convs: number }> = {};
    safeArray(dataA).forEach(r => {
      if (!map[r.campaign_id]) map[r.campaign_id] = { spend: 0, impressions: 0, clicks: 0, convs: 0 };
      map[r.campaign_id].spend += parseFloat(r.spend || "0");
      map[r.campaign_id].impressions += parseInt(r.impressions || "0");
      map[r.campaign_id].clicks += parseInt(r.clicks || "0");
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
    return acc;
  }, { spend: 0, impressions: 0, clicks: 0, convs: 0 });

  const btnBase = "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] font-medium border transition-all";
  const btnStyle = { borderColor: "var(--border-2)", color: "var(--text-2)", background: "var(--surface)" };

  return (
    <div className="-mx-6 lg:-mx-8">
      {/* ── FB-style Action Toolbar ── */}
      <div className="sticky top-14 z-20 flex flex-wrap items-center justify-between gap-2 px-6 lg:px-8 py-2.5 border-b"
        style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
        <div className="flex items-center gap-1.5 flex-wrap">
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] font-semibold bg-[#1877f2] text-white hover:bg-[#166fe5] transition-colors">
            <Plus className="w-3.5 h-3.5" /> Criar
          </button>
          <button className={btnBase} style={btnStyle}>
            <Copy className="w-3.5 h-3.5" /> Duplicar
          </button>
          <button className={btnBase} style={btnStyle}
            onClick={() => { const c = campaigns.find(x => selected.has(x.id)); if (c) startEdit(c); }}>
            <Edit2 className="w-3.5 h-3.5" /> Editar
          </button>
          <button className={btnBase} style={btnStyle}>
            <BarChart3 className="w-3.5 h-3.5" /> Teste A/B
          </button>
          <button className={btnBase} style={btnStyle}>
            <MoreHorizontal className="w-3.5 h-3.5" /> Mais
          </button>
          {someSelected && (
            <span className="text-[11px] font-semibold px-2 py-1 rounded-md"
              style={{ background: "var(--surface-2)", color: "var(--text-2)" }}>
              {selected.size} selecionado{selected.size > 1 ? "s" : ""}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="text-[12px] rounded-md px-2 py-1.5 border focus:outline-none focus:border-[#1877f2] transition-colors"
            style={{ background: "var(--surface-2)", borderColor: "var(--border-2)", color: "var(--text)" }}>
            <option value="ALL">Todos os anúncios</option>
            <option value="ACTIVE">Anúncios ativos</option>
            <option value="PAUSED">Pausados</option>
            <option value="ARCHIVED">Arquivados</option>
          </select>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: "var(--text-3)" }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Pesquisar..."
              className="pl-8 pr-3 py-1.5 text-[12px] rounded-md border focus:outline-none focus:border-[#1877f2] w-44 transition-colors"
              style={{ background: "var(--surface-2)", borderColor: "var(--border-2)", color: "var(--text)" }} />
          </div>
          <button className={btnBase} style={btnStyle}>
            <Filter className="w-3.5 h-3.5" /> Filtros
          </button>
        </div>
      </div>

      {/* Error */}
      {apiError && (
        <div className="mx-6 lg:mx-8 mt-3 p-3 rounded-lg text-[12px] border"
          style={{ background: "rgba(239,68,68,0.08)", borderColor: "rgba(239,68,68,0.2)", color: "#ef4444" }}>
          {apiError}
        </div>
      )}

      {/* Loading */}
      {isLoading && campaigns.length === 0 && (
        <div className="flex items-center justify-center py-20">
          <RefreshCw className="w-6 h-6 text-[#1877f2] animate-spin" />
        </div>
      )}

      {/* Empty */}
      {!isLoading && campaigns.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <p className="text-sm" style={{ color: "var(--text-2)" }}>Nenhuma campanha encontrada</p>
        </div>
      )}

      {/* ── Table ── */}
      {campaigns.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[13px]" style={{ minWidth: 1000 }}>
            <thead>
              <tr>
                <th className="w-10 px-3 py-2.5 border-b" style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}>
                  <input type="checkbox" checked={allSelected}
                    onChange={() => setSelected(allSelected ? new Set() : new Set(campaigns.map(c => c.id)))}
                    className="w-3.5 h-3.5 rounded cursor-pointer accent-[#1877f2]" />
                </th>
                <Th>Campanha</Th>
                <Th>Veiculação</Th>
                <Th right>Resultados</Th>
                <Th right>Custo/resultado</Th>
                <Th right>Orçamento</Th>
                <Th right>Valor usado</Th>
                <Th right>Impressões</Th>
                <Th right>Cliques</Th>
                <th className="w-12 px-3 py-2.5 border-b" style={{ borderColor: "var(--border)", background: "var(--surface-2)" }} />
              </tr>
            </thead>
            <tbody>
              {campaigns.map((campaign: any) => {
                const isExpanded = expanded.has(campaign.id);
                const isSelected = selected.has(campaign.id);
                const adsets = getAdsets(campaign.id);
                const m = campaignMetrics[campaign.id] || { spend: 0, impressions: 0, clicks: 0, convs: 0 };
                const cpl = m.convs > 0 ? m.spend / m.convs : 0;
                const isActive = campaign.effective_status === "ACTIVE";
                const rowBg = isSelected ? "rgba(24,119,242,0.06)" : isExpanded ? "var(--surface-2)" : "var(--surface)";

                return [
                  <tr key={campaign.id} className="group border-b transition-colors"
                    style={{ borderColor: "var(--border)", background: rowBg }}
                    onMouseEnter={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = "var(--surface-2)"; }}
                    onMouseLeave={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = isExpanded ? "var(--surface-2)" : "var(--surface)"; }}>

                    {/* Checkbox */}
                    <td className="px-3 py-2.5 w-10">
                      <input type="checkbox" checked={isSelected} onChange={() => toggleSelect(campaign.id)}
                        className="w-3.5 h-3.5 rounded cursor-pointer accent-[#1877f2]" />
                    </td>

                    {/* Name + expand */}
                    <td className="px-3 py-2.5 min-w-[220px]">
                      <div className="flex items-start gap-2">
                        <button onClick={() => toggle(campaign.id)}
                          className="mt-0.5 flex-shrink-0 transition-colors" style={{ color: "var(--text-3)" }}>
                          {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        </button>
                        <StatusToggle active={isActive}
                          onChange={() => handleToggleStatus("campaign", campaign.id, campaign.effective_status)} />
                        <div className="min-w-0">
                          {editingId === campaign.id ? (
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <input value={editName} onChange={e => setEditName(e.target.value)}
                                className="border rounded px-2 py-0.5 text-[12px] focus:outline-none focus:border-[#1877f2] w-40"
                                style={{ background: "var(--surface-2)", borderColor: "var(--border-2)", color: "var(--text)" }}
                                onClick={e => e.stopPropagation()} />
                              <button onClick={e => { e.stopPropagation(); saveEdit(campaign.id); }} disabled={saving}
                                className="text-[#22c55e]"><Save className="w-3.5 h-3.5" /></button>
                              <button onClick={e => { e.stopPropagation(); setEditingId(null); }}
                                className="text-[#ef4444]"><X className="w-3.5 h-3.5" /></button>
                            </div>
                          ) : (
                            <>
                              <div className="font-medium text-[13px] leading-tight truncate max-w-[260px]" style={{ color: "var(--text)" }}>
                                {campaign.name}
                              </div>
                              <div className="text-[11px] mt-0.5" style={{ color: "var(--text-2)" }}>
                                {OBJECTIVE_LABELS[campaign.objective as string] || campaign.objective || "—"}
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-3 py-2.5"><StatusDot status={campaign.effective_status} /></td>

                    {/* Results */}
                    <td className="px-3 py-2.5 text-right">
                      <div className="font-semibold" style={{ color: "var(--text)" }}>{m.convs > 0 ? m.convs.toLocaleString("pt-BR") : "—"}</div>
                      <div className="text-[10px]" style={{ color: "var(--text-2)" }}>Conversas por mens.</div>
                    </td>

                    {/* CPL */}
                    <td className="px-3 py-2.5 text-right">
                      <div className="font-semibold" style={{ color: "var(--text)" }}>{cpl > 0 ? formatCurrency(cpl) : "—"}</div>
                      <div className="text-[10px]" style={{ color: "var(--text-2)" }}>Por conversa</div>
                    </td>

                    {/* Budget */}
                    <td className="px-3 py-2.5 text-right">
                      {editingId === campaign.id ? (
                        <input value={editBudget} onChange={e => setEditBudget(e.target.value)}
                          placeholder="R$/dia"
                          className="border rounded px-2 py-0.5 text-[12px] text-right focus:outline-none focus:border-[#1877f2] w-24"
                          style={{ background: "var(--surface-2)", borderColor: "var(--border-2)", color: "var(--text)" }}
                          onClick={e => e.stopPropagation()} />
                      ) : (
                        <span style={{ color: "var(--text)" }}>{budgetDisplay(campaign)}</span>
                      )}
                    </td>

                    {/* Spend */}
                    <td className="px-3 py-2.5 text-right font-semibold" style={{ color: "var(--text)" }}>
                      {formatCurrency(m.spend)}
                    </td>

                    {/* Impressions */}
                    <td className="px-3 py-2.5 text-right" style={{ color: "var(--text)" }}>
                      {m.impressions > 0 ? formatNumber(m.impressions) : "—"}
                    </td>

                    {/* Clicks */}
                    <td className="px-3 py-2.5 text-right" style={{ color: "var(--text)" }}>
                      {m.clicks > 0 ? formatNumber(m.clicks) : "—"}
                    </td>

                    {/* Edit action */}
                    <td className="px-3 py-2.5 w-12">
                      {editingId !== campaign.id && (
                        <button onClick={e => { e.stopPropagation(); startEdit(campaign); }}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded"
                          style={{ color: "var(--text-2)" }}
                          onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "var(--surface-3)"}
                          onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}>
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>,

                  // ── Adsets (expanded) ──
                  ...(isExpanded ? adsets.map((adset: any) => {
                    const ads = getAds(adset.id);
                    const isAdsetExpanded = expanded.has(`adset_${adset.id}`);
                    const isAdsetActive = adset.effective_status === "ACTIVE";
                    return [
                      <tr key={`adset_${adset.id}`} className="group border-b transition-colors"
                        style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}
                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "var(--surface-3)"}
                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "var(--surface-2)"}>
                        <td className="px-3 py-2 w-10" />
                        <td className="px-3 py-2" colSpan={1}>
                          <div className="flex items-center gap-2 pl-8">
                            <button onClick={() => toggle(`adset_${adset.id}`)}
                              className="flex-shrink-0 transition-colors" style={{ color: "var(--text-3)" }}>
                              {isAdsetExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                            </button>
                            <StatusToggle size="sm" active={isAdsetActive}
                              onChange={() => handleToggleStatus("adset", adset.id, adset.effective_status)} />
                            <div>
                              <div className="text-[12px] font-medium truncate max-w-[220px]" style={{ color: "var(--text)" }}>{adset.name}</div>
                              <div className="text-[10px]" style={{ color: "var(--text-2)" }}>{ads.length} anúncios • {budgetDisplay(adset)}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-2"><StatusDot status={adset.effective_status} /></td>
                        <td className="px-3 py-2 text-right text-[12px]" style={{ color: "var(--text-2)" }}>—</td>
                        <td className="px-3 py-2 text-right text-[12px]" style={{ color: "var(--text-2)" }}>—</td>
                        <td className="px-3 py-2 text-right text-[12px]" style={{ color: "var(--text)" }}>{budgetDisplay(adset)}</td>
                        <td className="px-3 py-2 text-right text-[12px]" style={{ color: "var(--text-2)" }}>—</td>
                        <td className="px-3 py-2 text-right text-[12px]" style={{ color: "var(--text-2)" }}>—</td>
                        <td className="px-3 py-2 text-right text-[12px]" style={{ color: "var(--text-2)" }}>—</td>
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
                            <td className="px-3 py-2 w-10" />
                            <td className="px-3 py-2">
                              <div className="flex items-center gap-2 pl-16">
                                <StatusToggle size="sm" active={isAdActive}
                                  onChange={() => handleToggleStatus("ad", ad.id, ad.effective_status)} />
                                <div className="w-8 h-8 rounded overflow-hidden flex-shrink-0 flex items-center justify-center"
                                  style={{ background: "var(--surface-3)" }}>
                                  {thumb
                                    ? <img src={thumb} alt="" className="w-full h-full object-cover" />
                                    : <ImageIcon className="w-3.5 h-3.5" style={{ color: "var(--text-3)" }} />}
                                </div>
                                <span className="text-[12px] truncate max-w-[180px]" style={{ color: "var(--text)" }}>{ad.name}</span>
                              </div>
                            </td>
                            <td className="px-3 py-2"><StatusDot status={ad.effective_status} /></td>
                            <td className="px-3 py-2 text-right text-[12px] font-semibold" style={{ color: "var(--text)" }}>
                              {am.convs > 0 ? am.convs.toLocaleString("pt-BR") : "—"}
                            </td>
                            <td className="px-3 py-2 text-right text-[12px]" style={{ color: "var(--text)" }}>
                              {am.convs > 0 ? formatCurrency(am.spend / am.convs) : "—"}
                            </td>
                            <td className="px-3 py-2 text-right text-[12px]" style={{ color: "var(--text-2)" }}>—</td>
                            <td className="px-3 py-2 text-right text-[12px] font-semibold" style={{ color: "var(--text)" }}>
                              {am.spend > 0 ? formatCurrency(am.spend) : "—"}
                            </td>
                            <td className="px-3 py-2 text-right text-[12px]" style={{ color: "var(--text-2)" }}>—</td>
                            <td className="px-3 py-2 text-right text-[12px]" style={{ color: "var(--text-2)" }}>—</td>
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
              <tr style={{ background: "var(--surface-2)", borderTop: `2px solid var(--border-2)` }}>
                <td colSpan={3} className="px-3 py-2.5 text-[11px] font-semibold" style={{ color: "var(--text-2)" }}>
                  Resultados de {campaigns.length} campanhas
                </td>
                <td className="px-3 py-2.5 text-right">
                  <div className="text-[12px] font-bold" style={{ color: "var(--text)" }}>{totals.convs > 0 ? totals.convs.toLocaleString("pt-BR") : "—"}</div>
                  <div className="text-[10px]" style={{ color: "var(--text-2)" }}>Múltiplas conversões</div>
                </td>
                <td className="px-3 py-2.5 text-right">
                  <div className="text-[12px] font-bold" style={{ color: "var(--text)" }}>
                    {totals.convs > 0 ? formatCurrency(totals.spend / totals.convs) : "—"}
                  </div>
                  <div className="text-[10px]" style={{ color: "var(--text-2)" }}>Múltiplas conversões</div>
                </td>
                <td className="px-3 py-2.5 text-right text-[12px]" style={{ color: "var(--text-2)" }}>—</td>
                <td className="px-3 py-2.5 text-right">
                  <div className="text-[12px] font-bold" style={{ color: "var(--text)" }}>{formatCurrency(totals.spend)}</div>
                  <div className="text-[10px]" style={{ color: "var(--text-2)" }}>Total usado</div>
                </td>
                <td className="px-3 py-2.5 text-right">
                  <div className="text-[12px] font-bold" style={{ color: "var(--text)" }}>{totals.impressions > 0 ? formatNumber(totals.impressions) : "—"}</div>
                  <div className="text-[10px]" style={{ color: "var(--text-2)" }}>Total</div>
                </td>
                <td className="px-3 py-2.5 text-right">
                  <div className="text-[12px] font-bold" style={{ color: "var(--text)" }}>{totals.clicks > 0 ? formatNumber(totals.clicks) : "—"}</div>
                  <div className="text-[10px]" style={{ color: "var(--text-2)" }}>Total</div>
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

"use client";

import { useEffect, useState, useMemo } from "react";
import { useAppStore } from "@/store/useAppStore";
import { runRefresh, clearFetchCache } from "@/hooks/useMetaData";
import { updateCampaign, updateAdset, updateAd } from "@/services/metaApi";
import { formatCurrency, formatNumber, extractMetric, CONVERSATION_ACTION_TYPES } from "@/lib/formatters";
import { safeArray } from "@/lib/safeArray";
import { ChevronDown, ChevronRight, Edit2, Save, X, ImageIcon, RefreshCw, Search, SlidersHorizontal } from "lucide-react";
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

// Toggle switch — matches FB Ads Manager style
function StatusToggle({ active, onChange, size = "md" }: { active: boolean; onChange: () => void; size?: "sm" | "md" }) {
  const w = size === "sm" ? "w-7 h-4" : "w-9 h-5";
  const dot = size === "sm" ? "w-3 h-3" : "w-4 h-4";
  const translate = size === "sm" ? "translate-x-3" : "translate-x-4";
  return (
    <button
      onClick={e => { e.stopPropagation(); onChange(); }}
      className={cn(
        "relative inline-flex items-center rounded-full transition-colors duration-200 focus:outline-none flex-shrink-0",
        w,
        active ? "bg-[#1877f2]" : "bg-[var(--surface-3)]"
      )}
      title={active ? "Pausar" : "Ativar"}
    >
      <span className={cn(
        "inline-block rounded-full bg-white shadow transition-transform duration-200",
        dot,
        active ? translate : "translate-x-0.5"
      )} />
    </button>
  );
}

// Status dot
function StatusDot({ status }: { status: string }) {
  const color = status === "ACTIVE" ? "bg-[#22c55e]" : status === "PAUSED" ? "bg-[#94a3b8]" : "bg-[#ef4444]";
  const label = status === "ACTIVE" ? "Ativo" : status === "PAUSED" ? "Pausado" : status;
  return (
    <div className="flex items-center gap-1.5">
      <div className={cn("w-2 h-2 rounded-full flex-shrink-0", color)} />
      <span className="text-[12px] text-[var(--text)]">{label}</span>
    </div>
  );
}

// Column header
function ColHeader({ label, className }: { label: string; className?: string }) {
  return (
    <th className={cn("px-3 py-2.5 text-left text-[11px] font-semibold text-[var(--text-2)] whitespace-nowrap select-none", className)}>
      {label}
    </th>
  );
}

export default function CampaignsPage() {
  const { token, accountId, hierarchy, dataA, dataAds, creativesHD, isLoading, apiError } = useAppStore();
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editBudget, setEditBudget] = useState("");
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"campaigns" | "adsets" | "ads">("campaigns");

  useEffect(() => {
    if (token && accountId) runRefresh();
  }, [token, accountId]);

  const campaignMetrics = useMemo(() => {
    const map: Record<string, { spend: number; impressions: number; clicks: number; convs: number; reach: number }> = {};
    safeArray(dataA).forEach(r => {
      if (!map[r.campaign_id]) map[r.campaign_id] = { spend: 0, impressions: 0, clicks: 0, convs: 0, reach: 0 };
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

  const toggle = (id: string) => setExpanded(prev => {
    const n = new Set(prev);
    n.has(id) ? n.delete(id) : n.add(id);
    return n;
  });

  const getAdsets = (campaignId: string) =>
    safeArray(hierarchy?.adsets).filter((a: any) => a.campaign_id === campaignId);

  const getAds = (adsetId: string) =>
    safeArray(hierarchy?.ads).filter((a: any) => a.adset_id === adsetId);

  const handleToggleStatus = async (type: "campaign" | "adset" | "ad", id: string, currentStatus: string) => {
    const newStatus = currentStatus === "ACTIVE" ? "PAUSED" : "ACTIVE";
    try {
      if (type === "campaign") await updateCampaign(id, token, { status: newStatus as any });
      if (type === "adset") await updateAdset(id, token, { status: newStatus as any });
      if (type === "ad") await updateAd(id, token, { status: newStatus as any });
      clearFetchCache();
      runRefresh();
    } catch (err) {
      console.error("Erro ao alterar status:", err);
    }
  };

  const startEdit = (obj: any) => {
    setEditingId(obj.id);
    setEditName(obj.name);
    const b = obj.daily_budget || obj.lifetime_budget;
    setEditBudget(b ? (parseInt(b) / 100).toFixed(2) : "");
  };

  const saveEdit = async (id: string) => {
    setSaving(true);
    const updates: any = { name: editName };
    if (editBudget && !isNaN(Number(editBudget))) {
      updates.daily_budget = Math.round(Number(editBudget) * 100);
    }
    await updateCampaign(id, token, updates);
    setEditingId(null);
    setSaving(false);
    clearFetchCache();
    runRefresh();
  };

  if (!token || !accountId) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] flex-col gap-4">
        <p className="text-[var(--text-2)] text-sm font-semibold">Token não configurado</p>
        <a href="/settings" className="px-4 py-2 bg-[#1877f2] text-white rounded-lg text-sm font-semibold hover:bg-[#166fe5] transition-colors">
          Ir para Configurações →
        </a>
      </div>
    );
  }

  const campaigns = safeArray(hierarchy?.campaigns)
    .filter(c => !search || c.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => (campaignMetrics[b.id]?.spend || 0) - (campaignMetrics[a.id]?.spend || 0));

  // Totals row
  const totals = campaigns.reduce((acc, c) => {
    const m = campaignMetrics[c.id] || {};
    acc.spend += m.spend || 0;
    acc.impressions += m.impressions || 0;
    acc.convs += m.convs || 0;
    return acc;
  }, { spend: 0, impressions: 0, convs: 0 });

  return (
    <div className="space-y-0 -mx-6 lg:-mx-8">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-6 lg:px-8 py-3 border-b"
        style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
        <div className="flex items-center gap-2">
          {/* Tab switcher — like FB Ads Manager */}
          {(["campaigns", "adsets", "ads"] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={cn(
                "px-3 py-1.5 rounded-md text-[12px] font-semibold transition-all",
                activeTab === tab
                  ? "bg-[#1877f2]/10 text-[#1877f2] border border-[#1877f2]/20"
                  : "text-[var(--text-2)] hover:bg-[var(--surface-2)] border border-transparent"
              )}>
              {tab === "campaigns" ? "Campanhas" : tab === "adsets" ? "Conjuntos" : "Anúncios"}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--text-3)]" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Pesquisar..."
              className="pl-8 pr-3 py-1.5 text-[12px] rounded-md border focus:outline-none focus:border-[#1877f2] w-44 transition-colors"
              style={{
                background: "var(--surface-2)",
                borderColor: "var(--border-2)",
                color: "var(--text)",
              }}
            />
          </div>
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] font-semibold border transition-all hover:bg-[var(--surface-2)]"
            style={{ borderColor: "var(--border-2)", color: "var(--text-2)" }}>
            <SlidersHorizontal className="w-3.5 h-3.5" />
            Colunas
          </button>
        </div>
      </div>

      {/* Error */}
      {apiError && (
        <div className="mx-6 lg:mx-8 mt-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-[12px]">{apiError}</div>
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
          <p className="text-[var(--text-2)] text-sm">Nenhuma campanha encontrada</p>
        </div>
      )}

      {/* Table */}
      {campaigns.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[13px]" style={{ minWidth: 900 }}>
            <thead>
              <tr style={{ background: "var(--surface-2)", borderBottom: "1px solid var(--border)" }}>
                <th className="w-8 px-3 py-2.5" />
                <th className="w-10 px-3 py-2.5" />
                <ColHeader label="Campanha" className="min-w-[200px]" />
                <ColHeader label="Veiculação" />
                <ColHeader label="Resultados" className="text-right" />
                <ColHeader label="Custo por resultado" className="text-right" />
                <ColHeader label="Orçamento" className="text-right" />
                <ColHeader label="Valor usado" className="text-right" />
                <ColHeader label="Impressões" className="text-right" />
                <th className="w-16 px-3 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {campaigns.map((campaign: any) => {
                const isExpanded = expanded.has(campaign.id);
                const adsets = getAdsets(campaign.id);
                const m = campaignMetrics[campaign.id] || { spend: 0, impressions: 0, clicks: 0, convs: 0 };
                const cpl = m.convs > 0 ? m.spend / m.convs : 0;
                const isActive = campaign.effective_status === "ACTIVE";

                return [
                  // Campaign row
                  <tr key={campaign.id}
                    className="group border-b transition-colors cursor-pointer"
                    style={{ borderColor: "var(--border)", background: isExpanded ? "var(--surface-2)" : "var(--surface)" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "var(--surface-2)")}
                    onMouseLeave={e => (e.currentTarget.style.background = isExpanded ? "var(--surface-2)" : "var(--surface)")}
                  >
                    {/* Expand */}
                    <td className="px-3 py-2.5 w-8">
                      <button onClick={() => toggle(campaign.id)}
                        className="text-[var(--text-3)] hover:text-[var(--text)] transition-colors">
                        {isExpanded
                          ? <ChevronDown className="w-4 h-4" />
                          : <ChevronRight className="w-4 h-4" />}
                      </button>
                    </td>

                    {/* Toggle */}
                    <td className="px-3 py-2.5 w-10">
                      <StatusToggle
                        active={isActive}
                        onChange={() => handleToggleStatus("campaign", campaign.id, campaign.effective_status)}
                      />
                    </td>

                    {/* Name */}
                    <td className="px-3 py-2.5 min-w-[200px]">
                      {editingId === campaign.id ? (
                        <div className="flex items-center gap-2">
                          <input value={editName} onChange={e => setEditName(e.target.value)}
                            className="border rounded px-2 py-1 text-[12px] focus:outline-none focus:border-[#1877f2] w-44"
                            style={{ background: "var(--surface-2)", borderColor: "var(--border-2)", color: "var(--text)" }}
                            onClick={e => e.stopPropagation()} />
                          <button onClick={e => { e.stopPropagation(); saveEdit(campaign.id); }} disabled={saving}
                            className="text-[#22c55e] hover:opacity-80"><Save className="w-3.5 h-3.5" /></button>
                          <button onClick={e => { e.stopPropagation(); setEditingId(null); }}
                            className="text-[#ef4444] hover:opacity-80"><X className="w-3.5 h-3.5" /></button>
                        </div>
                      ) : (
                        <div>
                          <div className="font-medium text-[var(--text)] text-[13px] leading-tight truncate max-w-[280px]">
                            {campaign.name}
                          </div>
                          <div className="text-[11px] text-[var(--text-2)] mt-0.5">
                            {OBJECTIVE_LABELS[campaign.objective as string] || campaign.objective || "—"}
                          </div>
                        </div>
                      )}
                    </td>

                    {/* Status */}
                    <td className="px-3 py-2.5">
                      <StatusDot status={campaign.effective_status} />
                    </td>

                    {/* Results */}
                    <td className="px-3 py-2.5 text-right">
                      <div className="font-semibold text-[var(--text)]">{formatNumber(m.convs)}</div>
                      <div className="text-[10px] text-[var(--text-2)]">Conversas por mens...</div>
                    </td>

                    {/* CPL */}
                    <td className="px-3 py-2.5 text-right">
                      <div className="font-semibold text-[var(--text)]">{cpl > 0 ? formatCurrency(cpl) : "—"}</div>
                      <div className="text-[10px] text-[var(--text-2)]">Por conversa por men...</div>
                    </td>

                    {/* Budget */}
                    <td className="px-3 py-2.5 text-right">
                      {editingId === campaign.id ? (
                        <input value={editBudget} onChange={e => setEditBudget(e.target.value)}
                          placeholder="R$/dia"
                          className="border rounded px-2 py-1 text-[12px] text-right focus:outline-none focus:border-[#1877f2] w-24"
                          style={{ background: "var(--surface-2)", borderColor: "var(--border-2)", color: "var(--text)" }}
                          onClick={e => e.stopPropagation()} />
                      ) : (
                        <span className="text-[var(--text)]">{budgetDisplay(campaign)}</span>
                      )}
                    </td>

                    {/* Spend */}
                    <td className="px-3 py-2.5 text-right font-semibold text-[var(--text)]">
                      {formatCurrency(m.spend)}
                    </td>

                    {/* Impressions */}
                    <td className="px-3 py-2.5 text-right text-[var(--text)]">
                      {formatNumber(m.impressions)}
                    </td>

                    {/* Actions */}
                    <td className="px-3 py-2.5 w-16">
                      {editingId !== campaign.id && (
                        <button onClick={e => { e.stopPropagation(); startEdit(campaign); }}
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-[var(--text-2)] hover:text-[var(--text)] p-1 rounded hover:bg-[var(--surface-3)]">
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>,

                  // Adsets (expanded)
                  ...(isExpanded ? adsets.map((adset: any) => {
                    const ads = getAds(adset.id);
                    const isAdsetExpanded = expanded.has(`adset_${adset.id}`);
                    const isAdsetActive = adset.effective_status === "ACTIVE";

                    return [
                      <tr key={`adset_${adset.id}`}
                        className="group border-b transition-colors"
                        style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}
                        onMouseEnter={e => (e.currentTarget.style.background = "var(--surface-3)")}
                        onMouseLeave={e => (e.currentTarget.style.background = "var(--surface-2)")}
                      >
                        <td className="px-3 py-2 w-8">
                          <div className="w-4 border-l-2 border-b-2 h-4 ml-2 rounded-bl-sm" style={{ borderColor: "var(--border-2)" }} />
                        </td>
                        <td className="px-3 py-2 w-10">
                          <StatusToggle size="sm" active={isAdsetActive}
                            onChange={() => handleToggleStatus("adset", adset.id, adset.effective_status)} />
                        </td>
                        <td className="px-3 py-2" colSpan={1}>
                          <div className="flex items-center gap-2">
                            <button onClick={() => toggle(`adset_${adset.id}`)}
                              className="text-[var(--text-3)] hover:text-[var(--text)] transition-colors flex-shrink-0">
                              {isAdsetExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                            </button>
                            <div>
                              <div className="text-[12px] font-medium text-[var(--text)] truncate max-w-[240px]">{adset.name}</div>
                              <div className="text-[10px] text-[var(--text-2)]">{ads.length} anúncios • {budgetDisplay(adset)}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-2"><StatusDot status={adset.effective_status} /></td>
                        <td className="px-3 py-2 text-right text-[var(--text-2)] text-[12px]">—</td>
                        <td className="px-3 py-2 text-right text-[var(--text-2)] text-[12px]">—</td>
                        <td className="px-3 py-2 text-right text-[12px] text-[var(--text)]">{budgetDisplay(adset)}</td>
                        <td className="px-3 py-2 text-right text-[var(--text-2)] text-[12px]">—</td>
                        <td className="px-3 py-2 text-right text-[var(--text-2)] text-[12px]">—</td>
                        <td className="px-3 py-2 w-16" />
                      </tr>,

                      // Ads (expanded adset)
                      ...(isAdsetExpanded ? ads.map((ad: any) => {
                        const thumb = creativesHD?.[ad.id] || (ad as any).creative?.thumbnail_url;
                        const am = adMetrics[ad.id] || { spend: 0, convs: 0 };
                        const isAdActive = ad.effective_status === "ACTIVE";
                        return (
                          <tr key={`ad_${ad.id}`}
                            className="border-b transition-colors"
                            style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}
                            onMouseEnter={e => (e.currentTarget.style.background = "var(--surface-3)")}
                            onMouseLeave={e => (e.currentTarget.style.background = "var(--surface-2)")}
                          >
                            <td className="px-3 py-2 w-8">
                              <div className="w-4 border-l-2 border-b-2 h-4 ml-6 rounded-bl-sm" style={{ borderColor: "var(--border-2)" }} />
                            </td>
                            <td className="px-3 py-2 w-10">
                              <StatusToggle size="sm" active={isAdActive}
                                onChange={() => handleToggleStatus("ad", ad.id, ad.effective_status)} />
                            </td>
                            <td className="px-3 py-2">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded overflow-hidden bg-[var(--surface-3)] flex-shrink-0 flex items-center justify-center">
                                  {thumb
                                    ? <img src={thumb} alt="" className="w-full h-full object-cover" />
                                    : <ImageIcon className="w-3.5 h-3.5 text-[var(--text-3)]" />}
                                </div>
                                <span className="text-[12px] text-[var(--text)] truncate max-w-[200px]">{ad.name}</span>
                              </div>
                            </td>
                            <td className="px-3 py-2"><StatusDot status={ad.effective_status} /></td>
                            <td className="px-3 py-2 text-right text-[12px] font-semibold text-[var(--text)]">{formatNumber(am.convs)}</td>
                            <td className="px-3 py-2 text-right text-[12px] text-[var(--text)]">
                              {am.convs > 0 ? formatCurrency(am.spend / am.convs) : "—"}
                            </td>
                            <td className="px-3 py-2 text-right text-[var(--text-2)] text-[12px]">—</td>
                            <td className="px-3 py-2 text-right text-[12px] font-semibold text-[var(--text)]">{formatCurrency(am.spend)}</td>
                            <td className="px-3 py-2 text-right text-[var(--text-2)] text-[12px]">—</td>
                            <td className="px-3 py-2 w-16" />
                          </tr>
                        );
                      }) : [])
                    ];
                  }).flat() : [])
                ];
              }).flat()}
            </tbody>

            {/* Totals footer */}
            {campaigns.length > 0 && (
              <tfoot>
                <tr style={{ background: "var(--surface-2)", borderTop: "2px solid var(--border-2)" }}>
                  <td colSpan={4} className="px-3 py-2.5 text-[11px] font-semibold text-[var(--text-2)]">
                    Resultados de {campaigns.length} campanhas
                  </td>
                  <td className="px-3 py-2.5 text-right text-[12px] font-bold text-[var(--text)]">
                    {formatNumber(totals.convs)}
                    <div className="text-[10px] font-normal text-[var(--text-2)]">Múltiplas conversões</div>
                  </td>
                  <td className="px-3 py-2.5 text-right text-[12px] font-bold text-[var(--text)]">
                    {totals.convs > 0 ? formatCurrency(totals.spend / totals.convs) : "—"}
                    <div className="text-[10px] font-normal text-[var(--text-2)]">Múltiplas conversões</div>
                  </td>
                  <td className="px-3 py-2.5 text-right text-[var(--text-2)] text-[12px]">—</td>
                  <td className="px-3 py-2.5 text-right text-[12px] font-bold text-[var(--text)]">
                    {formatCurrency(totals.spend)}
                    <div className="text-[10px] font-normal text-[var(--text-2)]">Total usado</div>
                  </td>
                  <td className="px-3 py-2.5 text-right text-[12px] font-bold text-[var(--text)]">
                    {formatNumber(totals.impressions)}
                    <div className="text-[10px] font-normal text-[var(--text-2)]">Total</div>
                  </td>
                  <td />
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      )}
    </div>
  );
}

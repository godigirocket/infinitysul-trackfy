import { MetaInsight, CampaignIntel, IntelFilters } from "@/types";
import { extractMetric } from "./formatters";

// ─────────────────────────────────────────────────────────────────────────────
// DYNAMIC PRODUCT PARSER
// Scans campaign names → auto-detects product/insurer tokens
// No manual list. Works for any future name.
// ─────────────────────────────────────────────────────────────────────────────

export function parseProductFromCampaign(name: string): string {
  if (!name) return "Outros";

  // Split on common delimiters: | - _ / \ : spaces
  const tokens = name
    .split(/[\|\-_\/\\:\s]+/)
    .map((t) => t.trim())
    .filter((t) => t.length >= 3);

  // Words that are NOT product names (structural keywords)
  const stopWords = new Set([
    "campanha", "camp", "ads", "meta", "facebook", "instagram",
    "leads", "lead", "trafego", "tráfego", "pago", "remarketing",
    "retargeting", "lookalike", "prospeccao", "prospecção",
    "veiculacao", "veiculação", "ativo", "pausado", "teste",
    "test", "ABtest", "abtest", "ABTEST", "new", "novo", "nova",
    "copy", "v1", "v2", "v3", "v4", "v01", "v02", "q1", "q2",
    "jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago",
    "set", "out", "nov", "dez", "2024", "2025", "2026",
    "interesse", "comportamento", "similaridade", "brt", "br",
    "sp", "rj", "mg", "rs", "pr", "sc"
  ]);

  // Find first meaningful capitalized or all-caps token
  const productToken = tokens.find((t) => {
    const lc = t.toLowerCase();
    if (stopWords.has(lc)) return false;
    if (/^\d+$/.test(t)) return false; // pure number
    // Must start with uppercase or be known brand pattern
    return /^[A-ZÀ-Ú]/.test(t) || t.length >= 4;
  });

  return productToken || tokens[0] || "Geral";
}

// ─────────────────────────────────────────────────────────────────────────────
// DYNAMIC FILTER BUILDER
// Auto-generates all filter options from live Meta data
// ─────────────────────────────────────────────────────────────────────────────

export function buildFilters(data: MetaInsight[]): IntelFilters {
  const productSet = new Set<string>();
  const campaignSet = new Set<string>();

  data.forEach((row) => {
    campaignSet.add(row.campaign_name);
    productSet.add(parseProductFromCampaign(row.campaign_name));
  });

  return {
    products: Array.from(productSet).sort(),
    campaigns: Array.from(campaignSet).sort(),
    placements: [], // populated via Meta breakdown API
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// CAMPAIGN AGGREGATION
// Collapses daily rows into per-campaign totals
// ─────────────────────────────────────────────────────────────────────────────

function aggregateByCampaign(data: MetaInsight[]): Map<string, {
  campaign_id: string;
  campaign_name: string;
  spend: number;
  impressions: number;
  clicks: number;
  leads: number;
  conversations: number;
  frequency: number;
  rows: number;
}> {
  const map = new Map();

  data.forEach((row) => {
    const id = row.campaign_id;
    if (!map.has(id)) {
      map.set(id, {
        campaign_id: id,
        campaign_name: row.campaign_name,
        spend: 0,
        impressions: 0,
        clicks: 0,
        leads: 0,
        conversations: 0,
        frequency: 0,
        rows: 0,
      });
    }
    const c = map.get(id)!;
    c.spend += parseFloat(row.spend || "0");
    c.impressions += parseInt(row.impressions || "0");
    c.clicks += parseInt(row.clicks || "0");
    c.leads += extractMetric(row.actions, ["lead", "leadgen.other"]);
    c.conversations += extractMetric(row.actions, [
      "onsite_conversion.messaging_conversation_started_7d",
      "onsite_conversion.messaging_first_reply",
    ]);
    c.frequency = Math.max(c.frequency, parseFloat(row.frequency || "0"));
    c.rows += 1;
  });

  return map;
}

// ─────────────────────────────────────────────────────────────────────────────
// SIGNAL GENERATOR
// Classify each campaign: 🟢 scale / 🟡 monitor / 🔴 optimize
// Based purely on performance metrics vs account average — no names needed
// ─────────────────────────────────────────────────────────────────────────────

function generateSignal(
  cpl: number,
  avgCpl: number,
  leads: number,
  frequency: number,
  spend: number,
  funnelDrop: number
): { signal: CampaignIntel["signal"]; reason: string } {
  // Critical: High CPL + High Frequency = Audience fatigue
  if (cpl > avgCpl * 1.4 && frequency > 3.5) {
    return { signal: "optimize", reason: "CPL elevado + audiência saturada (freq > 3.5)" };
  }
  // Bad: Very high CPL
  if (cpl > avgCpl * 1.35) {
    return { signal: "optimize", reason: `CPL ${((cpl / avgCpl - 1) * 100).toFixed(0)}% acima da média` };
  }
  // Bad: No leads despite meaningful spend
  if (spend > 50 && leads === 0) {
    return { signal: "optimize", reason: "Gasto sem geração de leads" };
  }
  // Scale: Low CPL, generating leads
  if (cpl < avgCpl * 0.8 && leads >= 3) {
    return { signal: "scale", reason: `CPL ${((1 - cpl / avgCpl) * 100).toFixed(0)}% abaixo da média — Resultado consistente` };
  }
  // Scale: Strong funnel with good CPL
  if (cpl <= avgCpl && leads >= 5 && funnelDrop < 60) {
    return { signal: "scale", reason: "Funil saudável + CPL dentro do target" };
  }
  // Default
  return { signal: "monitor", reason: "Aguardando volume de dados para classificação" };
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN EXPORT: Run Intelligence
// ─────────────────────────────────────────────────────────────────────────────

export function runIntelligence(data: MetaInsight[]): CampaignIntel[] {
  if (!data || data.length === 0) return [];

  const aggregated = aggregateByCampaign(data);
  const campaigns = Array.from(aggregated.values());

  // Calculate account-wide average CPL
  const totalLeads = campaigns.reduce((s, c) => s + c.leads, 0);
  const totalSpend = campaigns.reduce((s, c) => s + c.spend, 0);
  const avgCpl = totalLeads > 0 ? totalSpend / totalLeads : 0;

  return campaigns.map((c) => {
    const cpl = c.leads > 0 ? c.spend / c.leads : c.spend > 0 ? 9999 : 0;
    const ctr = c.impressions > 0 ? (c.clicks / c.impressions) * 100 : 0;
    const funnelDrop = c.clicks > 0 ? ((c.clicks - c.leads) / c.clicks) * 100 : 100;
    const cplVsAvg = avgCpl > 0 ? ((cpl - avgCpl) / avgCpl) * 100 : 0;

    const { signal, reason } = generateSignal(cpl, avgCpl, c.leads, c.frequency, c.spend, funnelDrop);

    return {
      campaign_id: c.campaign_id,
      campaign_name: c.campaign_name,
      product: parseProductFromCampaign(c.campaign_name),
      spend: c.spend,
      impressions: c.impressions,
      clicks: c.clicks,
      leads: c.leads,
      conversations: c.conversations,
      cpl,
      ctr,
      frequency: c.frequency,
      signal,
      signalReason: reason,
      cplVsAvg,
      funnelDrop,
    };
  }).sort((a, b) => {
    // Sort: scale first, then monitor, then optimize
    const order = { scale: 0, monitor: 1, optimize: 2 };
    return order[a.signal] - order[b.signal];
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// ACCOUNT KPI SUMMARY
// ─────────────────────────────────────────────────────────────────────────────

export function calcIntelSummary(intel: CampaignIntel[]) {
  const totalSpend = intel.reduce((s, c) => s + c.spend, 0);
  const totalLeads = intel.reduce((s, c) => s + c.leads, 0);
  const totalConversations = intel.reduce((s, c) => s + c.conversations, 0);
  const totalImpressions = intel.reduce((s, c) => s + c.impressions, 0);
  const totalClicks = intel.reduce((s, c) => s + c.clicks, 0);
  const avgCpl = totalLeads > 0 ? totalSpend / totalLeads : 0;
  const convRate = totalLeads > 0 ? (totalConversations / totalLeads) * 100 : 0;
  const scalable = intel.filter((c) => c.signal === "scale").length;
  const needsAttention = intel.filter((c) => c.signal === "optimize").length;

  return {
    totalSpend,
    totalLeads,
    totalConversations,
    totalImpressions,
    totalClicks,
    avgCpl,
    convRate,
    scalable,
    needsAttention,
    totalCampaigns: intel.length,
  };
}

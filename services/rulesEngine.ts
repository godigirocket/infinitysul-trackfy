import { extractMetric } from "@/lib/formatters";

export interface Alert {
  type: "warning" | "danger" | "success";
  message: string;
}

/**
 * Hook Rate = % of people who watched 3 seconds.
 * Uses video_p25_watched_actions as a proxy for the initial hook,
 * and falls back to video_30_sec_watched_actions.
 */
export const calculateHookRate = (c: any): number => {
  const imps = parseInt(c.impressions || c.imps || "0");
  if (imps <= 0) return 0;

  // Try video_p25 first (most reliable for "hook")
  let hooks = extractMetric(c.video_p25_watched_actions, ['video_view']);
  
  // Fallback to 30-sec metric
  if (hooks === 0) {
    hooks = extractMetric(c.video_30_sec_watched_actions, ['video_view']);
  }

  // Final fallback: use p50 as a broader net
  if (hooks === 0) {
    hooks = extractMetric(c.video_p50_watched_actions, ['video_view']);
  }

  return (hooks / imps) * 100;
};

/**
 * Hold Rate = % of people who continued watching past 25%.
 * Uses video_p75 for a "deep engagement" metric.
 */
export const calculateHoldRate = (c: any): number => {
  const imps = parseInt(c.impressions || c.imps || "0");
  if (imps <= 0) return 0;

  let holds = extractMetric(c.video_p75_watched_actions, ['video_view']);
  
  // Fallback to p50
  if (holds === 0) {
    holds = extractMetric(c.video_p50_watched_actions, ['video_view']);
  }

  return (holds / imps) * 100;
};

export const getOpportunityCost = (campaigns: any[], avgCpl: number): number => {
  if (avgCpl <= 0) return 0;
  return campaigns.reduce((acc, c) => {
    const cpl = c.leads > 0 ? c.spend / c.leads : 0;
    if (cpl > avgCpl) {
      return acc + (c.spend - (c.leads * avgCpl));
    }
    return acc;
  }, 0);
};

export const analyzeCampaigns = (campaigns: Record<string, any>, avgCpl: number): Alert[] => {
  const alerts: Alert[] = [];
  const campaignList = Object.values(campaigns);

  campaignList.forEach((c) => {
    const ctr = c.imps > 0 ? (c.clicks / c.imps) * 100 : 0;
    const cpl = c.leads > 0 ? c.spend / c.leads : 0;

    if (avgCpl > 0 && cpl > 0 && cpl < avgCpl * 0.7 && c.leads > 5) {
      alerts.push({
        type: "success",
        message: `OPORTUNIDADE DE ESCALA: ${c.name} está com CPL R$${cpl.toFixed(2)} (${(((avgCpl - cpl) / avgCpl) * 100).toFixed(0)}% abaixo da média). Aumente o orçamento.`,
      });
    }

    if (avgCpl > 0 && c.spend > avgCpl * 2 && c.leads === 0) {
      alerts.push({
        type: "danger",
        message: `ALERTA DE DESPERDÍCIO: ${c.name} gastou R$${c.spend.toFixed(2)} sem gerar leads. CPL médio da conta é R$${avgCpl.toFixed(2)}.`,
      });
    }

    if (c.frequency > 3.2 && c.spend > 50) {
      alerts.push({
        type: "warning",
        message: `Frequência alta em ${c.name} (${c.frequency.toFixed(2)}). Público saturando.`,
      });
    }
  });

  return alerts;
};

export const calculateHealthScore = (c: any, avgCpl: number): number => {
  const ctr = c.imps > 0 ? (c.clicks / c.imps) * 100 : 0;
  const cpl = c.leads > 0 ? c.spend / c.leads : 0;
  
  let score = 50;

  if (ctr > 1.5) score += 30;
  else if (ctr > 1.0) score += 20;
  else if (ctr > 0.5) score += 10;
  else score -= 10;

  if (c.frequency < 2.0) score += 20;
  else if (c.frequency < 3.0) score += 10;
  else if (c.frequency > 4.0) score -= 20;

  if (avgCpl > 0) {
    if (cpl > 0) {
      if (cpl < avgCpl * 0.5) score += 50;
      else if (cpl < avgCpl) score += 30;
      else if (cpl < avgCpl * 1.5) score += 10;
      else score -= 20;
    } else if (c.spend > avgCpl) {
      score -= 20;
    }
  }

  return Math.min(100, Math.max(0, score));
};

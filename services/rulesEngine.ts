import { extractMetric } from "@/lib/formatters";

export interface Alert {
  type: "warning" | "danger" | "success";
  message: string;
}

export const calculateHookRate = (c: any): number => {
  const hooks = extractMetric(c.video_30_sec_watched_actions, ['video_view']); // Using 30s as a proxy if 3s is not direct
  return c.imps > 0 ? (hooks / c.imps) * 100 : 0;
};

export const calculateHoldRate = (c: any): number => {
  const p25 = extractMetric(c.video_p25_watched_actions, ['video_view']);
  return c.imps > 0 ? (p25 / c.imps) * 100 : 0;
};

export const getOpportunityCost = (campaigns: any[], targetCPA: number): number => {
  return campaigns.reduce((acc, c) => {
    const cpl = c.leads > 0 ? c.spend / c.leads : 0;
    if (cpl > targetCPA) {
      return acc + (c.spend - (c.leads * targetCPA));
    }
    return acc;
  }, 0);
};

export const analyzeCampaigns = (campaigns: Record<string, any>, targetCPA: number): Alert[] => {
  const alerts: Alert[] = [];
  const campaignList = Object.values(campaigns);

  campaignList.forEach((c) => {
    const ctr = c.imps > 0 ? (c.clicks / c.imps) * 100 : 0;
    const cpl = c.leads > 0 ? c.spend / c.leads : 0;

    // Scale Signal
    if (cpl > 0 && cpl < targetCPA * 0.7 && c.leads > 5) {
      alerts.push({
        type: "success",
        message: `OPORTUNIDADE DE ESCALA: ${c.name} está com CPL R$${cpl.toFixed(2)} (Meta: R$${targetCPA}). Aumente o orçamento em 20%.`,
      });
    }

    // Stop-Loss Signal
    if (c.spend > targetCPA * 2 && c.leads === 0) {
      alerts.push({
        type: "danger",
        message: `STOP-LOSS ATIVADO: ${c.name} gastou R$${c.spend.toFixed(2)} sem leads. Pausa recomendada.`,
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

export const calculateHealthScore = (c: any, targetCPA: number): number => {
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

  if (cpl > 0) {
    if (cpl < targetCPA * 0.5) score += 50;
    else if (cpl < targetCPA) score += 30;
    else if (cpl < targetCPA * 1.5) score += 10;
    else score -= 20;
  } else if (c.spend > targetCPA) {
    score -= 20;
  }

  return Math.min(100, Math.max(0, score));
};

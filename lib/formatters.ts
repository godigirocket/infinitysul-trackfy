import { MetaAction } from "@/types";

export const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value || 0);

export const formatNumber = (value: number) =>
  new Intl.NumberFormat("pt-BR").format(value || 0);

export const formatPercent = (value: number) => {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(1)}%`;
};

export const extractMetric = (actions: MetaAction[] | undefined | any, types: string[]) => {
  if (!actions) return 0;
  
  // Facebook Graph API nested object support
  const arr = Array.isArray(actions) ? actions : (actions.data || []);
  
  if (!Array.isArray(arr)) return 0;

  return arr
    .filter((a) => types.includes(a.action_type))
    .reduce((sum, a) => sum + parseFloat(a.value || "0"), 0);
};

// All known Meta action types for leads across different campaign objectives
export const LEAD_ACTION_TYPES = [
  "lead",
  "leadgen.other",
  "offsite_conversion.fb_pixel_lead",
  "onsite_conversion.lead_grouped",
  "contact_total",
  "contact",
  "schedule",
  "submit_application",
  "complete_registration",
  "find_location",
  "start_trial",
  "subscribe",
];

// All known Meta action types for messaging conversations
export const CONVERSATION_ACTION_TYPES = [
  "onsite_conversion.messaging_conversation_started_7d",
  "onsite_conversion.messaging_first_reply",
  "onsite_conversion.messaging_conversation_started",
  "offsite_conversion.fb_pixel_messaging_first_reply",
  "onsite_conversion.total_messaging_connection",
];

export const calcDiff = (now: number, old: number) => {
  if (!old || old === 0) return 0;
  return ((now - old) / old) * 100;
};

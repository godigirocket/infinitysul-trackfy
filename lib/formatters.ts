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

export const extractMetric = (actions: MetaAction[] | undefined, types: string[]) => {
  if (!actions) return 0;
  return actions
    .filter((a) => types.includes(a.action_type))
    .reduce((sum, a) => sum + parseInt(a.value || "0", 10), 0);
};

export const calcDiff = (now: number, old: number) => {
  if (!old || old === 0) return 0;
  return ((now - old) / old) * 100;
};

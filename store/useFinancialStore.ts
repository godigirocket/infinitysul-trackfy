import { create } from "zustand";

export interface Order {
  order_id: string;
  product_name: string;
  gross_revenue: number;
  net_revenue: number;
  gateway_fee: number;
  status: "paid" | "refunded" | "chargeback" | "pending" | "cancelled";
  payment_method: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  campaign_id?: string;
  fbclid?: string;
  timestamp: string;
}

export interface TaxRate {
  id: string;
  name: string;
  rate: number; // percentage 0-100
  applies_to: "gross" | "net";
}

export interface Expense {
  id: string;
  name: string;
  amount: number;
  type: "fixed" | "variable";
  period: "monthly" | "daily" | "per_sale";
}

export interface ProductCost {
  id: string;
  product_name: string;
  cost: number;
  type: "fixed" | "percentage";
}

export interface FinancialConfig {
  taxRates: TaxRate[];
  expenses: Expense[];
  productCosts: ProductCost[];
}

export interface FinancialMetrics {
  grossRevenue: number;
  netRevenue: number;
  totalOrders: number;
  refundRate: number;
  chargebackRate: number;
  profit: number;
  roi: number;
  roas: number;
  margin: number;
  arpu: number;
  totalTaxes: number;
  totalExpenses: number;
  totalAdSpend: number;
}

interface FinancialStore {
  orders: Order[];
  config: FinancialConfig;
  addOrder: (order: Order) => void;
  addOrders: (orders: Order[]) => void;
  removeOrder: (id: string) => void;
  updateOrderStatus: (id: string, status: Order["status"]) => void;
  setTaxRates: (rates: TaxRate[]) => void;
  addTaxRate: (rate: TaxRate) => void;
  removeTaxRate: (id: string) => void;
  setExpenses: (expenses: Expense[]) => void;
  addExpense: (expense: Expense) => void;
  removeExpense: (id: string) => void;
  setProductCosts: (costs: ProductCost[]) => void;
  addProductCost: (cost: ProductCost) => void;
  removeProductCost: (id: string) => void;
  computeMetrics: (adSpend: number) => FinancialMetrics;
}

const STORAGE_KEY = "tf-financial";

function loadFromStorage(): Partial<FinancialStore> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch { return {}; }
}

function saveToStorage(state: FinancialStore) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      orders: state.orders,
      config: state.config,
    }));
  } catch {}
}

const saved = loadFromStorage();

export const useFinancialStore = create<FinancialStore>()((set, get) => ({
  orders: (saved as any).orders || [],
  config: (saved as any).config || {
    taxRates: [
      { id: "simples", name: "Simples Nacional", rate: 6, applies_to: "gross" },
    ],
    expenses: [],
    productCosts: [],
  },

  addOrder: (order) => {
    set(s => {
      const orders = [...s.orders.filter(o => o.order_id !== order.order_id), order];
      const next = { ...s, orders };
      saveToStorage(next);
      return { orders };
    });
  },

  addOrders: (newOrders) => {
    set(s => {
      const existingIds = new Set(s.orders.map(o => o.order_id));
      const toAdd = newOrders.filter(o => !existingIds.has(o.order_id));
      const orders = [...s.orders, ...toAdd];
      const next = { ...s, orders };
      saveToStorage(next);
      return { orders };
    });
  },

  removeOrder: (id) => {
    set(s => {
      const orders = s.orders.filter(o => o.order_id !== id);
      const next = { ...s, orders };
      saveToStorage(next);
      return { orders };
    });
  },

  updateOrderStatus: (id, status) => {
    set(s => {
      const orders = s.orders.map(o => o.order_id === id ? { ...o, status } : o);
      const next = { ...s, orders };
      saveToStorage(next);
      return { orders };
    });
  },

  setTaxRates: (taxRates) => set(s => { const config = { ...s.config, taxRates }; saveToStorage({ ...s, config }); return { config }; }),
  addTaxRate: (rate) => set(s => { const config = { ...s.config, taxRates: [...s.config.taxRates, rate] }; saveToStorage({ ...s, config }); return { config }; }),
  removeTaxRate: (id) => set(s => { const config = { ...s.config, taxRates: s.config.taxRates.filter(r => r.id !== id) }; saveToStorage({ ...s, config }); return { config }; }),

  setExpenses: (expenses) => set(s => { const config = { ...s.config, expenses }; saveToStorage({ ...s, config }); return { config }; }),
  addExpense: (expense) => set(s => { const config = { ...s.config, expenses: [...s.config.expenses, expense] }; saveToStorage({ ...s, config }); return { config }; }),
  removeExpense: (id) => set(s => { const config = { ...s.config, expenses: s.config.expenses.filter(e => e.id !== id) }; saveToStorage({ ...s, config }); return { config }; }),

  setProductCosts: (productCosts) => set(s => { const config = { ...s.config, productCosts }; saveToStorage({ ...s, config }); return { config }; }),
  addProductCost: (cost) => set(s => { const config = { ...s.config, productCosts: [...s.config.productCosts, cost] }; saveToStorage({ ...s, config }); return { config }; }),
  removeProductCost: (id) => set(s => { const config = { ...s.config, productCosts: s.config.productCosts.filter(c => c.id !== id) }; saveToStorage({ ...s, config }); return { config }; }),

  computeMetrics: (adSpend: number): FinancialMetrics => {
    const { orders, config } = get();
    const paid = orders.filter(o => o.status === "paid");
    const refunded = orders.filter(o => o.status === "refunded");
    const chargebacks = orders.filter(o => o.status === "chargeback");

    const grossRevenue = paid.reduce((s, o) => s + o.gross_revenue, 0);
    const netRevenue = paid.reduce((s, o) => s + o.net_revenue, 0);
    const totalOrders = paid.length;

    // Taxes
    const totalTaxes = config.taxRates.reduce((sum, tax) => {
      const base = tax.applies_to === "gross" ? grossRevenue : netRevenue;
      return sum + (base * tax.rate / 100);
    }, 0);

    // Expenses (monthly → daily approximation)
    const totalExpenses = config.expenses.reduce((sum, exp) => {
      if (exp.type === "fixed") return sum + exp.amount;
      return sum + exp.amount;
    }, 0);

    const profit = netRevenue - adSpend - totalTaxes - totalExpenses;
    const roi = adSpend > 0 ? (profit / adSpend) * 100 : 0;
    const roas = adSpend > 0 ? grossRevenue / adSpend : 0;
    const margin = grossRevenue > 0 ? (profit / grossRevenue) * 100 : 0;
    const arpu = totalOrders > 0 ? grossRevenue / totalOrders : 0;
    const refundRate = orders.length > 0 ? (refunded.length / orders.length) * 100 : 0;
    const chargebackRate = orders.length > 0 ? (chargebacks.length / orders.length) * 100 : 0;

    return {
      grossRevenue, netRevenue, totalOrders, refundRate, chargebackRate,
      profit, roi, roas, margin, arpu, totalTaxes, totalExpenses, totalAdSpend: adSpend,
    };
  },
}));

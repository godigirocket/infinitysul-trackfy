"use client";

import { useState } from "react";
import { useFinancialStore, Order } from "@/store/useFinancialStore";
import { formatCurrency } from "@/lib/formatters";
import { ShoppingCart, Plus, Trash2, Upload, CheckCircle, XCircle, Clock, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

const STATUS_CONFIG = {
  paid:        { label: "Pago",       color: "text-success bg-success/10 border-success/20",    icon: CheckCircle },
  refunded:    { label: "Reembolso",  color: "text-warning bg-warning/10 border-warning/20",    icon: XCircle },
  chargeback:  { label: "Chargeback", color: "text-danger bg-danger/10 border-danger/20",       icon: AlertTriangle },
  pending:     { label: "Pendente",   color: "text-muted bg-white/5 border-white/10",           icon: Clock },
  cancelled:   { label: "Cancelado",  color: "text-muted bg-white/5 border-white/10",           icon: XCircle },
};

function StatusBadge({ status }: { status: Order["status"] }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  return (
    <span className={cn("flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border", cfg.color)}>
      <cfg.icon className="w-3 h-3" />{cfg.label}
    </span>
  );
}

export default function OrdersPage() {
  const { orders, addOrder, removeOrder, updateOrderStatus } = useFinancialStore();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<Partial<Order>>({
    status: "paid", payment_method: "credit_card",
  });

  const totals = {
    gross: orders.filter(o => o.status === "paid").reduce((s, o) => s + o.gross_revenue, 0),
    net: orders.filter(o => o.status === "paid").reduce((s, o) => s + o.net_revenue, 0),
    count: orders.filter(o => o.status === "paid").length,
    refunds: orders.filter(o => o.status === "refunded").length,
  };

  const save = () => {
    if (!form.product_name || !form.gross_revenue) return;
    addOrder({
      order_id: form.order_id || `manual-${Date.now()}`,
      product_name: form.product_name || "",
      gross_revenue: Number(form.gross_revenue) || 0,
      net_revenue: Number(form.net_revenue) || Number(form.gross_revenue) * 0.9,
      gateway_fee: Number(form.gateway_fee) || 0,
      status: form.status || "paid",
      payment_method: form.payment_method || "credit_card",
      utm_source: form.utm_source,
      utm_campaign: form.utm_campaign,
      campaign_id: form.campaign_id,
      timestamp: form.timestamp || new Date().toISOString(),
    });
    setForm({ status: "paid", payment_method: "credit_card" });
    setShowForm(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Pedidos & Vendas</h1>
          <p className="text-sm text-muted mt-1">Gerencie vendas manuais ou recebidas via webhook.</p>
        </div>
        <button onClick={() => setShowForm(s => !s)}
          className="flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-xl text-sm font-bold hover:bg-accent/90 transition-all">
          <Plus className="w-4 h-4" /> Adicionar Pedido
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Faturamento Bruto", value: formatCurrency(totals.gross), color: "text-white" },
          { label: "Faturamento Líquido", value: formatCurrency(totals.net), color: "text-success" },
          { label: "Pedidos Pagos", value: String(totals.count), color: "text-accent" },
          { label: "Reembolsos", value: String(totals.refunds), color: "text-warning" },
        ].map(k => (
          <div key={k.label} className="glass p-4">
            <span className="text-[10px] font-bold text-muted uppercase tracking-wider block mb-1">{k.label}</span>
            <span className={cn("text-2xl font-black mono", k.color)}>{k.value}</span>
          </div>
        ))}
      </div>

      {/* Add form */}
      {showForm && (
        <div className="glass p-5 border border-accent/20 space-y-4">
          <h3 className="text-sm font-bold text-white">Novo Pedido Manual</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[
              { key: "order_id", label: "ID do Pedido", placeholder: "ORD-001" },
              { key: "product_name", label: "Produto *", placeholder: "Plano Premium" },
              { key: "gross_revenue", label: "Valor Bruto (R$) *", placeholder: "297.00", type: "number" },
              { key: "net_revenue", label: "Valor Líquido (R$)", placeholder: "267.30", type: "number" },
              { key: "gateway_fee", label: "Taxa Gateway (R$)", placeholder: "29.70", type: "number" },
              { key: "payment_method", label: "Método", placeholder: "credit_card" },
              { key: "utm_source", label: "utm_source", placeholder: "facebook" },
              { key: "utm_campaign", label: "utm_campaign", placeholder: "campanha-abc" },
              { key: "campaign_id", label: "Campaign ID", placeholder: "123456789" },
            ].map(f => (
              <div key={f.key} className="space-y-1">
                <label className="text-[10px] font-bold text-muted uppercase">{f.label}</label>
                <input type={f.type || "text"} value={(form as any)[f.key] || ""}
                  onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                  placeholder={f.placeholder}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-accent" />
              </div>
            ))}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted uppercase">Status</label>
              <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value as any }))}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none">
                {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={save} className="px-4 py-2 bg-success text-white rounded-xl text-sm font-bold hover:bg-success/90">Salvar</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-white/10 text-muted rounded-xl text-sm font-bold hover:bg-white/20">Cancelar</button>
          </div>
        </div>
      )}

      {/* Orders table */}
      <div className="glass overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/5 bg-white/[0.02]">
                {["Produto", "Bruto", "Líquido", "Status", "Método", "UTM Source", "Data", ""].map(h => (
                  <th key={h} className="px-4 py-3 text-[10px] font-bold text-muted uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.03]">
              {orders.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-12 text-center text-muted text-sm">
                  Nenhum pedido. Adicione manualmente ou configure um webhook.
                </td></tr>
              ) : orders.map(o => (
                <tr key={o.order_id} className="hover:bg-white/[0.02] transition-all">
                  <td className="px-4 py-3 text-sm font-bold text-white">{o.product_name}</td>
                  <td className="px-4 py-3 text-sm mono">{formatCurrency(o.gross_revenue)}</td>
                  <td className="px-4 py-3 text-sm mono text-success">{formatCurrency(o.net_revenue)}</td>
                  <td className="px-4 py-3"><StatusBadge status={o.status} /></td>
                  <td className="px-4 py-3 text-xs text-muted">{o.payment_method}</td>
                  <td className="px-4 py-3 text-xs text-muted">{o.utm_source || "—"}</td>
                  <td className="px-4 py-3 text-xs text-muted">{new Date(o.timestamp).toLocaleDateString("pt-BR")}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => removeOrder(o.order_id)} className="text-muted hover:text-danger transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

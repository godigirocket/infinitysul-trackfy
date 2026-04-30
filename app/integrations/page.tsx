"use client";

import { useState } from "react";
import { Plug, Copy, Check, ExternalLink, Zap, ShoppingCart, CreditCard, Globe } from "lucide-react";

const BASE = typeof window !== "undefined" ? window.location.origin : "https://infinitysul-trackfy.vercel.app";

const INTEGRATIONS = [
  {
    id: "stripe",
    name: "Stripe",
    icon: CreditCard,
    color: "text-purple-400",
    bg: "bg-purple-500/10 border-purple-500/20",
    description: "Sincronize pagamentos e assinaturas automaticamente.",
    webhook: `${BASE}/api/webhook?source=stripe`,
    docs: "https://stripe.com/docs/webhooks",
    events: ["payment_intent.succeeded", "charge.refunded", "charge.dispute.created"],
  },
  {
    id: "hotmart",
    name: "Hotmart",
    icon: Zap,
    color: "text-orange-400",
    bg: "bg-orange-500/10 border-orange-500/20",
    description: "Capture vendas de produtos digitais da Hotmart.",
    webhook: `${BASE}/api/webhook?source=hotmart`,
    docs: "https://developers.hotmart.com/docs/pt-BR/v1/webhooks/",
    events: ["PURCHASE_APPROVED", "PURCHASE_REFUNDED", "PURCHASE_CHARGEBACK"],
  },
  {
    id: "kiwify",
    name: "Kiwify",
    icon: Zap,
    color: "text-green-400",
    bg: "bg-green-500/10 border-green-500/20",
    description: "Integre vendas da Kiwify ao seu dashboard.",
    webhook: `${BASE}/api/webhook?source=kiwify`,
    docs: "https://docs.kiwify.com.br/webhooks",
    events: ["order.paid", "order.refunded"],
  },
  {
    id: "shopify",
    name: "Shopify",
    icon: ShoppingCart,
    color: "text-green-300",
    bg: "bg-emerald-500/10 border-emerald-500/20",
    description: "Sincronize pedidos da sua loja Shopify.",
    webhook: `${BASE}/api/webhook?source=shopify`,
    docs: "https://shopify.dev/docs/apps/webhooks",
    events: ["orders/paid", "refunds/create"],
  },
  {
    id: "generic",
    name: "Webhook Genérico",
    icon: Globe,
    color: "text-accent",
    bg: "bg-accent/10 border-accent/20",
    description: "Qualquer plataforma via POST JSON.",
    webhook: `${BASE}/api/webhook?source=generic`,
    docs: "#",
    events: ["POST com order_id, amount, status"],
  },
];

export default function IntegrationsPage() {
  const [copied, setCopied] = useState<string | null>(null);

  const copy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Integrações</h1>
        <p className="text-sm text-muted mt-1">Conecte suas plataformas de venda para sincronizar pedidos automaticamente.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {INTEGRATIONS.map(intg => (
          <div key={intg.id} className={`glass p-5 border space-y-4 ${intg.bg}`}>
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${intg.bg}`}>
                <intg.icon className={`w-5 h-5 ${intg.color}`} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">{intg.name}</h3>
                <p className="text-[10px] text-muted">{intg.description}</p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-muted uppercase tracking-wider">Webhook URL</label>
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-black/30 rounded-lg px-2.5 py-1.5 text-[10px] text-accent font-mono truncate">
                  {intg.webhook}
                </code>
                <button onClick={() => copy(intg.webhook, intg.id)} className="p-1.5 bg-white/10 rounded-lg hover:bg-white/20 transition-all flex-shrink-0">
                  {copied === intg.id ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5 text-muted" />}
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted uppercase tracking-wider">Eventos suportados</label>
              <div className="flex flex-wrap gap-1">
                {intg.events.map(e => (
                  <span key={e} className="text-[9px] font-mono px-2 py-0.5 bg-white/5 border border-white/10 rounded text-muted">{e}</span>
                ))}
              </div>
            </div>

            {intg.docs !== "#" && (
              <a href={intg.docs} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-[10px] text-accent hover:underline">
                <ExternalLink className="w-3 h-3" /> Ver documentação
              </a>
            )}
          </div>
        ))}
      </div>

      <div className="glass p-5 border border-white/5 space-y-3">
        <h3 className="text-sm font-bold text-white">Formato do Webhook Genérico</h3>
        <div className="bg-black/40 rounded-xl p-4 font-mono text-xs text-green-400 overflow-x-auto">
          <pre>{JSON.stringify({
            order_id: "ORD-001",
            product_name: "Plano Premium",
            gross_revenue: 297.00,
            net_revenue: 267.30,
            gateway_fee: 29.70,
            status: "paid",
            payment_method: "credit_card",
            utm_source: "facebook",
            utm_campaign: "campanha-abc",
            campaign_id: "123456789",
            fbclid: "IwAR...",
            timestamp: "2024-01-15T10:30:00Z"
          }, null, 2)}</pre>
        </div>
      </div>
    </div>
  );
}

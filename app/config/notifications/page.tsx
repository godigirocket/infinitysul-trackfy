"use client";

import { useState } from "react";
import { Bell, MessageCircle, Mail, Webhook } from "lucide-react";

export default function NotificationsPage() {
  const [config, setConfig] = useState({
    whatsapp: { enabled: false, number: "" },
    email: { enabled: false, address: "" },
    webhook: { enabled: false, url: "" },
    triggers: {
      high_cpl: true,
      high_frequency: true,
      zero_conversions: true,
      new_order: false,
      refund: true,
      chargeback: true,
    },
  });

  const toggle = (key: string) => setConfig(p => ({ ...p, triggers: { ...p.triggers, [key]: !(p.triggers as any)[key] } }));

  const TRIGGERS = [
    { key: "high_cpl", label: "CPL acima da média", desc: "Quando uma campanha ultrapassa 150% do CPL médio" },
    { key: "high_frequency", label: "Frequência alta", desc: "Quando frequência > 3.5 em qualquer campanha" },
    { key: "zero_conversions", label: "Zero conversões", desc: "Campanha gastando sem converter" },
    { key: "new_order", label: "Nova venda", desc: "Cada pedido recebido via webhook" },
    { key: "refund", label: "Reembolso", desc: "Quando um pedido é reembolsado" },
    { key: "chargeback", label: "Chargeback", desc: "Quando um chargeback é registrado" },
  ];

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-3">
          <Bell className="w-6 h-6 text-accent" /> Notificações
        </h1>
        <p className="text-sm text-muted mt-1">Configure alertas por WhatsApp, e-mail ou webhook.</p>
      </div>

      {/* Channels */}
      <div className="glass p-5 space-y-5">
        <h2 className="text-sm font-bold text-white">Canais de Notificação</h2>
        {[
          { key: "whatsapp", label: "WhatsApp", icon: MessageCircle, placeholder: "+55 11 99999-9999", field: "number" },
          { key: "email", label: "E-mail", icon: Mail, placeholder: "seu@email.com", field: "address" },
          { key: "webhook", label: "Webhook", icon: Webhook, placeholder: "https://...", field: "url" },
        ].map(ch => (
          <div key={ch.key} className="flex items-center gap-4">
            <button onClick={() => setConfig(p => ({ ...p, [ch.key]: { ...(p as any)[ch.key], enabled: !(p as any)[ch.key].enabled } }))}
              className={`w-10 h-6 rounded-full relative transition-colors flex-shrink-0 ${(config as any)[ch.key].enabled ? "bg-success" : "bg-white/20"}`}>
              <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${(config as any)[ch.key].enabled ? "left-5" : "left-1"}`} />
            </button>
            <ch.icon className="w-4 h-4 text-muted flex-shrink-0" />
            <input
              value={(config as any)[ch.key][(ch as any).field]}
              onChange={e => setConfig(p => ({ ...p, [ch.key]: { ...(p as any)[ch.key], [(ch as any).field]: e.target.value } }))}
              placeholder={ch.placeholder}
              disabled={!(config as any)[ch.key].enabled}
              className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-accent disabled:opacity-40"
            />
          </div>
        ))}
      </div>

      {/* Triggers */}
      <div className="glass p-5 space-y-4">
        <h2 className="text-sm font-bold text-white">Gatilhos</h2>
        <div className="space-y-3">
          {TRIGGERS.map(t => (
            <div key={t.key} className="flex items-center justify-between py-2 border-b border-white/[0.03] last:border-0">
              <div>
                <p className="text-sm font-bold text-white">{t.label}</p>
                <p className="text-[10px] text-muted">{t.desc}</p>
              </div>
              <button onClick={() => toggle(t.key)}
                className={`w-10 h-6 rounded-full relative transition-colors flex-shrink-0 ${(config.triggers as any)[t.key] ? "bg-success" : "bg-white/20"}`}>
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${(config.triggers as any)[t.key] ? "left-5" : "left-1"}`} />
              </button>
            </div>
          ))}
        </div>
      </div>

      <button className="w-full py-3 bg-accent text-white rounded-xl font-bold hover:bg-accent/90 transition-all">
        Salvar Configurações
      </button>
    </div>
  );
}

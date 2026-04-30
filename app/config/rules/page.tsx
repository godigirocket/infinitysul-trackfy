"use client";

import { useState } from "react";
import { GitBranch, Plus, Trash2, Zap } from "lucide-react";

interface Rule {
  id: string;
  name: string;
  condition: string;
  threshold: number;
  action: string;
  enabled: boolean;
}

const DEFAULT_RULES: Rule[] = [
  { id: "r1", name: "Pausar CPL alto", condition: "cpl_above_avg", threshold: 150, action: "pause_campaign", enabled: true },
  { id: "r2", name: "Alerta frequência", condition: "frequency_above", threshold: 3.5, action: "notify", enabled: true },
  { id: "r3", name: "Escalar CPL baixo", condition: "cpl_below_avg", threshold: 70, action: "notify_scale", enabled: false },
];

export default function RulesPage() {
  const [rules, setRules] = useState<Rule[]>(DEFAULT_RULES);
  const [form, setForm] = useState({ name: "", condition: "cpl_above_avg", threshold: "", action: "notify" });

  const CONDITIONS = [
    { value: "cpl_above_avg", label: "CPL acima da média (%)" },
    { value: "cpl_below_avg", label: "CPL abaixo da média (%)" },
    { value: "frequency_above", label: "Frequência acima de" },
    { value: "spend_above", label: "Gasto acima de (R$)" },
    { value: "convs_zero", label: "Zero conversas com gasto acima de (R$)" },
  ];

  const ACTIONS = [
    { value: "notify", label: "Notificar no dashboard" },
    { value: "pause_campaign", label: "Pausar campanha (manual)" },
    { value: "notify_scale", label: "Sugerir escalar" },
  ];

  const add = () => {
    if (!form.name || !form.threshold) return;
    setRules(p => [...p, { id: `r-${Date.now()}`, name: form.name, condition: form.condition, threshold: parseFloat(form.threshold), action: form.action, enabled: true }]);
    setForm({ name: "", condition: "cpl_above_avg", threshold: "", action: "notify" });
  };

  const toggle = (id: string) => setRules(p => p.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r));
  const remove = (id: string) => setRules(p => p.filter(r => r.id !== id));

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-3">
          <GitBranch className="w-6 h-6 text-accent" /> Regras Automáticas
        </h1>
        <p className="text-sm text-muted mt-1">Configure alertas e ações automáticas baseadas em métricas.</p>
      </div>

      <div className="glass p-5 space-y-4">
        <h2 className="text-sm font-bold text-white">Nova Regra</h2>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1 col-span-2">
            <label className="text-[10px] font-bold text-muted uppercase">Nome da Regra</label>
            <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              placeholder="Ex: Pausar quando CPL > 150%" className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-accent" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted uppercase">Condição</label>
            <select value={form.condition} onChange={e => setForm(p => ({ ...p, condition: e.target.value }))}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none">
              {CONDITIONS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted uppercase">Valor Limite</label>
            <input type="number" value={form.threshold} onChange={e => setForm(p => ({ ...p, threshold: e.target.value }))}
              placeholder="150" className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-accent" />
          </div>
          <div className="space-y-1 col-span-2">
            <label className="text-[10px] font-bold text-muted uppercase">Ação</label>
            <select value={form.action} onChange={e => setForm(p => ({ ...p, action: e.target.value }))}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none">
              {ACTIONS.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
            </select>
          </div>
        </div>
        <button onClick={add} className="flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-xl text-sm font-bold hover:bg-accent/90">
          <Plus className="w-4 h-4" /> Criar Regra
        </button>
      </div>

      <div className="glass overflow-hidden">
        <div className="p-4 border-b border-white/5 flex items-center gap-2">
          <Zap className="w-4 h-4 text-accent" />
          <h2 className="text-sm font-bold text-white">Regras Ativas</h2>
        </div>
        <div className="divide-y divide-white/[0.03]">
          {rules.map(r => (
            <div key={r.id} className="flex items-center justify-between px-4 py-3 hover:bg-white/[0.02]">
              <div className="flex items-center gap-3">
                <button onClick={() => toggle(r.id)}
                  className={`w-9 h-5 rounded-full relative transition-colors ${r.enabled ? "bg-success" : "bg-white/20"}`}>
                  <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${r.enabled ? "left-4.5" : "left-0.5"}`} />
                </button>
                <div>
                  <span className="text-sm font-bold text-white">{r.name}</span>
                  <p className="text-[10px] text-muted">
                    {CONDITIONS.find(c => c.value === r.condition)?.label} {r.threshold} → {ACTIONS.find(a => a.value === r.action)?.label}
                  </p>
                </div>
              </div>
              <button onClick={() => remove(r.id)} className="text-muted hover:text-danger transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

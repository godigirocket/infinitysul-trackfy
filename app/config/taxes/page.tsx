"use client";

import { useState } from "react";
import { useFinancialStore, TaxRate } from "@/store/useFinancialStore";
import { Receipt, Plus, Trash2 } from "lucide-react";

export default function TaxesPage() {
  const { config, addTaxRate, removeTaxRate } = useFinancialStore();
  const [form, setForm] = useState({ name: "", rate: "", applies_to: "gross" as "gross" | "net" });

  const save = () => {
    if (!form.name || !form.rate) return;
    addTaxRate({ id: `tax-${Date.now()}`, name: form.name, rate: parseFloat(form.rate), applies_to: form.applies_to });
    setForm({ name: "", rate: "", applies_to: "gross" });
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-3">
          <Receipt className="w-6 h-6 text-accent" /> Impostos
        </h1>
        <p className="text-sm text-muted mt-1">Configure as alíquotas de impostos aplicadas ao faturamento.</p>
      </div>

      <div className="glass p-5 space-y-4">
        <h2 className="text-sm font-bold text-white">Adicionar Imposto</h2>
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted uppercase">Nome</label>
            <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              placeholder="Simples Nacional" className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-accent" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted uppercase">Alíquota (%)</label>
            <input type="number" value={form.rate} onChange={e => setForm(p => ({ ...p, rate: e.target.value }))}
              placeholder="6.0" className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-accent" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted uppercase">Base de Cálculo</label>
            <select value={form.applies_to} onChange={e => setForm(p => ({ ...p, applies_to: e.target.value as any }))}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none">
              <option value="gross">Faturamento Bruto</option>
              <option value="net">Faturamento Líquido</option>
            </select>
          </div>
        </div>
        <button onClick={save} className="flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-xl text-sm font-bold hover:bg-accent/90">
          <Plus className="w-4 h-4" /> Adicionar
        </button>
      </div>

      <div className="glass overflow-hidden">
        <div className="p-4 border-b border-white/5">
          <h2 className="text-sm font-bold text-white">Impostos Configurados</h2>
        </div>
        {config.taxRates.length === 0 ? (
          <p className="p-6 text-center text-muted text-sm">Nenhum imposto configurado.</p>
        ) : (
          <div className="divide-y divide-white/[0.03]">
            {config.taxRates.map(t => (
              <div key={t.id} className="flex items-center justify-between px-4 py-3 hover:bg-white/[0.02]">
                <div>
                  <span className="text-sm font-bold text-white">{t.name}</span>
                  <span className="text-xs text-muted ml-3">{t.rate}% sobre {t.applies_to === "gross" ? "bruto" : "líquido"}</span>
                </div>
                <button onClick={() => removeTaxRate(t.id)} className="text-muted hover:text-danger transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

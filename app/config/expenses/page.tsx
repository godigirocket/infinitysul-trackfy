"use client";

import { useState } from "react";
import { useFinancialStore } from "@/store/useFinancialStore";
import { Wallet, Plus, Trash2 } from "lucide-react";
import { formatCurrency } from "@/lib/formatters";

export default function ExpensesPage() {
  const { config, addExpense, removeExpense } = useFinancialStore();
  const [form, setForm] = useState({ name: "", amount: "", type: "fixed" as "fixed" | "variable", period: "monthly" as "monthly" | "daily" | "per_sale" });

  const save = () => {
    if (!form.name || !form.amount) return;
    addExpense({ id: `exp-${Date.now()}`, name: form.name, amount: parseFloat(form.amount), type: form.type, period: form.period });
    setForm({ name: "", amount: "", type: "fixed", period: "monthly" });
  };

  const total = config.expenses.reduce((s, e) => s + e.amount, 0);

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-3">
          <Wallet className="w-6 h-6 text-accent" /> Despesas
        </h1>
        <p className="text-sm text-muted mt-1">Registre despesas fixas e variáveis para cálculo de lucro real.</p>
      </div>

      <div className="glass p-5 space-y-4">
        <h2 className="text-sm font-bold text-white">Adicionar Despesa</h2>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted uppercase">Nome</label>
            <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              placeholder="Ferramenta SaaS, Funcionário..." className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-accent" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted uppercase">Valor (R$)</label>
            <input type="number" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))}
              placeholder="500.00" className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-accent" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted uppercase">Tipo</label>
            <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value as any }))}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none">
              <option value="fixed">Fixo</option>
              <option value="variable">Variável</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted uppercase">Período</label>
            <select value={form.period} onChange={e => setForm(p => ({ ...p, period: e.target.value as any }))}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none">
              <option value="monthly">Mensal</option>
              <option value="daily">Diário</option>
              <option value="per_sale">Por Venda</option>
            </select>
          </div>
        </div>
        <button onClick={save} className="flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-xl text-sm font-bold hover:bg-accent/90">
          <Plus className="w-4 h-4" /> Adicionar
        </button>
      </div>

      <div className="glass overflow-hidden">
        <div className="p-4 border-b border-white/5 flex items-center justify-between">
          <h2 className="text-sm font-bold text-white">Despesas Registradas</h2>
          <span className="text-sm font-bold text-warning mono">Total: {formatCurrency(total)}</span>
        </div>
        {config.expenses.length === 0 ? (
          <p className="p-6 text-center text-muted text-sm">Nenhuma despesa registrada.</p>
        ) : (
          <div className="divide-y divide-white/[0.03]">
            {config.expenses.map(e => (
              <div key={e.id} className="flex items-center justify-between px-4 py-3 hover:bg-white/[0.02]">
                <div>
                  <span className="text-sm font-bold text-white">{e.name}</span>
                  <span className="text-xs text-muted ml-3">{e.type === "fixed" ? "Fixo" : "Variável"} • {e.period === "monthly" ? "Mensal" : e.period === "daily" ? "Diário" : "Por venda"}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold mono text-warning">{formatCurrency(e.amount)}</span>
                  <button onClick={() => removeExpense(e.id)} className="text-muted hover:text-danger transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

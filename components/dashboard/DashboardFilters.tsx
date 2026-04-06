"use client";

import { useAppStore } from "@/store/useAppStore";
import { Search, Filter, X } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export function DashboardFilters() {
  const { 
    searchQuery, setSearchQuery, 
    statusFilter, setStatusFilter,
    selectedCampaigns, setSelectedCampaigns,
    targetCPA, setTargetCPA,
    productPrice, setProductPrice,
    monthlyBudget, setMonthlyBudget,
    dataA 
  } = useAppStore();

  const handleClear = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setSelectedCampaigns([]);
  };

  const hasFilters = searchQuery || statusFilter !== "all" || selectedCampaigns.length > 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-4 bg-white/5 p-4 rounded-xl border border-white/10 backdrop-blur-md">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          <input
            type="text"
            placeholder="Buscar campanhas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all font-medium"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all font-bold uppercase tracking-tighter"
        >
          <option value="all" className="bg-[#0a0a0c]">Todos Status</option>
          <option value="active" className="bg-[#0a0a0c]">🟢 Ativas</option>
          <option value="paused" className="bg-[#0a0a0c]">⚪ Pausadas</option>
        </select>

        {hasFilters && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleClear}
            className="h-9 px-3 text-[11px] font-bold uppercase transition-all hover:bg-white/5 border-dashed"
          >
            <X className="w-3 h-3 mr-2" />
            Limpar
          </Button>
        )}
      </div>

      {/* Advanced Config Row */}
      <div className="flex flex-wrap items-center gap-4 px-2">
        <div className="flex flex-col gap-1">
          <label className="text-[9px] font-bold text-muted uppercase ml-1">Meta CPA (R$)</label>
          <input
            type="number"
            value={targetCPA}
            onChange={(e) => setTargetCPA(parseFloat(e.target.value))}
            className="w-24 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs focus:ring-1 focus:ring-accent outline-none font-bold"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[9px] font-bold text-muted uppercase ml-1">Preço Ticket (R$)</label>
          <input
            type="number"
            value={productPrice}
            onChange={(e) => setProductPrice(parseFloat(e.target.value))}
            className="w-24 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs focus:ring-1 focus:ring-accent outline-none font-bold"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[9px] font-bold text-muted uppercase ml-1">Verba Mensal (R$)</label>
          <input
            type="number"
            value={monthlyBudget}
            onChange={(e) => setMonthlyBudget(parseFloat(e.target.value))}
            className="w-32 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs focus:ring-1 focus:ring-accent outline-none font-bold"
          />
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState, useRef, useEffect } from "react";
import { Search, Filter, ChevronDown, Check, X, Shield, Target, Tag, Globe, Users } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { cn } from "@/lib/utils";

// --- Sub-component: FilterPill ---
interface FilterPillProps {
  label: string;
  icon: any;
  options: { id: string; name: string }[];
  selected: string[];
  onChange: (vals: string[]) => void;
  showSearch?: boolean;
}

function FilterPill({ label, icon: Icon, options, selected, onChange, showSearch = true }: FilterPillProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  const toggle = (id: string) => {
    if (selected.includes(id)) {
      onChange(selected.filter(s => s !== id));
    } else {
      onChange([...selected, id]);
    }
  };

  const filtered = options.filter(o => o.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-2 px-3 py-1.5 rounded-full border text-[11px] font-bold transition-all",
          selected.length > 0
            ? "bg-accent/10 border-accent text-accent"
            : "bg-white/5 border-white/10 text-muted hover:bg-white/10 hover:text-white"
        )}
      >
        <Icon className="w-3.5 h-3.5" />
        <span>{label}</span>
        {selected.length > 0 && (
          <span className="flex items-center justify-center w-4 h-4 rounded-full bg-accent text-[9px] text-white">
            {selected.length}
          </span>
        )}
        <ChevronDown className={cn("w-3 h-3 transition-transform", isOpen && "rotate-180")} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 z-50 w-72 glass border border-white/10 shadow-2xl rounded-xl p-2 animate-in fade-in slide-in-from-top-2 duration-150">
          {showSearch && (
            <div className="relative mb-2">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input
                autoFocus
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar..."
                className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-accent"
              />
            </div>
          )}
          
          <div className="max-h-60 overflow-y-auto space-y-1 custom-scrollbar">
            {filtered.length === 0 && (
              <p className="text-[10px] text-muted p-4 text-center">Nenhum resultado encontrado.</p>
            )}
            {filtered.map(opt => (
              <button
                key={opt.id}
                onClick={() => toggle(opt.id)}
                className={cn(
                  "w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-colors text-left",
                  selected.includes(opt.id) ? "bg-accent/10 text-accent font-bold" : "text-muted hover:bg-white/5 hover:text-white"
                )}
              >
                <span className="truncate pr-4">{opt.name}</span>
                {selected.includes(opt.id) && <Check className="w-3.5 h-3.5" />}
              </button>
            ))}
          </div>

          {selected.length > 0 && (
            <div className="mt-2 pt-2 border-t border-white/5 flex items-center justify-between px-2">
              <button 
                onClick={() => onChange([])}
                className="text-[10px] font-bold text-muted hover:text-white uppercase tracking-widest"
              >
                Limpar
              </button>
              <button 
                onClick={() => setIsOpen(false)}
                className="text-[10px] font-bold text-accent hover:text-accent/80 uppercase tracking-widest"
              >
                Pronto
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// --- Main: ControlBar ---
export function ControlBar() {
  const { 
    hierarchy, 
    selectedCampaigns, setSelectedCampaigns,
    selectedAdSets, setSelectedAdSets,
    selectedAds, setSelectedAds,
    statusFilters, setStatusFilters,
    objectiveFilters, setObjectiveFilters,
    placementFilters, setPlacementFilters
  } = useAppStore();

  if (!hierarchy) return null;

  return (
    <div className="sticky top-0 z-40 w-full bg-background/80 backdrop-blur-md border-b border-white/5 py-4 px-8 animate-in fade-in slide-in-from-top-4 duration-500">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 pr-4 border-r border-white/10 mr-1">
          <Filter className="w-4 h-4 text-accent" />
          <span className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Filtros Operacionais</span>
        </div>

        {/* Global Search Interface */}
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input 
            type="text" 
            placeholder="Pesquisar por ID, Nome ou Status..."
            className="w-full bg-white/5 border border-white/5 rounded-full pl-10 pr-4 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-accent/50 transition-all placeholder:text-muted/50"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 ml-auto">
          {/* Status Filter */}
          <FilterPill
            label="Veiculação"
            icon={Shield}
            options={[
              { id: "ACTIVE", name: "Ativo" },
              { id: "PAUSED", name: "Pausado" },
              { id: "ERROR", name: "Erro de Veiculação" },
              { id: "LEARNING", name: "Em Aprendizado" },
              { id: "OFF", name: "Desativado" },
            ]}
            selected={statusFilters}
            onChange={setStatusFilters}
            showSearch={false}
          />

          {/* Campaign Filter */}
          <FilterPill
            label="Campanhas"
            icon={Target}
            options={hierarchy.campaigns.map(c => ({ id: c.id, name: c.name }))}
            selected={selectedCampaigns}
            onChange={setSelectedCampaigns}
          />

          {/* AdSet Filter */}
          <FilterPill
            label="Conjuntos"
            icon={Tag}
            options={hierarchy.adsets.map(c => ({ id: c.id, name: c.name }))}
            selected={selectedAdSets}
            onChange={setSelectedAdSets}
          />

          {/* Placement Filter */}
          <FilterPill
            label="Posicionamento"
            icon={Globe}
            options={[
              { id: "facebook", name: "Facebook Feed" },
              { id: "instagram", name: "Instagram Feed" },
              { id: "messenger", name: "Messenger" },
              { id: "stories", name: "Stories" },
              { id: "reels", name: "Reels" },
              { id: "audience_network", name: "Audience Network" },
            ]}
            selected={placementFilters}
            onChange={setPlacementFilters}
            showSearch={false}
          />

          {/* Objective Filter */}
          <FilterPill
            label="Objetivo"
            icon={Check}
            options={[
              { id: "OUTCOME_LEADS", name: "Geração de Leads" },
              { id: "OUTCOME_MESSAGING", name: "Mensagens" },
              { id: "OUTCOME_SALES", name: "Vendas" },
              { id: "OUTCOME_ENGAGEMENT", name: "Engajamento" },
              { id: "OUTCOME_TRAFFIC", name: "Tráfego" },
            ]}
            selected={objectiveFilters}
            onChange={setObjectiveFilters}
            showSearch={false}
          />

          {/* Global Reset */}
          {(selectedCampaigns.length > 0 || selectedAdSets.length > 0 || statusFilters.length > 0 || placementFilters.length > 0 || objectiveFilters.length > 0) && (
            <button
              onClick={() => {
                setSelectedCampaigns([]);
                setSelectedAdSets([]);
                setStatusFilters([]);
                setPlacementFilters([]);
                setObjectiveFilters([]);
              }}
              className="px-3 py-1.5 text-[10px] font-bold text-accent hover:text-white uppercase tracking-widest transition-all"
            >
              Resetar Tudo
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

"use client";

import { useMetaData } from "@/hooks/useMetaData";
import { CampaignsTable } from "@/components/campaigns/CampaignsTable";
import { AdModal } from "@/components/campaigns/AdModal";
import { useState } from "react";
import { Megaphone, Search, Filter } from "lucide-react";
import { Input } from "@/components/ui/Input";

export default function CampaignsPage() {
  const { refresh } = useMetaData();
  const [selectedCampaign, setSelectedCampaign] = useState<{ id: string; name: string } | null>(null);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Performance de Campanhas</h1>
          <p className="text-sm text-muted">Visualize criativos e métricas granulares.</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          <Input 
            placeholder="Filtrar por nome ou ID..." 
            className="pl-10 h-10 border-border bg-surface/50 font-medium"
          />
        </div>
        <div className="relative flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted" />
            <span className="text-xs font-bold text-muted uppercase">Filtros Avançados</span>
        </div>
      </div>

      <div 
         onClick={(e) => {
           const row = (e.target as HTMLElement).closest("tr");
           if (row && row.hasAttribute("onclick")) return; // Skip if it's the AI button
           const name = row?.querySelector("span.truncate")?.textContent;
           const id = row?.querySelector("span.tabular-nums")?.textContent?.replace("ID: ", "");
           if (id && name) setSelectedCampaign({ id, name });
         }}
      >
        <CampaignsTable />
      </div>

      <AdModal 
        id={selectedCampaign?.id || ""} 
        name={selectedCampaign?.name || ""} 
        isOpen={!!selectedCampaign} 
        onClose={() => setSelectedCampaign(null)} 
      />
    </div>
  );
}

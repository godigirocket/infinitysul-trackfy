"use client";

import { useEffect, useState } from "react";
import { useAppStore } from "@/store/useAppStore";
import { fetchMetaInsights, fetchAdCreatives } from "@/services/metaApi";
import { 
  formatCurrency, 
  formatPercent, 
  extractMetric 
} from "@/lib/formatters";
import { 
  X, 
  ImageIcon, 
  ChevronRight, 
  Activity, 
  Info,
  ExternalLink 
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/components/ui/Button";

interface AdModalProps {
  id: string;
  name: string;
  isOpen: boolean;
  onClose: () => void;
}

export function AdModal({ id, name, isOpen, onClose }: AdModalProps) {
  const { token, period, customStart, customEnd } = useAppStore();
  const [ads, setAds] = useState<any[]>([]);
  const [creatives, setCreatives] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && id && token) {
      const load = async () => {
        setLoading(true);
        try {
          const data = await fetchMetaInsights(id, token, {
            level: "ad",
            campaignId: id,
            period,
            customStart,
            customEnd,
          });
          setAds(data);

          // Fetch creatives for each ad
          data.forEach(async (ad: any) => {
            const cr = await fetchAdCreatives(ad.ad_id, token);
            if (cr) setCreatives((prev) => ({ ...prev, [ad.ad_id]: cr }));
          });
        } catch (e) {
          console.error(e);
        } finally {
          setLoading(false);
        }
      };
      load();
    }
  }, [isOpen, id, token, period, customStart, customEnd]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
      <div className="glass w-full max-w-5xl max-h-[85vh] flex flex-col shadow-2xl relative overflow-hidden border-white/10">
        {/* Header */}
        <div className="px-8 py-6 border-b border-white/5 flex items-center justify-between bg-white/[0.01]">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h3 className="text-lg font-bold tracking-tight">{name}</h3>
              <Badge variant="secondary" className="mono px-2 py-0.5 text-[10px]">AD LEVEL</Badge>
            </div>
            <p className="text-[11px] text-muted font-medium uppercase tracking-wider">Detalhamento por Anúncio Individual</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2.5 rounded-full bg-white/5 hover:bg-white/10 text-muted hover:text-text transition-all rotate-0 hover:rotate-90 group"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8">
          <div className="space-y-6">
            {loading ? (
              <div className="py-20 flex flex-col items-center justify-center gap-4">
                <div className="w-10 h-10 border-4 border-accent/20 border-t-accent rounded-full animate-spin" />
                <p className="text-xs font-bold text-muted uppercase tracking-widest">Sincronizando Anúncios...</p>
              </div>
            ) : ads.length === 0 ? (
              <div className="py-20 text-center glass border-dashed bg-transparent">
                <Info className="w-10 h-10 text-muted/20 mx-auto mb-4" />
                <p className="text-sm text-muted font-bold">Nenhum anúncio ativo encontrado.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {ads.map((ad) => {
                  const cr = creatives[ad.ad_id];
                  const ctr = ad.impressions ? (ad.clicks / ad.impressions * 100) : 0;
                  const leads = extractMetric(ad.actions, ['lead']);

                  return (
                    <div 
                      key={ad.ad_id} 
                      className="glass p-5 flex items-center gap-8 transition-all hover:bg-white/5 hover:border-white/10 group bg-transparent"
                    >
                      <div className="w-24 h-24 rounded-xl bg-background border border-border flex items-center justify-center overflow-hidden shrink-0 shadow-lg relative">
                        {cr?.thumbnail_url ? (
                          <img src={cr.thumbnail_url} alt="" className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                        ) : (
                          <ImageIcon className="w-6 h-6 text-muted/20" />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                           <ExternalLink className="w-3 h-3 text-white ml-auto" />
                        </div>
                      </div>

                      <div className="flex-1 min-w-0 space-y-3">
                        <div>
                          <h4 className="text-sm font-bold truncate mb-1">{ad.ad_name}</h4>
                          <p className="text-[11px] text-muted font-medium line-clamp-2 italic leading-relaxed">
                            {cr?.body || "Buscando texto do criativo..."}
                          </p>
                        </div>
                        <div className="flex items-center gap-4">
                          <Badge variant="outline" className="h-5 px-1.5 text-[9px] font-bold text-muted-foreground uppercase">Ativo</Badge>
                          <div className="w-px h-3 bg-white/5" />
                          <div className="flex items-center gap-2">
                             <Activity className="w-3 h-3 text-accent" />
                             <span className="text-[10px] font-bold mono">Freq: {parseFloat(ad.frequency || "0").toFixed(1)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-4 gap-12 tabular-nums">
                        <div className="flex flex-col gap-1 items-end">
                           <span className="text-[10px] font-bold text-muted uppercase">Gasto</span>
                           <span className="text-sm font-bold mono">{formatCurrency(parseFloat(ad.spend || "0"))}</span>
                        </div>
                        <div className="flex flex-col gap-1 items-end">
                           <span className="text-[10px] font-bold text-muted uppercase">CTR</span>
                           <span className="text-sm font-bold mono text-muted">{ctr.toFixed(2)}%</span>
                        </div>
                        <div className="flex flex-col gap-1 items-end">
                           <span className="text-[10px] font-bold text-muted uppercase">Leads</span>
                           <span className="text-sm font-bold mono text-accent">{leads}</span>
                        </div>
                        <div className="flex flex-col gap-1 items-end">
                           <span className="text-[10px] font-bold text-muted uppercase">CPL</span>
                           <span className="text-sm font-bold mono">{formatCurrency(leads > 0 ? parseFloat(ad.spend || "0") / leads : 0)}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-8 border-t border-white/5 bg-white/[0.01] flex items-center justify-between">
           <p className="text-[10px] text-muted font-medium max-w-sm italic">
             Métricas carregadas dinamicamente via Graph API v19.0. Thumbnails e textos de criativos sujeitos a cache local de 1 hora.
           </p>
           <Button onClick={onClose} size="sm" className="font-bold px-8 h-9 shadow-lg">Fechar Painel</Button>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useAppStore } from "@/store/useAppStore";
import { X, TrendingUp, Users, Map, Clock, Zap, Target } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { extractMetric, formatCurrency } from "@/lib/formatters";
import { useMemo } from "react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell 
} from "recharts";

export function CampaignDrawer() {
  const { drawerCampaignId, setDrawerCampaignId, dataA, dataAds, ageBreakdownA, genderBreakdownA, regionBreakdownA } = useAppStore();

  const campaignData = useMemo(() => {
    if (!drawerCampaignId) return null;
    const filtered = dataA.filter(d => d.campaign_id === drawerCampaignId);
    const ads = dataAds.filter(d => d.campaign_id === drawerCampaignId);
    
    const totals = filtered.reduce((acc, curr) => {
      acc.spend += parseFloat(curr.spend || "0");
      acc.leads += extractMetric(curr.actions, ['lead']);
      acc.imps += parseInt(curr.impressions || "0");
      return acc;
    }, { spend: 0, leads: 0, imps: 0 });

    const name = filtered[0]?.campaign_name || "Campanha";
    
    // Breakdowns filtered for this campaign
    const age = ageBreakdownA.filter(d => d.campaign_id === drawerCampaignId);
    const gender = genderBreakdownA.filter(d => d.campaign_id === drawerCampaignId);
    const regions = regionBreakdownA.filter(d => d.campaign_id === drawerCampaignId);

    return { name, totals, ads, age, gender, regions };
  }, [drawerCampaignId, dataA, dataAds, ageBreakdownA, genderBreakdownA, regionBreakdownA]);

  if (!drawerCampaignId || !campaignData) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] animate-in fade-in duration-300" 
        onClick={() => setDrawerCampaignId(null)}
      />
      
      {/* Panel */}
      <aside className="fixed inset-y-0 right-0 w-full max-w-xl bg-surface border-l border-white/5 shadow-2xl z-[101] flex flex-col animate-in slide-in-from-right duration-500">
        <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.01]">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-accent uppercase tracking-[0.2em] mb-1">Métricas Isoladas</span>
            <h2 className="text-lg font-bold text-white truncate max-w-[400px]">{campaignData.name}</h2>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setDrawerCampaignId(null)}
            className="rounded-full hover:bg-white/5"
          >
            <X className="w-5 h-5 text-muted" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {/* Main KPI Grid */}
          <div className="grid grid-cols-3 gap-4">
            <div className="glass p-4">
              <span className="text-[10px] font-bold text-muted uppercase tracking-widest block mb-2">Gasto</span>
              <p className="text-xl font-bold mono">{formatCurrency(campaignData.totals.spend)}</p>
            </div>
            <div className="glass p-4 border-accent/20">
              <span className="text-[10px] font-bold text-accent uppercase tracking-widest block mb-2">Leads</span>
              <p className="text-xl font-bold mono">{campaignData.totals.leads}</p>
            </div>
            <div className="glass p-4">
              <span className="text-[10px] font-bold text-muted uppercase tracking-widest block mb-2">CPL</span>
              <p className="text-xl font-bold mono">
                {campaignData.totals.leads > 0 ? formatCurrency(campaignData.totals.spend / campaignData.totals.leads) : "R$ 0,00"}
              </p>
            </div>
          </div>

          {/* Demographic Section */}
          <div className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-white uppercase tracking-widest flex items-center gap-2">
                <Users className="w-4 h-4 text-accent" />
                Idade & Gênero
              </h3>
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={campaignData.age}>
                    <XAxis dataKey="age" axisLine={false} tick={{fill: '#71717a', fontSize: 10}} />
                    <Tooltip 
                      contentStyle={{backgroundColor: '#111113', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px'}}
                      itemStyle={{fontSize: '10px', fontWeight: 'bold'}}
                    />
                    <Bar dataKey="spend" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-xs font-bold text-white uppercase tracking-widest flex items-center gap-2">
                <Map className="w-4 h-4 text-accent" />
                Performance por Região (Top Estados)
              </h3>
              <div className="grid grid-cols-1 gap-2">
                {campaignData.regions.slice(0, 5).map((r, i) => (
                   <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02] border border-white/5">
                      <span className="text-xs font-bold">{r.region}</span>
                      <div className="flex items-center gap-4">
                        <span className="text-[10px] text-muted font-bold uppercase">{extractMetric(r.actions, ['lead'])} Leads</span>
                        <span className="text-xs font-bold mono">{formatCurrency(parseFloat(r.spend))}</span>
                      </div>
                   </div>
                ))}
              </div>
            </div>
          </div>

          {/* Ads List */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-widest flex items-center gap-2">
              <Zap className="w-4 h-4 text-accent" />
              Anúncios Detalhados
            </h3>
            <div className="space-y-4">
              {campaignData.ads.map((ad, i) => {
                const hierarchyAd = (useAppStore.getState().hierarchy?.ads || []).find(h => h.id === ad.ad_id);
                const creative = (hierarchyAd as any)?.adcreatives?.data?.[0];
                const thumb = creative?.thumbnail_url || creative?.image_url;

                return (
                  <div key={i} className="glass overflow-hidden flex flex-col hover:bg-white/[0.04] transition-all group">
                    <div className="aspect-video w-full bg-white/5 relative overflow-hidden bg-muted/20">
                      {thumb ? (
                        <img 
                          src={thumb} 
                          alt={ad.ad_name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[10px] text-muted font-bold uppercase tracking-widest">Sem Prévia</div>
                      )}
                      <div className="absolute top-2 right-2 px-1.5 py-0.5 bg-black/60 backdrop-blur-md rounded text-[8px] font-bold text-white uppercase tracking-widest border border-white/10">
                        ID: {ad.ad_id?.slice(-6)}
                      </div>
                    </div>
                    <div className="p-4 flex items-center justify-between">
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-bold truncate max-w-[200px]">{ad.ad_name}</span>
                        <span className="text-[10px] text-muted font-bold uppercase">{extractMetric(ad.actions, ['lead'])} Leads</span>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold mono">{formatCurrency(parseFloat(ad.spend))}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        
        <div className="p-6 border-t border-white/5 bg-white/[0.01]">
          <Button 
            className="w-full h-12 font-bold uppercase tracking-widest text-[11px]"
            onClick={() => setDrawerCampaignId(null)}
          >
            Fechar Detalhamento
          </Button>
        </div>
      </aside>
    </>
  );
}

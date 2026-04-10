"use client";

import { useMemo, useState, useEffect } from "react";
import { useAppStore } from "@/store/useAppStore";
import { 
  ResponsiveContainer, LineChart, Line, AreaChart, Area, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceLine, Label 
} from "recharts";
import { formatCurrency, extractMetric } from "@/lib/formatters";
import { safeArray } from "@/lib/safeArray";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { TrendingUp, Activity, Zap, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export function CampaignTimeline() {
  const { dataA, selectedCampaigns, selectedAdSets } = useAppStore();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const timelineData = useMemo(() => {
    const dailyMap: Record<string, any> = {};

    safeArray(dataA).forEach((item) => {
      // Apply hierarchy filters
      if (selectedCampaigns.length > 0 && !selectedCampaigns.includes(item.campaign_id)) return;
      if (selectedAdSets.length > 0 && !selectedAdSets.includes(item.adset_id || "")) return;

      const date = item.date_start;
      if (!dailyMap[date]) {
        dailyMap[date] = { 
          date, 
          displayDate: format(parseISO(date), "dd MMM", { locale: ptBR }),
          spend: 0, 
          leads: 0, 
          conversations: 0,
          cpl: 0 
        };
      }

      dailyMap[date].spend += parseFloat(item.spend || "0");
      dailyMap[date].leads += extractMetric(item.actions, ["lead", "leadgen.other"]);
      dailyMap[date].conversations += extractMetric(item.actions, [
        "onsite_conversion.messaging_conversation_started_7d",
        "onsite_conversion.messaging_first_reply"
      ]);
    });

    const sortedData = Object.values(dailyMap).sort((a, b) => a.date.localeCompare(b.date));

    // Calculate acceleration and CPL
    return sortedData.map((d, i, arr) => {
      const prev = i > 0 ? arr[i-1] : null;
      const acceleration = prev && prev.spend > 0 ? ((d.spend - prev.spend) / prev.spend) * 100 : 0;
      const cpl = d.leads > 0 ? d.spend / d.leads : 0;
      
      return {
        ...d,
        acceleration: Math.min(Math.max(acceleration, -100), 100),
        cpl: cpl > 1000 ? 1000 : cpl, // Cap for visual sanity
        isAcceleration: acceleration > 30,
        isDrop: acceleration < -30
      };
    });
  }, [dataA, selectedCampaigns, selectedAdSets]);

  const accelerationMoments = timelineData.filter(d => d.isAcceleration);

  if (!mounted) return <div className="glass p-6 h-64 animate-pulse" />;

  return (
    <div className="glass p-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-accent/10 rounded-lg">
            <Activity className="w-5 h-5 text-accent" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-widest">Timeline de Aceleração (Spend)</h3>
            <p className="text-[10px] text-muted font-medium mt-0.5">Visão histórica de picos de gasto e consistência de entrega.</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-accent" />
            <span className="text-[10px] font-bold text-muted uppercase tracking-wider">Investimento Diário</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="text-[10px] font-bold text-muted uppercase tracking-wider">Volume de Leads</span>
          </div>
        </div>
      </div>

      <div className="w-full h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={timelineData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorSpend" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
            <XAxis 
              dataKey="displayDate" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }}
            />
            <YAxis 
              yAxisId="left"
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }}
              tickFormatter={(v) => `R$${v}`}
            />
            <YAxis 
              yAxisId="right"
              orientation="right"
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }}
            />
            <Tooltip 
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="glass p-4 border-white/10 shadow-2xl space-y-2">
                      <p className="text-[10px] font-black text-white uppercase tracking-widest border-b border-white/5 pb-2 mb-2">{label}</p>
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-accent mono flex justify-between gap-8">
                          <span className="text-muted uppercase tracking-tight">Investimento</span>
                          {formatCurrency(data.spend)}
                        </p>
                        <p className="text-xs font-bold text-emerald-400 mono flex justify-between">
                          <span className="text-muted uppercase tracking-tight">Leads</span>
                          {data.leads}
                        </p>
                        <p className="text-xs font-bold text-white mono flex justify-between">
                          <span className="text-muted uppercase tracking-tight">Variação</span>
                          {data.acceleration.toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            
            {accelerationMoments.map((moment, i) => (
              <ReferenceLine 
                key={i}
                x={moment.displayDate} 
                stroke="#6366f1" 
                strokeDasharray="3 3" 
                yAxisId="left"
              >
                <Label 
                  value="🚀 ESCALA" 
                  position="top" 
                  fill="#6366f1" 
                  className="text-[8px] font-black tracking-widest"
                />
              </ReferenceLine>
            ))}

            <Area 
              yAxisId="left"
              type="monotone" 
              dataKey="spend" 
              stroke="#6366f1" 
              strokeWidth={3}
              fillOpacity={1} 
              fill="url(#colorSpend)"
              animationDuration={1500}
            />
            <Line 
              yAxisId="right"
              type="monotone" 
              dataKey="leads" 
              stroke="#10b981" 
              strokeWidth={2}
              dot={{ fill: '#10b981', r: 4 }}
              activeDot={{ r: 6, stroke: '#10b981', strokeWidth: 2, fill: 'white' }}
              animationDuration={2000}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white/5 rounded-2xl p-4 border border-white/10 flex items-center gap-4 group hover:bg-white/[0.07] transition-all">
          <div className="p-3 bg-accent/20 rounded-xl text-accent group-hover:scale-110 transition-transform">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-muted uppercase tracking-widest leading-none">Picos de Aceleração</span>
            <p className="text-lg font-bold text-white mt-1">{accelerationMoments.length} Momentos</p>
            <p className="text-[10px] text-muted mt-1">Gasto aumentado em {">"}30% dia após dia.</p>
          </div>
        </div>

        <div className="bg-white/5 rounded-2xl p-4 border border-white/10 flex items-center gap-4 group hover:bg-white/[0.07] transition-all">
          <div className="p-3 bg-red-500/20 rounded-xl text-red-400 group-hover:scale-110 transition-transform">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-muted uppercase tracking-widest leading-none">Gaps de Entrega</span>
            <p className="text-lg font-bold text-white mt-1">{timelineData.filter(d => d.spend === 0).length} Dias</p>
            <p className="text-[10px] text-muted mt-1">Interrupções detectadas no período selecionado.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

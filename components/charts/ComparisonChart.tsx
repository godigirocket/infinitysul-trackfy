"use client";

import { useAppStore } from "@/store/useAppStore";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { formatCurrency, extractMetric } from "@/lib/formatters";
import { useMemo, useState, useEffect } from "react";

export function ComparisonChart() {
  const { dataA, dataB, annotations } = useAppStore();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return <div className="h-full" />;

  const chartData = useMemo(() => {
    // Map data by day offset to overlap them
    const map: Record<string, any> = {};
    
    dataA.forEach((item, index) => {
      const date = item.date_start;
      if (!map[index]) map[index] = { index, dateA: date, spendA: 0, leadsA: 0 };
      map[index].spendA += parseFloat(item.spend || "0");
      map[index].leadsA += extractMetric(item.actions, ['lead']);
      
      if (annotations[date]) map[index].note = annotations[date];
    });

    dataB.forEach((item, index) => {
      if (!map[index]) map[index] = { index, dateB: item.date_start, spendB: 0, leadsB: 0 };
      map[index].dateB = item.date_start;
      map[index].spendB = (map[index].spendB || 0) + parseFloat(item.spend || "0");
      map[index].leadsB = (map[index].leadsB || 0) + extractMetric(item.actions, ['lead']);
    });

    return Object.values(map);
  }, [dataA, dataB, annotations]);

  return (
    <div className="w-full h-full min-h-[350px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorA" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorB" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.2}/>
              <stop offset="95%" stopColor="#94a3b8" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
          <XAxis 
            dataKey="index" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }}
            label={{ value: 'Dias do Período (Sobreposição)', position: 'insideBottom', offset: -5, fill: 'rgba(255,255,255,0.2)', fontSize: 9 }}
          />
          <YAxis 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }}
            tickFormatter={(v: number) => `R$${v}`}
          />
          <Tooltip 
            content={({ active, payload }: { active?: boolean; payload?: readonly any[] }) => {
              if (active && payload && payload.length) {
                const data = payload[0].payload;
                return (
                  <div className="glass p-4 border-white/10 shadow-2xl space-y-2">
                    <div className="flex flex-col border-b border-white/5 pb-2">
                      <span className="text-[10px] font-bold text-accent uppercase tracking-widest">Período A ({data.dateA})</span>
                      <span className="text-sm font-bold mono">{formatCurrency(data.spendA)} • {data.leadsA} Leads</span>
                    </div>
                    {data.dateB && (
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-muted uppercase tracking-widest">Período B ({data.dateB})</span>
                        <span className="text-sm font-bold mono text-muted">{formatCurrency(data.spendB)} • {data.leadsB} Leads</span>
                      </div>
                    )}
                    {data.note && (
                      <div className="mt-2 pt-2 border-t border-white/5 flex gap-2 items-start">
                        <div className="w-1.5 h-1.5 rounded-full bg-accent mt-1" />
                        <p className="text-[10px] italic text-white/70">{data.note}</p>
                      </div>
                    )}
                  </div>
                );
              }
              return null;
            }}
          />
          <Legend 
            verticalAlign="top" 
            align="right"
            iconType="circle"
            wrapperStyle={{ paddingBottom: '20px', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase' }}
          />
          <Area 
            name="Período Atual"
            type="monotone" 
            dataKey="spendA" 
            stroke="#6366f1" 
            strokeWidth={3}
            fillOpacity={1} 
            fill="url(#colorA)" 
            animationDuration={1500}
          />
          <Area 
            name="Período Anterior"
            type="monotone" 
            dataKey="spendB" 
            stroke="#94a3b8" 
            strokeWidth={2}
            strokeDasharray="5 5"
            fillOpacity={1} 
            fill="url(#colorB)" 
            animationDuration={1500}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

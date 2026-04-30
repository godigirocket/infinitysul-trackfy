"use client";

import { useAppStore } from "@/store/useAppStore";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { formatCurrency, extractMetric } from "@/lib/formatters";
import { useMemo, useState, useEffect } from "react";

export function ComparisonChart() {
  const { dataA, dataB, annotations } = useAppStore();
  const theme = useAppStore(s => s.theme);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return <div className="h-full" />;

  const isDark = theme !== "light";
  const chartGrid  = isDark ? "rgba(255,255,255,0.05)" : "#e5e7eb";
  const chartText  = isDark ? "rgba(255,255,255,0.3)" : "#6b7280";
  const tooltipBg  = isDark ? "#111827" : "#ffffff";
  const tooltipTxt = isDark ? "#ffffff" : "#111827";
  const lineA      = isDark ? "#6366f1" : "#3b82f6";
  const lineB      = isDark ? "#94a3b8" : "#9ca3af";

  const chartData = useMemo(() => {
    const map: Record<string, any> = {};
    dataA.forEach((item, index) => {
      const date = item.date_start;
      if (!map[index]) map[index] = { index, dateA: date, spendA: 0, leadsA: 0 };
      map[index].spendA += parseFloat(item.spend || "0");
      map[index].leadsA += extractMetric(item.actions, ["lead"]);
      if (annotations[date]) map[index].note = annotations[date];
    });
    dataB.forEach((item, index) => {
      if (!map[index]) map[index] = { index, dateB: item.date_start, spendB: 0, leadsB: 0 };
      map[index].dateB = item.date_start;
      map[index].spendB = (map[index].spendB || 0) + parseFloat(item.spend || "0");
      map[index].leadsB = (map[index].leadsB || 0) + extractMetric(item.actions, ["lead"]);
    });
    return Object.values(map);
  }, [dataA, dataB, annotations]);

  return (
    <div className="w-full h-full min-h-[350px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorA" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={lineA} stopOpacity={0.3} />
              <stop offset="95%" stopColor={lineA} stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorB" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={lineB} stopOpacity={0.2} />
              <stop offset="95%" stopColor={lineB} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartGrid} />
          <XAxis
            dataKey="index"
            axisLine={false}
            tickLine={false}
            tick={{ fill: chartText, fontSize: 10 }}
            label={{ value: "Dias do Período (Sobreposição)", position: "insideBottom", offset: -5, fill: chartText, fontSize: 9 }}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: chartText, fontSize: 10 }}
            tickFormatter={(v: number) => `R$${v}`}
          />
          <Tooltip
            content={({ active, payload }: { active?: boolean; payload?: readonly any[] }) => {
              if (active && payload && payload.length) {
                const d = payload[0].payload;
                return (
                  <div className="p-4 rounded-xl shadow-xl border space-y-2 text-[12px]"
                    style={{ background: tooltipBg, borderColor: isDark ? "rgba(255,255,255,0.1)" : "#e5e7eb" }}>
                    <div className="border-b pb-2" style={{ borderColor: isDark ? "rgba(255,255,255,0.05)" : "#e5e7eb" }}>
                      <span className="text-[10px] font-bold text-accent uppercase tracking-widest block">Período A ({d.dateA})</span>
                      <span className="font-bold font-mono" style={{ color: tooltipTxt }}>{formatCurrency(d.spendA)} • {d.leadsA} Leads</span>
                    </div>
                    {d.dateB && (
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-widest block" style={{ color: chartText }}>Período B ({d.dateB})</span>
                        <span className="font-bold font-mono" style={{ color: chartText }}>{formatCurrency(d.spendB)} • {d.leadsB} Leads</span>
                      </div>
                    )}
                    {d.note && (
                      <div className="mt-2 pt-2 border-t flex gap-2 items-start" style={{ borderColor: isDark ? "rgba(255,255,255,0.05)" : "#e5e7eb" }}>
                        <div className="w-1.5 h-1.5 rounded-full bg-accent mt-1 flex-shrink-0" />
                        <p className="text-[10px] italic" style={{ color: tooltipTxt }}>{d.note}</p>
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
            wrapperStyle={{ paddingBottom: "20px", fontSize: "10px", fontWeight: "bold", textTransform: "uppercase", color: chartText }}
          />
          <Area name="Período Atual" type="monotone" dataKey="spendA"
            stroke={lineA} strokeWidth={3} fillOpacity={1} fill="url(#colorA)" animationDuration={1500} />
          <Area name="Período Anterior" type="monotone" dataKey="spendB"
            stroke={lineB} strokeWidth={2} strokeDasharray="5 5" fillOpacity={1} fill="url(#colorB)" animationDuration={1500} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

"use client";

import { useAppStore } from "@/store/useAppStore";
import { useMemo } from "react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie
} from "recharts";
import { Users, User, UserCheck, TrendingUp } from "lucide-react";
import { formatCurrency, extractMetric, LEAD_ACTION_TYPES, CONVERSATION_ACTION_TYPES } from "@/lib/formatters";
import { safeArray } from "@/lib/safeArray";
import { useState, useEffect } from "react";

const COLORS = ['#6366f1', '#a855f7', '#ec4899', '#f43f5e', '#ef4444', '#f97316'];
const GENDER_COLORS = {
  male: '#6366f1',
  female: '#ec4899',
  unknown: '#71717a'
};

export function AudienceBreakdown() {
  const { ageBreakdownA, genderBreakdownA } = useAppStore();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const ageData = useMemo(() => {
    const map = new Map();
    safeArray(ageBreakdownA).forEach(item => {
      const age = item.age || "Desconhecido";
      if (!map.has(age)) map.set(age, { name: age, spend: 0, leads: 0 });
      const entry = map.get(age);
      entry.spend += parseFloat(item.spend || "0");
      const leads = extractMetric(item.actions, LEAD_ACTION_TYPES);
      const convs = extractMetric(item.actions, CONVERSATION_ACTION_TYPES);
      entry.leads += Math.max(leads, convs); // use whichever is higher
    });
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [ageBreakdownA]);

  const genderData = useMemo(() => {
    const map = new Map();
    safeArray(genderBreakdownA).forEach(item => {
      const gender = item.gender || "unknown";
      if (!map.has(gender)) map.set(gender, { name: gender === 'male' ? 'Masculino' : gender === 'female' ? 'Feminino' : 'Outros', value: 0, spend: 0 });
      const entry = map.get(gender);
      entry.spend += parseFloat(item.spend || "0");
      const leads2 = extractMetric(item.actions, LEAD_ACTION_TYPES);
      const convs2 = extractMetric(item.actions, CONVERSATION_ACTION_TYPES);
      entry.value += Math.max(leads2, convs2);
    });
    return Array.from(map.values());
  }, [genderBreakdownA]);

  const topAge = useMemo(() => {
    return [...ageData].sort((a, b) => b.leads - a.leads)[0];
  }, [ageData]);

  if (!mounted) return <div className="space-y-8"><div className="glass h-64 animate-pulse" /><div className="glass h-64 animate-pulse" /></div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Age Chart */}
        <div className="glass p-8 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-accent/10 rounded-lg">
                <Users className="w-5 h-5 text-accent" />
              </div>
              <h3 className="text-xs font-bold text-white uppercase tracking-widest">Distribuição por Idade</h3>
            </div>
            {topAge && (
              <div className="text-right">
                <span className="text-[10px] text-muted font-bold uppercase block">Melhor Performance</span>
                <span className="text-sm font-bold text-accent">{topAge.name} anos</span>
              </div>
            )}
          </div>

          <div className="h-[300px] w-full" style={{ minHeight: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ageData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis 
                   dataKey="name" 
                   axisLine={false} 
                   tickLine={false} 
                   tick={{fill: '#71717a', fontSize: 10, fontWeight: 'bold'}} 
                />
                <YAxis 
                   axisLine={false} 
                   tickLine={false} 
                   tick={{fill: '#71717a', fontSize: 10, fontWeight: 'bold'}}
                />
                <Tooltip 
                  contentStyle={{backgroundColor: '#111113', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px'}}
                  itemStyle={{fontSize: '11px', fontWeight: 'bold', color: '#fff'}}
                  cursor={{fill: 'rgba(255,255,255,0.02)'}}
                />
                <Bar dataKey="leads" radius={[4, 4, 0, 0]}>
                  {ageData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gender Chart */}
        <div className="glass p-8 space-y-6">
           <div className="flex items-center gap-3">
              <div className="p-2 bg-pink-500/10 rounded-lg">
                <UserCheck className="w-5 h-5 text-pink-500" />
              </div>
              <h3 className="text-xs font-bold text-white uppercase tracking-widest">Performance por Gênero</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div className="h-[240px]" style={{ minHeight: 240 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={genderData}
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {genderData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.name === 'Masculino' ? GENDER_COLORS.male : entry.name === 'Feminino' ? GENDER_COLORS.female : GENDER_COLORS.unknown} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{backgroundColor: '#111113', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px'}}
                      itemStyle={{fontSize: '11px', fontWeight: 'bold', color: '#fff'}}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-4">
                {genderData.map((g, i) => (
                  <div key={i} className="flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{backgroundColor: g.name === 'Masculino' ? GENDER_COLORS.male : g.name === 'Feminino' ? GENDER_COLORS.female : GENDER_COLORS.unknown}} />
                        <span className="text-xs font-bold text-white">{g.name}</span>
                      </div>
                      <span className="text-xs font-bold mono">{g.value} Leads</span>
                    </div>
                    <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                       <div 
                         className="h-full transition-all duration-1000" 
                         style={{
                           width: `${genderData.reduce((s,x) => s+x.value,0) > 0 ? (g.value / genderData.reduce((s,x) => s+x.value,0)) * 100 : 0}%`,
                           backgroundColor: g.name === 'Masculino' ? GENDER_COLORS.male : g.name === 'Feminino' ? GENDER_COLORS.female : GENDER_COLORS.unknown
                         }} 
                       />
                    </div>
                  </div>
                ))}
              </div>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className="glass p-6 border-accent/20">
            <TrendingUp className="w-5 h-5 text-accent mb-4" />
            <h4 className="text-[10px] font-bold text-muted uppercase tracking-widest mb-2">Insight de Público</h4>
            <p className="text-sm font-bold text-white leading-relaxed">
              O seu maior volume de conversão está concentrado no público {topAge?.name || "N/A"}. 
              Considere criar anúncios com linguagem específica para essa faixa.
            </p>
         </div>
         {/* More summary cards could go here */}
      </div>
    </div>
  );
}

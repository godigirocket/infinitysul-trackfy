"use client";

import { useMemo, useState } from "react";
import { useAppStore } from "@/store/useAppStore";
import { runIntelligence, calcIntelSummary } from "@/lib/intelligenceEngine";
import { 
  LayoutDashboard, Clock, Activity, Users, 
  Layers, Package, Brain
} from "lucide-react";
import { cn } from "@/lib/utils";

import { ControlBar } from "@/components/intelligence/ControlBar";
import { DateRangePicker } from "@/components/intelligence/DateRangePicker";
import { DeliveryHealth } from "@/components/intelligence/DeliveryHealth";
import { HourlyHeatmap } from "@/components/intelligence/HourlyHeatmap";
import { CampaignTimeline } from "@/components/intelligence/CampaignTimeline";
import { SummaryCards } from "@/components/intelligence/SummaryCards";
import { OptimizationPanel } from "@/components/intelligence/OptimizationPanel";
import { CylinderFunnel } from "@/components/intelligence/CylinderFunnel";
import { AudienceBreakdown } from "@/components/intelligence/AudienceBreakdown";
import { BIConnector } from "@/components/intelligence/BIConnector";

type TabType = "overview" | "time" | "timeline" | "audience" | "funnel" | "creatives";

export default function IntelligencePage() {
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const { dataAds, isLoading } = useAppStore();

  const allIntel = useMemo(() => runIntelligence(dataAds), [dataAds]);
  const summary = useMemo(() => calcIntelSummary(allIntel), [allIntel]);

  const tabs = [
    { id: "overview", label: "Visão Geral", icon: LayoutDashboard },
    { id: "time", label: "Picos de Horário", icon: Clock },
    { id: "timeline", label: "Timeline & Gasto", icon: Activity },
    { id: "audience", label: "Audiência & Canais", icon: Users },
    { id: "funnel", label: "Análise de Funil", icon: Layers },
    { id: "creatives", label: "Hub de Criativos", icon: Package },
  ];

  if (!dataAds.length && !isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center animate-in fade-in duration-1000 px-4">
        <div className="relative">
          <div className="absolute inset-0 bg-accent/20 blur-3xl rounded-full" />
          <Brain className="w-16 h-16 text-accent relative z-10 animate-pulse" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Pronto para Analisar</h2>
          <p className="text-muted text-sm max-w-sm mx-auto">
            Sincronize sua conta da Meta para transformar dados em decisões de escala.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:gap-6 mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="p-2 sm:p-3 bg-accent/10 rounded-xl sm:rounded-2xl border border-accent/20">
              <Brain className="w-5 h-5 sm:w-6 sm:h-6 text-accent" />
            </div>
            <div>
              <h1 className="text-lg sm:text-2xl font-black text-white uppercase tracking-tighter">Central de Inteligência</h1>
              <div className="flex items-center gap-2 mt-1">
                <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
                <span className="text-[9px] sm:text-[10px] font-bold text-muted uppercase tracking-widest">Sincronizado com Meta Ads</span>
              </div>
            </div>
          </div>
          <DateRangePicker />
        </div>

        {/* Tabs - scrollable on mobile */}
        <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/10 overflow-x-auto scrollbar-hide">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={cn(
                "flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-lg text-[10px] sm:text-[11px] font-bold uppercase tracking-wider transition-all whitespace-nowrap flex-shrink-0",
                activeTab === tab.id 
                  ? "bg-accent text-white shadow-lg" 
                  : "text-muted hover:text-white hover:bg-white/5"
              )}
            >
              <tab.icon className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <ControlBar />

      <div className="mt-6 sm:mt-8">
        {activeTab === "overview" && (
          <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-500">
             <SummaryCards summary={summary} />
             <OptimizationPanel intel={allIntel} />
             <DeliveryHealth />
             <BIConnector />
          </div>
        )}

        {activeTab === "time" && (
          <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-500">
            <HourlyHeatmap />
          </div>
        )}

        {activeTab === "timeline" && (
          <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-500">
            <CampaignTimeline />
          </div>
        )}

        {activeTab === "audience" && (
          <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-500">
            <AudienceBreakdown />
          </div>
        )}

        {activeTab === "funnel" && (
          <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-500">
            <CylinderFunnel />
          </div>
        )}

        {activeTab === "creatives" && (
          <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-500">
            <div className="glass p-8 sm:p-12 text-center flex flex-col items-center gap-4">
              <Package className="w-12 h-12 text-accent/30" />
              <h2 className="text-lg sm:text-xl font-bold text-white uppercase tracking-widest">Hub de Criativos</h2>
              <p className="text-muted text-sm max-w-sm">Análise visual de cada anúncio com Hook Rate e Hold Rate.</p>
              <a href="/campaigns/creatives" className="px-6 sm:px-8 py-3 bg-accent text-white rounded-xl text-sm font-bold mt-4 hover:scale-105 transition-all inline-block">
                Abrir Creative Hub →
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

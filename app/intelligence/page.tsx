"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { useAppStore } from "@/store/useAppStore";
import { runIntelligence, calcIntelSummary } from "@/lib/intelligenceEngine";
import { LayoutDashboard, Clock, Activity, Users, Layers, Package, Brain, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { useMetaData } from "@/hooks/useMetaData";

// ── Dynamic imports — disables SSR for all chart/data components ──
const ControlBar       = dynamic(() => import("@/components/intelligence/ControlBar").then(m => ({ default: m.ControlBar })), { ssr: false, loading: () => <div className="h-12 glass animate-pulse rounded-xl" /> });
const DateRangePicker  = dynamic(() => import("@/components/intelligence/DateRangePicker").then(m => ({ default: m.DateRangePicker })), { ssr: false });
const SummaryCards     = dynamic(() => import("@/components/intelligence/SummaryCards").then(m => ({ default: m.SummaryCards })), { ssr: false });
const OptimizationPanel = dynamic(() => import("@/components/intelligence/OptimizationPanel").then(m => ({ default: m.OptimizationPanel })), { ssr: false });
const DeliveryHealth   = dynamic(() => import("@/components/intelligence/DeliveryHealth").then(m => ({ default: m.DeliveryHealth })), { ssr: false });
const BIConnector      = dynamic(() => import("@/components/intelligence/BIConnector").then(m => ({ default: m.BIConnector })), { ssr: false });
const HourlyHeatmap    = dynamic(() => import("@/components/intelligence/HourlyHeatmap").then(m => ({ default: m.HourlyHeatmap })), { ssr: false, loading: () => <div className="h-64 glass animate-pulse rounded-xl" /> });
const CampaignTimeline = dynamic(() => import("@/components/intelligence/CampaignTimeline").then(m => ({ default: m.CampaignTimeline })), { ssr: false, loading: () => <div className="h-64 glass animate-pulse rounded-xl" /> });
const AudienceBreakdown = dynamic(() => import("@/components/intelligence/AudienceBreakdown").then(m => ({ default: m.AudienceBreakdown })), { ssr: false, loading: () => <div className="h-64 glass animate-pulse rounded-xl" /> });
const CylinderFunnel   = dynamic(() => import("@/components/intelligence/CylinderFunnel").then(m => ({ default: m.CylinderFunnel })), { ssr: false, loading: () => <div className="h-64 glass animate-pulse rounded-xl" /> });

type TabType = "overview" | "time" | "timeline" | "audience" | "funnel" | "creatives";

const tabs = [
  { id: "overview",  label: "Visão Geral",      icon: LayoutDashboard },
  { id: "time",      label: "Picos de Horário",  icon: Clock },
  { id: "timeline",  label: "Timeline & Gasto",  icon: Activity },
  { id: "audience",  label: "Audiência & Canais", icon: Users },
  { id: "funnel",    label: "Análise de Funil",  icon: Layers },
  { id: "creatives", label: "Hub de Criativos",  icon: Package },
];

export default function IntelligencePage() {
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const { dataA, dataAds, isLoading } = useAppStore();
  useMetaData();

  const allIntel = useMemo(() => runIntelligence(dataA ?? []), [dataA]);
  const summary  = useMemo(() => calcIntelSummary(allIntel), [allIntel]);

  if (!dataA?.length && !isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center px-4">
        <Brain className="w-16 h-16 text-accent animate-pulse" />
        <div className="space-y-2">
          <h2 className="text-xl sm:text-2xl font-bold text-white">Pronto para Analisar</h2>
          <p className="text-muted text-sm max-w-sm mx-auto">Sincronize sua conta da Meta para ver os dados.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20">
      <div className="flex flex-col gap-4 sm:gap-6 mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="p-2 sm:p-3 bg-accent/10 rounded-xl border border-accent/20">
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
          <ErrorBoundary name="DateRangePicker"><DateRangePicker /></ErrorBoundary>
        </div>

        <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/10 overflow-x-auto scrollbar-hide">
          {tabs.map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id as TabType)}
              className={cn("flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-lg text-[10px] sm:text-[11px] font-bold uppercase tracking-wider transition-all whitespace-nowrap flex-shrink-0",
                activeTab === tab.id ? "bg-accent text-white shadow-lg" : "text-muted hover:text-white hover:bg-white/5")}>
              <tab.icon className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <ErrorBoundary name="ControlBar"><ControlBar /></ErrorBoundary>

      <div className="mt-6 sm:mt-8">
        {activeTab === "overview" && (
          <div className="space-y-6 sm:space-y-8">
            <ErrorBoundary name="SummaryCards"><SummaryCards summary={summary} /></ErrorBoundary>
            <ErrorBoundary name="OptimizationPanel"><OptimizationPanel intel={allIntel} /></ErrorBoundary>
            <ErrorBoundary name="DeliveryHealth"><DeliveryHealth /></ErrorBoundary>
            <ErrorBoundary name="BIConnector"><BIConnector /></ErrorBoundary>
          </div>
        )}
        {activeTab === "time" && (
          <ErrorBoundary name="HourlyHeatmap"><HourlyHeatmap /></ErrorBoundary>
        )}
        {activeTab === "timeline" && (
          <ErrorBoundary name="CampaignTimeline"><CampaignTimeline /></ErrorBoundary>
        )}
        {activeTab === "audience" && (
          <ErrorBoundary name="AudienceBreakdown"><AudienceBreakdown /></ErrorBoundary>
        )}
        {activeTab === "funnel" && (
          <ErrorBoundary name="CylinderFunnel"><CylinderFunnel /></ErrorBoundary>
        )}
        {activeTab === "creatives" && (
          <div className="glass p-8 sm:p-12 text-center flex flex-col items-center gap-4">
            <Package className="w-12 h-12 text-accent/30" />
            <h2 className="text-lg sm:text-xl font-bold text-white uppercase tracking-widest">Hub de Criativos</h2>
            <p className="text-muted text-sm max-w-sm">Análise visual de cada anúncio com Hook Rate e Hold Rate.</p>
            <a href="/campaigns/creatives" className="px-6 sm:px-8 py-3 bg-accent text-white rounded-xl text-sm font-bold mt-4 hover:scale-105 transition-all inline-block">
              Abrir Creative Hub →
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

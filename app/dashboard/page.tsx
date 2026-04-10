"use client";

import dynamic from "next/dynamic";
import { useMetaData } from "@/hooks/useMetaData";
import { useAppStore } from "@/store/useAppStore";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/Button";

const KpiGrid          = dynamic(() => import("@/components/kpi/KpiGrid").then(m => ({ default: m.KpiGrid })), { ssr: false });
const MainChart        = dynamic(() => import("@/components/charts/MainChart").then(m => ({ default: m.MainChart })), { ssr: false, loading: () => <div className="h-full animate-pulse bg-white/5 rounded-xl" /> });
const AlertsFeed       = dynamic(() => import("@/components/alerts/AlertsFeed").then(m => ({ default: m.AlertsFeed })), { ssr: false });
const DashboardFilters = dynamic(() => import("@/components/dashboard/DashboardFilters").then(m => ({ default: m.DashboardFilters })), { ssr: false });
const PeakAnalysis     = dynamic(() => import("@/components/charts/PeakAnalysis").then(m => ({ default: m.PeakAnalysis })), { ssr: false, loading: () => <div className="flex-1 min-h-[250px] animate-pulse bg-white/5 rounded-xl" /> });
const VideoMetrics     = dynamic(() => import("@/components/charts/VideoMetricsSection").then(m => ({ default: m.VideoMetricsSection })), { ssr: false });
const ExecutiveSummary = dynamic(() => import("@/components/dashboard/ExecutiveSummary").then(m => ({ default: m.ExecutiveSummary })), { ssr: false });
const CylinderFunnel   = dynamic(() => import("@/components/intelligence/CylinderFunnel").then(m => ({ default: m.CylinderFunnel })), { ssr: false });

export default function DashboardPage() {
  const { refresh } = useMetaData();
  const { lastSync } = useAppStore();

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-white/40">
            Painel Executivo
          </h1>
          <p className="text-xs sm:text-sm text-muted">Visão geral de investimento, resultados e funil de conversão.</p>
        </div>
        {lastSync && (
          <span className="text-[10px] font-bold text-muted tabular-nums uppercase tracking-widest opacity-50">
            Sync: {lastSync}
          </span>
        )}
      </div>

      <ErrorBoundary name="DashboardFilters"><DashboardFilters /></ErrorBoundary>
      <ErrorBoundary name="ExecutiveSummary"><ExecutiveSummary /></ErrorBoundary>
      <ErrorBoundary name="KpiGrid"><KpiGrid /></ErrorBoundary>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 sm:gap-8">
        <ErrorBoundary name="CylinderFunnel"><CylinderFunnel /></ErrorBoundary>
        <div className="glass p-5 sm:p-8">
          <div className="flex items-center justify-between mb-6 sm:mb-8">
            <h3 className="text-[10px] sm:text-xs font-bold text-muted uppercase tracking-widest flex items-center">
              <span className="w-2 h-2 rounded-full bg-accent mr-2 animate-pulse" />
              Investimento × Leads (Diário)
            </h3>
            <Button variant="outline" size="sm" className="h-7 sm:h-8 px-2 sm:px-3 text-[9px] sm:text-[10px] font-bold uppercase border-white/5 hover:bg-white/5" onClick={() => refresh()}>
              <RotateCcw className="w-3 h-3 mr-1 sm:mr-2" />
              Atualizar
            </Button>
          </div>
          <div className="h-[280px] sm:h-[320px]">
            <ErrorBoundary name="MainChart"><MainChart /></ErrorBoundary>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
        <div className="lg:col-span-2 glass p-5 sm:p-8 flex flex-col">
          <h3 className="text-[10px] sm:text-xs font-bold text-muted uppercase tracking-widest mb-6 sm:mb-8">Picos por Horário</h3>
          <div className="flex-1 min-h-[250px] sm:min-h-[280px]">
            <ErrorBoundary name="PeakAnalysis"><PeakAnalysis /></ErrorBoundary>
          </div>
        </div>
        <div className="glass p-5 sm:p-8">
          <ErrorBoundary name="AlertsFeed"><AlertsFeed /></ErrorBoundary>
        </div>
      </div>

      <ErrorBoundary name="VideoMetrics"><VideoMetrics /></ErrorBoundary>
    </div>
  );
}

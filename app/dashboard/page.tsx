"use client";

import { useMetaData } from "@/hooks/useMetaData";
import { KpiGrid } from "@/components/kpi/KpiGrid";
import { MainChart } from "@/components/charts/MainChart";
import { AlertsFeed } from "@/components/alerts/AlertsFeed";
import { useAppStore } from "@/store/useAppStore";
import { Button } from "@/components/ui/Button";
import { Maximize2, RotateCcw } from "lucide-react";

import { DashboardFilters } from "@/components/dashboard/DashboardFilters";
import { InsightsGrid } from "@/components/dashboard/InsightsGrid";
import { PeakAnalysis } from "@/components/charts/PeakAnalysis";
import { DirectorModeToggle } from "@/components/dashboard/DirectorModeToggle";
import { PaceMonitor } from "@/components/dashboard/PaceMonitor";
import { VideoMetricsSection } from "@/components/charts/VideoMetricsSection";
import { ExecutiveSummary } from "@/components/dashboard/ExecutiveSummary";

export default function DashboardPage() {
  const { refresh } = useMetaData();
  const { lastSync, isDirectorMode } = useAppStore();

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-white/40">
            Inteligência de Tráfego
          </h1>
          <p className="text-sm text-muted">
            {isDirectorMode ? "Resumo executivo de ROI e resultados." : "Análise avançada de ROI e picos de performance."}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <DirectorModeToggle />
          {lastSync && (
            <span className="text-[10px] font-bold text-muted tabular-nums uppercase tracking-widest opacity-50">
              Sync: {lastSync}
            </span>
          )}
        </div>
      </div>

      <DashboardFilters />
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <ExecutiveSummary />
        <PaceMonitor />
      </div>

      {!isDirectorMode && <InsightsGrid />}

      <KpiGrid />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 glass p-8">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xs font-bold text-muted uppercase tracking-widest flex items-center">
              <span className="w-2 h-2 rounded-full bg-accent mr-2 animate-pulse" />
              Volume Gasto vs leads
            </h3>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="h-8 px-3 text-[10px] font-bold uppercase border-white/5 hover:bg-white/5" onClick={() => refresh()}>
                <RotateCcw className="w-3 h-3 mr-2" />
                Atualizar
              </Button>
            </div>
          </div>
          <div className="h-[320px]">
            <MainChart />
          </div>
        </div>

        <div className="glass p-8 flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xs font-bold text-muted uppercase tracking-widest">Picos por Horário</h3>
          </div>
          <div className="flex-1 min-h-[280px]">
            <PeakAnalysis />
          </div>
        </div>
      </div>

      {!isDirectorMode && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
           <VideoMetricsSection />
           <div className="glass p-8">
             <AlertsFeed />
           </div>
        </div>
      )}

      {isDirectorMode && (
        <div className="glass p-8">
           <AlertsFeed />
        </div>
      )}
    </div>
  );
}

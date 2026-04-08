"use client";

import { useMetaData } from "@/hooks/useMetaData";
import { KpiGrid } from "@/components/kpi/KpiGrid";
import { MainChart } from "@/components/charts/MainChart";
import { AlertsFeed } from "@/components/alerts/AlertsFeed";
import { useAppStore } from "@/store/useAppStore";
import { Button } from "@/components/ui/Button";
import { RotateCcw } from "lucide-react";

import { DashboardFilters } from "@/components/dashboard/DashboardFilters";
import { PeakAnalysis } from "@/components/charts/PeakAnalysis";
import { VideoMetricsSection } from "@/components/charts/VideoMetricsSection";
import { ExecutiveSummary } from "@/components/dashboard/ExecutiveSummary";
import { CylinderFunnel } from "@/components/intelligence/CylinderFunnel";

export default function DashboardPage() {
  const { refresh } = useMetaData();
  const { lastSync } = useAppStore();

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-white/40">
            Painel Executivo
          </h1>
          <p className="text-xs sm:text-sm text-muted">
            Visão geral de investimento, resultados e funil de conversão.
          </p>
        </div>
        <div className="flex items-center gap-4">
          {lastSync && (
            <span className="text-[10px] font-bold text-muted tabular-nums uppercase tracking-widest opacity-50">
              Sync: {lastSync}
            </span>
          )}
        </div>
      </div>

      <DashboardFilters />
      
      <ExecutiveSummary />

      <KpiGrid />

      {/* Funnel + Chart side by side */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 sm:gap-8">
        <CylinderFunnel />

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
            <MainChart />
          </div>
        </div>
      </div>

      {/* Peak + Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
        <div className="lg:col-span-2 glass p-5 sm:p-8 flex flex-col">
          <h3 className="text-[10px] sm:text-xs font-bold text-muted uppercase tracking-widest mb-6 sm:mb-8">Picos por Horário</h3>
          <div className="flex-1 min-h-[250px] sm:min-h-[280px]">
            <PeakAnalysis />
          </div>
        </div>
        <div className="glass p-5 sm:p-8">
          <AlertsFeed />
        </div>
      </div>

      <VideoMetricsSection />
    </div>
  );
}

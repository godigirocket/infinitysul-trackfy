"use client";

import dynamic from "next/dynamic";
import { useMetaData } from "@/hooks/useMetaData";
import { useAppStore } from "@/store/useAppStore";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { safeArray } from "@/lib/safeArray";
import { extractMetric, formatCurrency, formatNumber, CONVERSATION_ACTION_TYPES } from "@/lib/formatters";
import { useMemo, useState, useEffect } from "react";
import { RotateCw, TrendingUp, TrendingDown, Minus, Settings, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

// All charts SSR-disabled
const MainChart    = dynamic(() => import("@/components/charts/MainChart").then(m => ({ default: m.MainChart })), { ssr: false });
const PeakAnalysis = dynamic(() => import("@/components/charts/PeakAnalysis").then(m => ({ default: m.PeakAnalysis })), { ssr: false });
const AlertsFeed   = dynamic(() => import("@/components/alerts/AlertsFeed").then(m => ({ default: m.AlertsFeed })), { ssr: false });

// ── Skeleton ──────────────────────────────────────────────────────────────
function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-2xl bg-white/[0.04]", className)} />;
}

// ── KPI Card ──────────────────────────────────────────────────────────────
function KpiCard({ label, value, sub, trend, loading }: {
  label: string; value: string; sub?: string; trend?: number; loading?: boolean;
}) {
  if (loading) return <Skeleton className="h-28" />;
  return (
    <div className="bg-[#111115] border border-white/[0.06] rounded-2xl p-5 hover:border-white/10 transition-all">
      <p className="text-[11px] font-medium text-white/40 uppercase tracking-widest mb-3">{label}</p>
      <p className="text-3xl font-bold text-white tracking-tight">{value}</p>
      <div className="flex items-center gap-2 mt-2">
        {trend !== undefined && trend !== 0 && (
          <span className={cn("flex items-center gap-1 text-[11px] font-semibold",
            trend > 0 ? "text-emerald-400" : "text-red-400")}>
            {trend > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {trend > 0 ? "+" : ""}{trend.toFixed(1)}%
          </span>
        )}
        {sub && <span className="text-[11px] text-white/30">{sub}</span>}
      </div>
    </div>
  );
}

// ── Section wrapper ───────────────────────────────────────────────────────
function Section({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-[11px] font-semibold text-white/40 uppercase tracking-widest">{title}</h2>
        {action}
      </div>
      {children}
    </div>
  );
}

export default function DashboardPage() {
  const { refresh } = useMetaData();
  const { dataA, dataAds, hourlyDataA, isLoading, lastSync, token, accountId, apiError } = useAppStore();
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const isConfigured = mounted && !!token && !!accountId;
  const hasData = safeArray(dataA).length > 0;
  const hasAds = safeArray(dataAds).length > 0;
  const hasHourly = safeArray(hourlyDataA).length > 0;

  const kpis = useMemo(() => {
    const rows = safeArray(dataA);
    const spend = rows.reduce((s, r) => s + parseFloat(r.spend || "0"), 0);
    const convs = rows.reduce((s, r) => s + extractMetric(r.actions, CONVERSATION_ACTION_TYPES), 0);
    const imps = rows.reduce((s, r) => s + parseInt(r.impressions || "0"), 0);
    const clicks = rows.reduce((s, r) => s + parseInt(r.clicks || "0"), 0);
    const ctr = imps > 0 ? (clicks / imps) * 100 : 0;
    const cpl = convs > 0 ? spend / convs : 0;
    return { spend, convs, imps, clicks, ctr, cpl };
  }, [dataA]);

  // Not configured
  if (mounted && !isConfigured) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center">
          <Settings className="w-8 h-8 text-accent" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-white">Configure sua conta</h1>
          <p className="text-white/40 text-sm max-w-sm">Adicione seu token do Meta Ads para começar a ver os dados.</p>
        </div>
        <Link href="/settings" className="flex items-center gap-2 px-6 py-3 bg-accent text-white rounded-xl font-semibold hover:bg-accent/90 transition-all">
          Ir para Configurações <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-[1400px]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Dashboard</h1>
          <p className="text-[13px] text-white/40 mt-0.5">
            {lastSync && lastSync !== "cache" ? `Atualizado às ${lastSync}` : lastSync === "cache" ? "Dados do cache" : "Aguardando sincronização"}
          </p>
        </div>
        <button onClick={() => refresh()} disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 bg-white/[0.05] border border-white/[0.08] rounded-xl text-[13px] font-medium text-white/70 hover:text-white hover:bg-white/[0.08] transition-all disabled:opacity-40">
          <RotateCw className={cn("w-3.5 h-3.5", isLoading && "animate-spin")} />
          {isLoading ? "Sincronizando..." : "Atualizar"}
        </button>
      </div>

      {/* Error banner */}
      {apiError && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-[13px] text-red-400 flex items-center gap-2">
          <span className="font-semibold">Erro:</span> {apiError}
        </div>
      )}

      {/* KPIs — always render, show skeleton while loading */}
      <Section title="Métricas do Período">
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
          <KpiCard label="Investimento" value={formatCurrency(kpis.spend)} loading={isLoading && !hasData} />
          <KpiCard label="Conversas" value={formatNumber(kpis.convs)} sub={kpis.convs > 0 ? `CPL ${formatCurrency(kpis.cpl)}` : undefined} loading={isLoading && !hasData} />
          <KpiCard label="Impressões" value={formatNumber(kpis.imps)} loading={isLoading && !hasData} />
          <KpiCard label="Cliques" value={formatNumber(kpis.clicks)} loading={isLoading && !hasData} />
          <KpiCard label="CTR" value={`${kpis.ctr.toFixed(2)}%`} loading={isLoading && !hasData} />
          <KpiCard label="CPL" value={kpis.cpl > 0 ? formatCurrency(kpis.cpl) : "—"} loading={isLoading && !hasData} />
        </div>
      </Section>

      {/* Chart + Alerts — only if data exists */}
      {(hasData || isLoading) && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <div className="xl:col-span-2 bg-[#111115] border border-white/[0.06] rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[11px] font-semibold text-white/40 uppercase tracking-widest">Investimento × Conversas</p>
            </div>
            <div className="h-[260px]">
              {isLoading && !hasData ? <Skeleton className="h-full" /> : (
                <ErrorBoundary name="MainChart"><MainChart /></ErrorBoundary>
              )}
            </div>
          </div>
          <div className="bg-[#111115] border border-white/[0.06] rounded-2xl p-5">
            <ErrorBoundary name="AlertsFeed">
              {isLoading && !hasData ? <Skeleton className="h-full min-h-[260px]" /> : <AlertsFeed />}
            </ErrorBoundary>
          </div>
        </div>
      )}

      {/* Hourly peaks — only if hourly data exists */}
      {(hasHourly || (isLoading && hasData)) && (
        <Section title="Picos por Horário">
          <div className="bg-[#111115] border border-white/[0.06] rounded-2xl p-5">
            <div className="h-[220px]">
              <ErrorBoundary name="PeakAnalysis">
                {isLoading && !hasHourly ? <Skeleton className="h-full" /> : <PeakAnalysis />}
              </ErrorBoundary>
            </div>
          </div>
        </Section>
      )}

      {/* Empty state — only if configured but no data and not loading */}
      {mounted && isConfigured && !hasData && !isLoading && (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
          <div className="w-12 h-12 rounded-xl bg-white/[0.04] flex items-center justify-center">
            <Minus className="w-6 h-6 text-white/20" />
          </div>
          <div>
            <p className="text-white/60 font-medium">Nenhum dado para o período selecionado</p>
            <p className="text-white/30 text-sm mt-1">Tente um período diferente ou clique em Atualizar</p>
          </div>
          <button onClick={() => refresh()} className="px-4 py-2 bg-accent text-white rounded-xl text-sm font-semibold hover:bg-accent/90 transition-all">
            Sincronizar agora
          </button>
        </div>
      )}
    </div>
  );
}

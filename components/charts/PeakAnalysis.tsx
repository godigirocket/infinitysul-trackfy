"use client";

import { useAppStore } from "@/store/useAppStore";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import { extractMetric, LEAD_ACTION_TYPES } from "@/lib/formatters";
import { safeArray } from "@/lib/safeArray";
import { useMemo, useState, useEffect, useRef } from "react";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

const HOUR_LABELS = Array.from({ length: 24 }, (_, i) => `${i.toString().padStart(2, "0")}h`);

function parseHour(hourStr: any): number {
  if (hourStr === null || hourStr === undefined) return -1;
  const s = String(hourStr);
  let h: number;
  if (s.includes("_")) {
    h = parseInt(s.split("_")[0]);
  } else {
    h = parseInt(s.split(":")[0]);
  }
  return isNaN(h) || h < 0 || h > 23 ? -1 : h;
}

export function PeakAnalysis() {
  const { hourlyDataA, hourlyDataB, isCompare } = useAppStore();
  const [mounted, setMounted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerHeight, setContainerHeight] = useState(0);

  // ALL hooks must be called unconditionally — no early returns before this point
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver(entries => {
      const h = entries[0]?.contentRect.height ?? 0;
      if (h > 0) setContainerHeight(h);
    });
    ro.observe(containerRef.current);
    // Initial measurement
    setContainerHeight(containerRef.current.getBoundingClientRect().height);
    return () => ro.disconnect();
  }, [mounted]);

  const chartData = useMemo(() => {
    const getStats = (data: any[]) => {
      const stats = new Array(24).fill(0);
      safeArray(data).forEach(item => {
        const hourStr = (item as any)._hourly_field
          || item.hourly_stats_aggregated_by_audience_time_zone;
        const h = parseHour(hourStr);
        if (h === -1) return;
        stats[h] += extractMetric(item.actions, LEAD_ACTION_TYPES);
      });
      return stats;
    };

    const leadsA = getStats(hourlyDataA);
    const datasets: any[] = [
      {
        label: "Leads (Atual)",
        data: leadsA,
        backgroundColor: "#6366f1",
        borderRadius: 4,
        hoverBackgroundColor: "#818cf8",
      },
    ];

    if (isCompare && safeArray(hourlyDataB).length > 0) {
      datasets.push({
        label: "Leads (Anterior)",
        data: getStats(hourlyDataB),
        backgroundColor: "rgba(255,255,255,0.1)",
        borderRadius: 4,
        hoverBackgroundColor: "rgba(255,255,255,0.2)",
      });
    }

    return { labels: HOUR_LABELS, datasets };
  }, [hourlyDataA, hourlyDataB, isCompare]);

  const options = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 400 },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "#111113",
        padding: 12,
        titleFont: { weight: "bold" as const },
        bodyFont: { family: "'JetBrains Mono'" },
        borderColor: "rgba(255,255,255,0.05)",
        borderWidth: 1,
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: "#71717a", font: { size: 10 } },
      },
      y: {
        grid: { color: "rgba(255,255,255,0.05)" },
        ticks: { color: "#71717a", font: { size: 10 } },
        beginAtZero: true,
      },
    },
  }), []);

  const hasData = safeArray(hourlyDataA).length > 0;

  return (
    <div ref={containerRef} className="h-full w-full min-h-[200px]">
      {!mounted || containerHeight <= 0 ? (
        <div className="h-full w-full flex items-center justify-center">
          <div className="w-full h-[200px] bg-white/[0.02] rounded-lg animate-pulse" />
        </div>
      ) : !hasData ? (
        <div className="h-full w-full flex items-center justify-center text-muted/30">
          <p className="text-[10px] font-bold uppercase tracking-widest">Sem dados de horário para o período</p>
        </div>
      ) : (
        <Bar data={chartData} options={options} />
      )}
    </div>
  );
}

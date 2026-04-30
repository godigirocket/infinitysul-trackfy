"use client";

import { useAppStore } from "@/store/useAppStore";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Line } from "react-chartjs-2";
import { extractMetric } from "@/lib/formatters";
import { ComparisonChart } from "./ComparisonChart";
import { Sparkles } from "lucide-react";
import { useState, useEffect } from "react";

ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement,
  Title, Tooltip, Legend, Filler
);

export function MainChart() {
  const { dataA, dataB, isCompare, searchQuery } = useAppStore();
  const [mounted, setMounted] = useState(false);
  // Re-render when theme changes
  const theme = useAppStore(s => s.theme);
  useEffect(() => setMounted(true), []);

  if (!mounted) return <div className="h-full" />;
  if (isCompare && dataB.length > 0) return <ComparisonChart />;

  // Theme-aware colors
  const isDark = theme !== "light";
  const chartText  = isDark ? "#94a3b8" : "#374151";
  const chartGrid  = isDark ? "rgba(255,255,255,0.05)" : "#e5e7eb";
  const chartLine  = isDark ? "#6366f1" : "#3b82f6";
  const chartArea  = isDark ? "rgba(99,102,241,0.15)" : "rgba(59,130,246,0.1)";
  const tooltipBg  = isDark ? "#111827" : "#ffffff";
  const tooltipTxt = isDark ? "#ffffff" : "#111827";
  const spendLine  = isDark ? "rgba(255,255,255,0.45)" : "rgba(100,116,139,0.7)";
  const spendArea  = isDark ? "rgba(255,255,255,0.03)" : "rgba(100,116,139,0.05)";

  const getDaily = (data: any[]) => {
    const daily: Record<string, { spend: number; leads: number }> = {};
    data.forEach(r => {
      const matchesSearch = !searchQuery ||
        (r.campaign_name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (r.ad_name || "").toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchesSearch) return;
      const ds = r.date_start;
      if (!ds) return;
      if (!daily[ds]) daily[ds] = { spend: 0, leads: 0 };
      daily[ds].spend += parseFloat(r.spend || "0");
      daily[ds].leads += extractMetric(r.actions, [
        "lead", "leadgen.other", "offsite_conversion.fb_pixel_lead",
        "complete_registration",
        "onsite_conversion.messaging_conversation_started_7d",
        "onsite_conversion.messaging_first_reply",
      ]);
    });
    return daily;
  };

  const dtaA = getDaily(dataA);
  const datesA = Object.keys(dtaA).sort();
  const labels = datesA.map(d => d.split("-").slice(1).reverse().join("/"));
  const leadsA = datesA.map(d => dtaA[d].leads);
  const spendA = datesA.map(d => dtaA[d].spend);

  const datasets = [
    {
      label: "Conversas/Leads",
      data: leadsA,
      borderColor: chartLine,
      backgroundColor: chartArea,
      fill: true,
      tension: 0.4,
      pointRadius: 4,
      pointHoverRadius: 7,
      pointBackgroundColor: chartLine,
      pointBorderColor: chartLine,
      borderWidth: 3,
      yAxisID: "yL",
    },
    {
      label: "Investimento (R$)",
      data: spendA,
      borderColor: spendLine,
      backgroundColor: spendArea,
      fill: true,
      borderDash: [5, 5],
      tension: 0.4,
      pointRadius: 2,
      borderWidth: 1.5,
      yAxisID: "yG",
    },
  ];

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: "index" as const, intersect: false },
    plugins: {
      legend: {
        display: true,
        position: "top" as const,
        labels: {
          color: chartText,
          font: { size: 10, weight: "bold" as const },
          padding: 20,
          usePointStyle: true,
          pointStyle: "circle" as const,
        },
      },
      tooltip: {
        backgroundColor: tooltipBg,
        padding: 16,
        titleFont: { weight: "bold" as const, size: 12 },
        titleColor: tooltipTxt,
        bodyColor: tooltipTxt,
        bodyFont: { family: "'JetBrains Mono'", size: 11 },
        borderColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)",
        borderWidth: 1,
        cornerRadius: 12,
        displayColors: true,
        callbacks: {
          label: (ctx: any) => {
            if (ctx.dataset.yAxisID === "yG") return ` Investimento: R$ ${ctx.raw.toFixed(2)}`;
            return ` Conversas: ${ctx.raw}`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: chartText, font: { size: 10 }, maxRotation: 45 },
        border: { color: chartGrid },
      },
      yL: {
        type: "linear" as const,
        display: true,
        position: "right" as const,
        grid: { color: chartGrid },
        ticks: { color: chartLine, font: { size: 10, weight: "bold" as const } },
        title: { display: true, text: "Conversas", color: chartLine, font: { size: 10 } },
      },
      yG: {
        type: "linear" as const,
        display: true,
        position: "left" as const,
        grid: { display: false },
        ticks: { color: chartText, font: { size: 10 }, callback: (v: any) => `R$${v}` },
        title: { display: true, text: "Investimento", color: chartText, font: { size: 10 } },
      },
    },
  };

  if (dataA.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center" style={{ color: "var(--text-3)" }}>
        <Sparkles className="w-8 h-8 mb-2 animate-pulse" />
        <span className="text-[10px] font-bold uppercase tracking-widest">Sincronize com a Meta para ver o gráfico</span>
      </div>
    );
  }

  return <Line data={{ labels, datasets }} options={options} />;
}

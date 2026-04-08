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

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export function MainChart() {
  const { dataA, dataB, isCompare, searchQuery } = useAppStore();

  if (isCompare && dataB.length > 0) {
    return <ComparisonChart />;
  }

  const getDaily = (data: any[]) => {
    const daily: Record<string, { spend: number; leads: number }> = {};
    data.forEach(r => {
      // Only filter by search — remove the broken status filter
      const matchesSearch = !searchQuery || 
        (r.campaign_name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (r.ad_name || "").toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchesSearch) return;

      const ds = r.date_start;
      if (!ds) return;
      if (!daily[ds]) daily[ds] = { spend: 0, leads: 0 };
      daily[ds].spend += parseFloat(r.spend || "0");
      daily[ds].leads += extractMetric(r.actions, [
        'lead', 'leadgen.other', 'offsite_conversion.fb_pixel_lead',
        'complete_registration'
      ]);
    });
    return daily;
  };

  const dtaA = getDaily(dataA);
  const datesA = Object.keys(dtaA).sort();
  
  const labels = datesA.map(d => d.split('-').slice(1).reverse().join('/'));
  const leadsA = datesA.map(d => dtaA[d].leads);
  const spendA = datesA.map(d => dtaA[d].spend);

  const datasets = [
    {
      label: "Leads",
      data: leadsA,
      borderColor: "#6366f1",
      backgroundColor: "rgba(99, 102, 241, 0.15)",
      fill: true,
      tension: 0.4,
      pointRadius: 4,
      pointHoverRadius: 7,
      pointBackgroundColor: "#6366f1",
      pointBorderColor: "#6366f1",
      borderWidth: 3,
      yAxisID: "yL",
    },
    {
      label: "Investimento (R$)",
      data: spendA,
      borderColor: "rgba(255, 255, 255, 0.5)",
      backgroundColor: "rgba(255, 255, 255, 0.03)",
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
    interaction: {
      mode: "index" as const,
      intersect: false,
    },
    plugins: {
      legend: {
        display: true,
        position: "top" as const,
        labels: {
          color: "rgba(255,255,255,0.5)",
          font: { size: 10, weight: "bold" as const },
          padding: 20,
          usePointStyle: true,
          pointStyle: "circle" as const,
        },
      },
      tooltip: {
        backgroundColor: "#111113",
        padding: 16,
        titleFont: { weight: "bold" as const, size: 12 },
        bodyFont: { family: "'JetBrains Mono'", size: 11 },
        borderColor: "rgba(255,255,255,0.1)",
        borderWidth: 1,
        cornerRadius: 12,
        displayColors: true,
        callbacks: {
          label: (ctx: any) => {
            if (ctx.dataset.yAxisID === "yG") {
              return ` Investimento: R$ ${ctx.raw.toFixed(2)}`;
            }
            return ` Leads: ${ctx.raw}`;
          }
        }
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: "#71717a", font: { size: 10 }, maxRotation: 45 },
      },
      yL: {
        type: "linear" as const,
        display: true,
        position: "right" as const,
        grid: { color: "rgba(99, 102, 241, 0.08)" },
        ticks: { color: "#6366f1", font: { size: 10, weight: "bold" as const } },
        title: { display: true, text: "Leads", color: "#6366f1", font: { size: 10 } }
      },
      yG: {
        type: "linear" as const,
        display: true,
        position: "left" as const,
        grid: { display: false },
        ticks: { color: "#71717a", font: { size: 10 }, callback: (v: any) => `R$${v}` },
        title: { display: true, text: "Investimento", color: "#71717a", font: { size: 10 } }
      },
    },
  };

  if (dataA.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-muted/30">
        <Sparkles className="w-8 h-8 mb-2 animate-pulse" />
        <span className="text-[10px] font-bold uppercase tracking-widest">Sincronize com a Meta para ver o gráfico</span>
      </div>
    );
  }

  return <Line data={{ labels, datasets }} options={options} />;
}

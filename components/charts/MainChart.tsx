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
  const { dataA, dataB, isCompare, searchQuery, statusFilter } = useAppStore();

  if (isCompare && dataB.length > 0) {
    return <ComparisonChart />;
  }

  const filterItem = (item: any) => {
    const matchesSearch = item.campaign_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.ad_name?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || 
                          (statusFilter === "active" && item.campaign_status === "ACTIVE") ||
                          (statusFilter === "paused" && item.campaign_status === "PAUSED");

    return matchesSearch && matchesStatus;
  };

  const getDaily = (data: any[]) => {
    const daily: Record<string, { spend: number; leads: number }> = {};
    data.forEach(r => {
      if (!filterItem(r)) return;
      const ds = r.date_start;
      if (!daily[ds]) daily[ds] = { spend: 0, leads: 0 };
      daily[ds].spend += parseFloat(r.spend || 0);
      daily[ds].leads += extractMetric(r.actions, ['lead']);
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
      label: "Leads (Atual)",
      data: leadsA,
      borderColor: "#6366f1",
      backgroundColor: "rgba(99, 102, 241, 0.1)",
      fill: true,
      tension: 0.4,
      yAxisID: "yL",
    },
    {
      label: "Gasto (Atual)",
      data: spendA,
      borderColor: "rgba(255, 255, 255, 0.8)",
      borderDash: [5, 5],
      tension: 0.4,
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
        display: false,
      },
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
      yL: {
        type: "linear" as const,
        display: true,
        position: "right" as const,
        grid: { color: "rgba(255,255,255,0.05)" },
        ticks: { color: "#6366f1", font: { size: 10 } },
      },
      yG: {
        type: "linear" as const,
        display: true,
        position: "left" as const,
        grid: { display: false },
        ticks: { color: "#71717a", font: { size: 10 } },
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

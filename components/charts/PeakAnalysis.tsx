"use client";

import { useAppStore } from "@/store/useAppStore";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import { extractMetric } from "@/lib/formatters";
import { useMemo } from "react";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export function PeakAnalysis() {
  const { hourlyDataA, hourlyDataB, isCompare, searchQuery, statusFilter } = useAppStore();

  const filterItem = (item: any) => {
    const matchesSearch = item.campaign_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.ad_name?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || 
                          (statusFilter === "active" && item.campaign_status === "ACTIVE") ||
                          (statusFilter === "paused" && item.campaign_status === "PAUSED");

    return matchesSearch && matchesStatus;
  };

  const chartData = useMemo(() => {
    const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, "0"));
    
    const getHourlyStats = (data: any[]) => {
      const stats = Array(24).fill(0);
      data.forEach(item => {
        if (!filterItem(item)) return;
        const hourStr = item.hourly_stats_aggregated_by_audience_time_zone;
        if (!hourStr) return;
        
        // Format: "00:00-00:59" or "0"
        const hour = parseInt(hourStr.split(":")[0]);
        if (isNaN(hour)) return;
        
        stats[hour] += extractMetric(item.actions, ['lead', 'leadgen.other', 'offsite_conversion.fb_pixel_lead']);
      });
      return stats;
    };

    const leadsA = getHourlyStats(hourlyDataA);
    
    const datasets = [
      {
        label: "Leads (Atual)",
        data: leadsA,
        backgroundColor: "#6366f1",
        borderRadius: 4,
        hoverBackgroundColor: "#818cf8",
      },
    ];

    if (isCompare && hourlyDataB.length > 0) {
      const leadsB = getHourlyStats(hourlyDataB);
      datasets.push({
        label: "Leads (Anterior)",
        data: leadsB,
        backgroundColor: "rgba(255, 255, 255, 0.1)",
        borderRadius: 4,
        hoverBackgroundColor: "rgba(255, 255, 255, 0.2)",
      } as any);
    }

    return {
      labels: hours.map(h => `${h}h`),
      datasets,
    };
  }, [hourlyDataA, hourlyDataB, isCompare]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
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
      y: {
        grid: { color: "rgba(255,255,255,0.05)" },
        ticks: { color: "#71717a", font: { size: 10 } },
      },
    },
  };

  return (
    <div className="h-full w-full">
      <Bar data={chartData} options={options} />
    </div>
  );
}

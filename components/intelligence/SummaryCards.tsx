"use client";

import { useAppStore } from "@/store/useAppStore";
import { formatCurrency } from "@/lib/formatters";
import { 
  DollarSign, Users, Target, 
  MessageCircle, TrendingUp, AlertCircle 
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SummaryProps {
  summary: {
    totalSpend: number;
    totalLeads: number;
    avgCpl: number;
    totalConversations: number;
    scalable: number;
    needsAttention: number;
  }
}

export function SummaryCards({ summary }: SummaryProps) {
  const cards = [
    { 
      label: "Investimento Total", 
      value: formatCurrency(summary.totalSpend), 
      icon: DollarSign, 
      color: "text-white",
      bg: "bg-white/10"
    },
    { 
      label: "CPL Médio Geral", 
      value: formatCurrency(summary.avgCpl), 
      icon: Target, 
      color: "text-accent",
      bg: "bg-accent/10"
    },
    { 
      label: "Conversas/Leads", 
      value: (summary.totalLeads > 0 ? summary.totalLeads : summary.totalConversations).toLocaleString("pt-BR"), 
      icon: Users, 
      color: "text-success",
      bg: "bg-success/10"
    },
    { 
      label: "Conversas Iniciadas", 
      value: summary.totalConversations.toLocaleString("pt-BR"), 
      icon: MessageCircle, 
      color: "text-warning",
      bg: "bg-warning/10"
    },
    { 
      label: "Campanhas Escalar 🟢", 
      value: summary.scalable.toString(), 
      icon: TrendingUp, 
      color: "text-success",
      bg: "bg-success/5 border border-success/20"
    },
    { 
      label: "Atenção / Corte 🔴", 
      value: summary.needsAttention.toString(), 
      icon: AlertCircle, 
      color: "text-danger",
      bg: "bg-danger/5 border border-danger/20"
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {cards.map((card) => (
        <div 
          key={card.label} 
          className={cn(
            "glass p-5 flex flex-col gap-3 group transition-all hover:scale-[1.03] hover:bg-white/[0.04]",
            card.bg
          )}
        >
          <div className={cn("p-2 w-fit rounded-lg shadow-sm border border-white/10", card.bg)}>
            <card.icon className={cn("w-4 h-4", card.color)} />
          </div>
          <div className="flex flex-col gap-0.5">
            <span className={cn("text-lg font-black mono tracking-tight", card.color)}>
              {card.value}
            </span>
            <span className="text-[10px] font-bold text-muted uppercase tracking-widest leading-none">
              {card.label}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

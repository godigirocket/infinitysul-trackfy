"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAppStore } from "@/store/useAppStore";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, Brain, Megaphone, Image, Link2, Plug,
  ShoppingCart, TrendingUp, BarChart3, Receipt, Wallet,
  GitBranch, Bell, Settings, LogOut, Zap,
} from "lucide-react";

const NAV = [
  {
    group: "Core",
    items: [
      { label: "Dashboard",      href: "/dashboard",           icon: LayoutDashboard },
      { label: "Intelligence",   href: "/intelligence",         icon: Brain },
      { label: "Campanhas",      href: "/campaigns",            icon: Megaphone },
      { label: "Criativos",      href: "/campaigns/creatives",  icon: Image },
    ],
  },
  {
    group: "Rastreamento",
    items: [
      { label: "UTMs",           href: "/utms",                 icon: Link2 },
      { label: "Integrações",    href: "/integrations",         icon: Plug },
    ],
  },
  {
    group: "Financeiro",
    items: [
      { label: "Pedidos",        href: "/orders",               icon: ShoppingCart },
      { label: "Financeiro",     href: "/financial",            icon: TrendingUp },
      { label: "Relatórios",     href: "/reports",              icon: BarChart3 },
    ],
  },
  {
    group: "Config",
    items: [
      { label: "Impostos",       href: "/config/taxes",         icon: Receipt },
      { label: "Despesas",       href: "/config/expenses",      icon: Wallet },
      { label: "Regras",         href: "/config/rules",         icon: GitBranch },
      { label: "Notificações",   href: "/config/notifications", icon: Bell },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { lastSync, isLoading, token } = useAppStore();

  const isActive = (href: string) =>
    pathname === href || (href !== "/dashboard" && href.length > 1 && pathname.startsWith(href + "/"));

  const syncStatus = isLoading ? "syncing" : token ? "connected" : "disconnected";

  return (
    <aside className="fixed inset-y-0 left-0 w-[220px] flex flex-col z-50 border-r border-white/[0.05]"
      style={{ background: "linear-gradient(180deg, #0a0f1e 0%, #020617 100%)" }}>

      {/* Logo */}
      <div className="flex items-center gap-3 px-5 h-14 border-b border-white/[0.05] flex-shrink-0">
        <div className="w-7 h-7 rounded-lg bg-gradient-accent flex items-center justify-center flex-shrink-0 shadow-glow-accent">
          <Zap className="w-4 h-4 text-white" fill="white" />
        </div>
        <div>
          <span className="text-sm font-bold tracking-tight text-white">TRACKFY</span>
          <p className="text-[9px] text-white/30 font-medium uppercase tracking-widest -mt-0.5">Growth OS</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-5 custom-scrollbar">
        {NAV.map(section => (
          <div key={section.group}>
            <p className="text-[9px] font-semibold text-white/25 uppercase tracking-[0.12em] px-2 mb-1.5">
              {section.group}
            </p>
            <div className="space-y-0.5">
              {section.items.map(item => {
                const active = isActive(item.href);
                return (
                  <Link key={item.href} href={item.href}
                    className={cn(
                      "flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] font-medium transition-all duration-150 group relative",
                      active
                        ? "bg-accent/15 text-white"
                        : "text-white/40 hover:text-white/80 hover:bg-white/[0.04]"
                    )}>
                    {active && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-accent rounded-full" />
                    )}
                    <item.icon className={cn("w-4 h-4 flex-shrink-0 transition-colors",
                      active ? "text-accent" : "text-white/30 group-hover:text-white/60")} />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom section */}
      <div className="px-3 pb-4 space-y-2 flex-shrink-0 border-t border-white/[0.05] pt-3">
        {/* Settings */}
        <Link href="/settings"
          className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] font-medium text-white/40 hover:text-white/80 hover:bg-white/[0.04] transition-all group">
          <Settings className="w-4 h-4 text-white/30 group-hover:text-white/60 transition-colors" />
          Configurações
        </Link>

        {/* Sync status */}
        <div className="flex items-center gap-2 px-2.5 py-1.5">
          <div className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0",
            syncStatus === "syncing" ? "bg-warning animate-pulse" :
            syncStatus === "connected" ? "bg-success animate-pulse" : "bg-white/20")} />
          <span className="text-[11px] text-white/30">
            {syncStatus === "syncing" ? "Sincronizando..." :
             syncStatus === "connected" && lastSync && lastSync !== "cache" ? `Sync ${lastSync}` :
             syncStatus === "connected" ? "Conectado" : "Desconectado"}
          </span>
        </div>
      </div>
    </aside>
  );
}

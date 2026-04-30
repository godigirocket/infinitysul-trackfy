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
    <aside className="fixed inset-y-0 left-0 w-[220px] flex flex-col z-50 border-r"
      style={{ background: "var(--bg-2)", borderColor: "var(--border)" }}>

      {/* Logo */}
      <div className="flex items-center gap-3 px-5 h-14 border-b flex-shrink-0"
        style={{ borderColor: "var(--border)" }}>
        <div className="w-7 h-7 rounded-lg bg-gradient-accent flex items-center justify-center flex-shrink-0">
          <Zap className="w-4 h-4 text-white" fill="white" />
        </div>
        <div>
          <span className="text-sm font-bold tracking-tight" style={{ color: "var(--text)" }}>TRACKFY</span>
          <p className="text-[9px] font-medium uppercase tracking-widest -mt-0.5" style={{ color: "var(--text-3)" }}>Growth OS</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-5 custom-scrollbar">
        {NAV.map(section => (
          <div key={section.group}>
            <p className="text-[9px] font-semibold uppercase tracking-[0.12em] px-2 mb-1.5" style={{ color: "var(--text-3)" }}>
              {section.group}
            </p>
            <div className="space-y-0.5">
              {section.items.map(item => {
                const active = isActive(item.href);
                return (
                  <Link key={item.href} href={item.href}
                    className={cn(
                      "flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] font-medium transition-all duration-150 group relative",
                    )}
                    style={{
                      background: active ? "rgba(124,58,237,0.1)" : "transparent",
                      color: active ? "var(--accent)" : "var(--text-2)",
                    }}
                    onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = "var(--surface-3)"; }}
                    onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                  >
                    {active && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-accent rounded-full" />
                    )}
                    <item.icon className="w-4 h-4 flex-shrink-0" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom section */}
      <div className="px-3 pb-4 space-y-2 flex-shrink-0 border-t pt-3" style={{ borderColor: "var(--border)" }}>
        <Link href="/settings"
          className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] font-medium transition-all group"
          style={{ color: "var(--text-2)" }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "var(--surface-3)"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
        >
          <Settings className="w-4 h-4 flex-shrink-0" />
          Configurações
        </Link>

        {/* Sync status */}
        <div className="flex items-center gap-2 px-2.5 py-1.5">
          <div className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0",
            syncStatus === "syncing" ? "bg-warning animate-pulse" :
            syncStatus === "connected" ? "bg-success animate-pulse" : "bg-[var(--surface-3)]")} />
          <span className="text-[11px]" style={{ color: "var(--text-3)" }}>
            {syncStatus === "syncing" ? "Sincronizando..." :
             syncStatus === "connected" && lastSync && lastSync !== "cache" ? `Sync ${lastSync}` :
             syncStatus === "connected" ? "Conectado" : "Desconectado"}
          </span>
        </div>
      </div>
    </aside>
  );
}

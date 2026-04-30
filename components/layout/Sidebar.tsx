"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAppStore } from "@/store/useAppStore";
import {
  LayoutDashboard, Brain, Megaphone, Zap, Settings, LogOut,
  Link2, Plug, ShoppingCart, TrendingUp, BarChart3,
  Receipt, Wallet, GitBranch, Bell,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SYSTEM_MODULES, GROUP_LABELS, SystemModule } from "@/lib/modules";

const ICON_MAP: Record<string, any> = {
  LayoutDashboard, Brain, Megaphone, Zap, Settings, LogOut,
  Link2, Plug, ShoppingCart, TrendingUp, BarChart3,
  Receipt, Wallet, GitBranch, Bell,
};

const GROUP_ORDER = ["core", "tracking", "financial", "config", "advanced"];

export function Sidebar() {
  const pathname = usePathname();
  const { lastSync, isLoading, token } = useAppStore();

  const grouped = GROUP_ORDER.reduce((acc, group) => {
    const items = SYSTEM_MODULES.filter(m => m.group === group && m.enabled);
    if (items.length > 0) acc[group] = items;
    return acc;
  }, {} as Record<string, SystemModule[]>);

  return (
    <aside className="fixed inset-y-0 left-0 w-64 bg-surface border-r border-white/5 flex flex-col z-50 overflow-y-auto">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-6 border-b border-white/5">
        <div className="bg-accent rounded-lg p-1.5 shadow-sm flex-shrink-0">
          <Zap className="w-5 h-5 text-white" fill="white" />
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-lg font-bold tracking-tight text-white">
            Track<span className="text-accent underline decoration-2 underline-offset-4">fy</span>
          </span>
          <span className="text-[8px] font-bold text-muted uppercase tracking-[0.2em] -mt-1 truncate">
            Growth OS
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-4 space-y-5">
        {Object.entries(grouped).map(([group, items]) => (
          <div key={group}>
            <p className="text-[9px] font-bold text-muted uppercase tracking-widest px-3 mb-2 opacity-50">
              {GROUP_LABELS[group]}
            </p>
            <div className="space-y-0.5">
              {items.map(item => {
                const Icon = ICON_MAP[item.icon] || Settings;
          const isActive = pathname === item.href ||
                  (item.href.length > 1 && pathname === item.href) ||
                  (item.href !== "/dashboard" && item.href !== "/" && pathname.startsWith(item.href + "/"));
                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 group relative",
                      isActive
                        ? "bg-white/5 text-white border border-white/5"
                        : "text-muted hover:text-white hover:bg-white/[0.03] border border-transparent"
                    )}
                  >
                    <Icon className={cn(
                      "w-4 h-4 transition-transform duration-300 flex-shrink-0",
                      isActive ? "text-accent scale-110" : "text-muted group-hover:text-white group-hover:scale-110"
                    )} />
                    <span className="truncate">{item.name}</span>
                    {item.badge && (
                      <span className="ml-auto text-[9px] font-bold px-1.5 py-0.5 bg-accent/20 text-accent rounded-full">
                        {item.badge}
                      </span>
                    )}
                    {isActive && <div className="absolute right-0 w-1 h-3 bg-accent rounded-full" />}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-4 pb-4 pt-2 border-t border-white/5 space-y-3">
        <div className="px-3 py-3 bg-white/[0.02] rounded-2xl border border-white/5">
          <p className="text-[9px] font-bold text-muted uppercase tracking-wider mb-1 flex items-center gap-2">
            <div className={cn("w-1 h-1 rounded-full", isLoading ? "bg-warning animate-pulse" : token ? "bg-success animate-pulse" : "bg-muted")} />
            Meta Ads
          </p>
          <p className="text-[10px] text-white/50">
            {isLoading ? "Sincronizando..." : lastSync && lastSync !== "cache" ? `Sync ${lastSync}` : lastSync === "cache" ? "Cache" : "Não sincronizado"}
          </p>
        </div>
        <button
          onClick={() => {
            if (confirm("Deseja sair? As chaves locais serão limpas.")) {
              localStorage.clear();
              window.location.href = "/settings";
            }
          }}
          className="flex items-center gap-3 px-3 py-2.5 w-full rounded-xl text-xs font-bold text-danger/70 hover:text-danger hover:bg-danger/10 transition-all group"
        >
          <LogOut className="w-4 h-4 transition-transform group-hover:rotate-12" />
          Sair do Sistema
        </button>
      </div>
    </aside>
  );
}

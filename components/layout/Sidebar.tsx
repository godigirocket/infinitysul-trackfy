"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  TrendingUp, 
  Megaphone, 
  Settings, 
  Zap,
  LogOut,
  Target,
  BarChart2,
  Brain
} from "lucide-react";
import { cn } from "@/components/ui/Button";

const navigation = [
  { name: "Dashboard AI", href: "/dashboard", icon: LayoutDashboard },
  { name: "Central de Inteligência", href: "/intelligence", icon: Brain },
  { name: "Análise Visual", href: "/campaigns/creatives", icon: Zap },
  { name: "Gestão VIP/CRM", href: "/crm", icon: Target },
  { name: "ROI por Produto", href: "/simulator", icon: BarChart2 },
  { name: "Configurações", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 w-64 bg-surface border-r border-white/5 p-6 flex flex-col z-50">
      <div className="flex items-center gap-3 mb-10 px-2 relative">
        <div className="bg-accent rounded-lg p-1.5 shadow-sm">
          <Zap className="w-5 h-5 text-white" fill="white" />
        </div>
        <div className="flex flex-col">
          <span className="text-lg font-bold tracking-tight text-white">
            Track<span className="text-accent underline decoration-2 underline-offset-4">fy</span>
          </span>
          <span className="text-[8px] font-bold text-muted uppercase tracking-[0.2em] -mt-1">
            Super Dash Elite
          </span>
        </div>
      </div>

      <nav className="flex-1 space-y-1">
        <p className="text-[9px] font-bold text-muted uppercase tracking-widest px-3 mb-4 opacity-50">
          Navegação Principal
        </p>
        
        {navigation.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-3 rounded-xl text-xs font-bold transition-all duration-200 group relative",
                isActive 
                  ? "bg-white/5 text-white border border-white/5" 
                  : "text-muted hover:text-text hover:bg-white/[0.02] border border-transparent"
              )}
            >
              <item.icon className={cn(
                "w-4 h-4 transition-transform duration-300",
                isActive ? "text-accent scale-110" : "text-muted group-hover:text-text group-hover:scale-110"
              )} />
              {item.name}
              
              {isActive && (
                <div className="absolute right-0 w-1 h-3 bg-accent rounded-full" />
              )}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto space-y-4 pt-6 border-t border-white/5">
        <div className="px-3 py-4 bg-white/[0.02] rounded-2xl border border-white/5 group hover:border-white/10 transition-all">
          <p className="text-[9px] font-bold text-muted uppercase tracking-wider mb-2 flex items-center gap-2">
            <div className="w-1 h-1 rounded-full bg-success animate-pulse" />
            Meta Ads Sync
          </p>
          <p className="text-[10px] text-white/50 tabular-nums transition-colors group-hover:text-white/80" id="sync-label">
            Atualizado 2m atrás
          </p>
        </div>
        
        <button
          onClick={() => {
            if(confirm("Deseja realmente sair? As chaves localmente serão limpas.")) {
              localStorage.clear();
              window.location.href = "/settings";
            }
          }}
          className="flex items-center gap-3 px-3 py-3 w-full rounded-xl text-xs font-bold text-danger/70 hover:text-danger hover:bg-danger/10 transition-all group"
        >
          <LogOut className="w-4 h-4 transition-transform group-hover:rotate-12" />
          Sair do Sistema
        </button>
      </div>
    </aside>
  );
}

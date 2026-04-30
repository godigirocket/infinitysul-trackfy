/**
 * Module registry — defines all available system modules.
 * Each module has a route, icon name, and group.
 * The sidebar reads this to render navigation dynamically.
 */

export interface SystemModule {
  id: string;
  name: string;
  href: string;
  icon: string;
  group: "core" | "tracking" | "financial" | "config" | "advanced";
  enabled: boolean;
  badge?: string;
}

export const SYSTEM_MODULES: SystemModule[] = [
  // ── Core ──────────────────────────────────────────────────────────────
  { id: "dashboard",     name: "Dashboard",           href: "/dashboard",           icon: "LayoutDashboard", group: "core",      enabled: true },
  { id: "intelligence",  name: "Inteligência",         href: "/intelligence",         icon: "Brain",           group: "core",      enabled: true },
  { id: "campaigns",     name: "Campanhas",            href: "/campaigns",            icon: "Megaphone",       group: "core",      enabled: true },
  { id: "creatives",     name: "Criativos",            href: "/campaigns/creatives",  icon: "Zap",             group: "core",      enabled: true },

  // ── Tracking ──────────────────────────────────────────────────────────
  { id: "utms",          name: "UTMs & Tracking",      href: "/utms",                 icon: "Link2",           group: "tracking",  enabled: true },
  { id: "integrations",  name: "Integrações",          href: "/integrations",         icon: "Plug",            group: "tracking",  enabled: true },

  // ── Financial ─────────────────────────────────────────────────────────
  { id: "orders",        name: "Pedidos & Vendas",     href: "/orders",               icon: "ShoppingCart",    group: "financial", enabled: true },
  { id: "financial",     name: "Financeiro",           href: "/financial",            icon: "TrendingUp",      group: "financial", enabled: true },
  { id: "reports",       name: "Relatórios",           href: "/reports",              icon: "BarChart3",       group: "financial", enabled: true },

  // ── Config ────────────────────────────────────────────────────────────
  { id: "taxes",         name: "Impostos",             href: "/config/taxes",         icon: "Receipt",         group: "config",    enabled: true },
  { id: "expenses",      name: "Despesas",             href: "/config/expenses",      icon: "Wallet",          group: "config",    enabled: true },
  { id: "rules",         name: "Regras",               href: "/config/rules",         icon: "GitBranch",       group: "config",    enabled: true },
  { id: "notifications", name: "Notificações",         href: "/config/notifications", icon: "Bell",            group: "config",    enabled: true },

  // ── Advanced ──────────────────────────────────────────────────────────
  { id: "settings",      name: "Configurações",        href: "/settings",             icon: "Settings",        group: "advanced",  enabled: true },
];

export const GROUP_LABELS: Record<string, string> = {
  core:      "Principal",
  tracking:  "Rastreamento",
  financial: "Financeiro",
  config:    "Configurações",
  advanced:  "Avançado",
};

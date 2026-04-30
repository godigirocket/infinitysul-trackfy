"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { CampaignDrawer } from "@/components/campaigns/CampaignDrawer";

// Pages that use the full app shell (sidebar + topbar)
const APP_ROUTES = [
  "/dashboard", "/intelligence", "/campaigns", "/utms",
  "/integrations", "/orders", "/financial", "/reports",
  "/config", "/settings", "/crm", "/simulator",
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isApp = APP_ROUTES.some(r => pathname === r || pathname.startsWith(r + "/"));

  if (!isApp) {
    // Landing page — no chrome
    return <>{children}</>;
  }

  return (
    <>
      <Sidebar />
      <Topbar />
      <CampaignDrawer />
      <main
        className="min-h-screen"
        style={{ marginLeft: "220px", paddingTop: "56px" }}
        suppressHydrationWarning
      >
        <div className="max-w-[1440px] mx-auto p-6 lg:p-8">
          {children}
        </div>
      </main>
    </>
  );
}

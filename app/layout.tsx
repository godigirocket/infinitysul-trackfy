import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains-mono" });

export const metadata: Metadata = {
  title: "Trackfy — Growth OS",
  description: "Marketing Command Center. Track campaigns, creatives and profit in one intelligent platform.",
};

import { CampaignDrawer } from "@/components/campaigns/CampaignDrawer";
import { StoreHydration } from "@/components/StoreHydration";
import { ToastProvider } from "@/components/ui/Toast";
import { ChatAssistant } from "@/components/chat/ChatAssistant";
import { AppShell } from "@/components/layout/AppShell";

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  // Landing page (/) gets no sidebar/topbar
  return (
    <html lang="pt-BR" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="antialiased" suppressHydrationWarning>
        <ToastProvider>
          <StoreHydration />
          <AppShell>{children}</AppShell>
          <ChatAssistant />
        </ToastProvider>
      </body>
    </html>
  );
}

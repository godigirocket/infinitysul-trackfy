import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";

const inter = Inter({ 
  subsets: ["latin"], 
  variable: "--font-inter" 
});

const jetbrainsMono = JetBrains_Mono({ 
  subsets: ["latin"], 
  variable: "--font-jetbrains-mono" 
});

export const metadata: Metadata = {
  title: "Trackfy — Inteligência de ROI",
  description: "Tráfego Pago sob medida para a Infinity Sul.",
};

import { CampaignDrawer } from "@/components/campaigns/CampaignDrawer";
import { StoreHydration } from "@/components/StoreHydration";
import { ToastProvider } from "@/components/ui/Toast";
import { ChatAssistant } from "@/components/chat/ChatAssistant";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="antialiased font-sans" suppressHydrationWarning>
        <ToastProvider>
          <StoreHydration />
          <div className="bg-mesh" />
          <Sidebar />
          <Topbar />
          <CampaignDrawer />
          <main className="ml-64 pt-16 min-h-screen" suppressHydrationWarning>
            <div className="p-4 sm:p-6 lg:p-8">
              {children}
            </div>
          </main>
          <ChatAssistant />
        </ToastProvider>
      </body>
    </html>
  );
}

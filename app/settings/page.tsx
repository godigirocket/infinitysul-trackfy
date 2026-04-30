"use client";

import { useAppStore } from "@/store/useAppStore";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { 
  Key, 
  User, 
  ShieldCheck, 
  Bot, 
  Save, 
  CheckCircle2, 
  XCircle,
  Database
} from "lucide-react";
import { useState, useEffect } from "react";
import { fetchMetaInsights } from "@/services/metaApi";
import { runRefresh, clearFetchCache } from "@/hooks/useMetaData";

export default function SettingsPage() {
  const { 
    token, setToken, 
    accountId, setAccountId, 
    geminiKey, setGeminiKey
  } = useAppStore();

  const [mounted, setMounted] = useState(false);
  const [testStatus, setTestStatus] = useState<"idle" | "testing" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => { setMounted(true); }, []);

  const handleTest = async () => {
    if (!token || !accountId) return;
    setTestStatus("testing");
    try {
      await fetchMetaInsights(accountId, token, { period: "today" });
      setTestStatus("success");
    } catch (e: any) {
      setTestStatus("error");
      setErrorMsg(e.message);
    }
  };

  const handleSave = () => {
    clearFetchCache();
    runRefresh();
    window.location.href = "/dashboard";
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Configurações API</h1>
          <p className="text-sm text-muted">Gerencie suas chaves de acesso e preferências.</p>
        </div>
      </div>

      <div className="glass p-10 space-y-10">
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 text-accent" />
            </div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted">Meta Ads API</h3>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-muted uppercase tracking-wider ml-1">Meta Access Token</label>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted/50" />
                <Input 
                  type="password" 
                  value={mounted ? token : ""}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="EAAB..." 
                  className="pl-10 h-11 bg-white/[0.02]"
                  suppressHydrationWarning
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold text-muted uppercase tracking-wider ml-1">Ad Account ID</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted/50" />
                <Input 
                  value={mounted ? accountId : ""}
                  onChange={(e) => setAccountId(e.target.value)}
                  placeholder="act_..." 
                  className="pl-10 h-11 bg-white/[0.02]"
                  suppressHydrationWarning
                />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6 pt-10 border-t border-border">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
              <Bot className="w-4 h-4 text-orange-500" />
            </div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted">Google Gemini AI</h3>
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-bold text-muted uppercase tracking-wider ml-1">Gemini API Key</label>
            <Input 
              type="password" 
              value={mounted ? geminiKey : ""}
              onChange={(e) => setGeminiKey(e.target.value)}
              placeholder="AIzaSy..." 
              className="h-11 bg-white/[0.02]"
              suppressHydrationWarning
            />
          </div>
        </div>


        <div className="flex items-center gap-4 pt-4">
          <Button 
            variant="outline" 
            onClick={handleTest} 
            disabled={testStatus === "testing" || !token || !accountId}
            className="flex-1 h-12 font-bold uppercase tracking-widest text-[10px] gap-2 shadow-sm border-border hover:bg-white/5"
          >
            {testStatus === "testing" ? "Sincronizando..." : "Testar Conexão"}
            {testStatus === "success" && <CheckCircle2 className="w-4 h-4 text-success" />}
            {testStatus === "error" && <XCircle className="w-4 h-4 text-danger" />}
          </Button>

          <Button 
            onClick={handleSave}
            className="flex-[2] h-12 font-bold uppercase tracking-widest text-[10px] gap-2 bg-accent hover:bg-accent/90 text-white shadow-xl"
          >
            <Save className="w-4 h-4" />
            Salvar e Sincronizar
          </Button>
        </div>

        {testStatus === "error" && (
          <p className="text-xs font-bold text-danger text-center uppercase tracking-widest bg-danger/10 p-3 rounded-lg border border-danger/20">
            {errorMsg}
          </p>
        )}
      </div>
    </div>
  );
}

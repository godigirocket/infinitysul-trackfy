"use client";
import { useState, useCallback, createContext, useContext, ReactNode } from "react";
import { CheckCircle, XCircle, AlertCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastType = "success" | "error" | "info";
interface ToastItem { id: string; message: string; type: ToastType; }
interface ToastCtx { toast: (msg: string, type?: ToastType) => void; }
const Ctx = createContext<ToastCtx>({ toast: () => {} });
export const useToast = () => useContext(Ctx);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const toast = useCallback((message: string, type: ToastType = "info") => {
    const id = Math.random().toString(36).slice(2);
    setToasts(p => [...p, { id, message, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 4000);
  }, []);
  return (
    <Ctx.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-6 right-6 z-[200] flex flex-col gap-2 max-w-sm pointer-events-none">
        {toasts.map(t => (
          <div key={t.id} className={cn(
            "flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl border text-sm font-bold pointer-events-auto",
            "animate-in slide-in-from-right-4 duration-300",
            t.type === "success" ? "bg-surface border-success/30 text-success" :
            t.type === "error"   ? "bg-surface border-danger/30 text-danger" :
                                   "bg-surface border-accent/30 text-accent"
          )}>
            {t.type === "success" ? <CheckCircle className="w-4 h-4 shrink-0" /> :
             t.type === "error"   ? <XCircle className="w-4 h-4 shrink-0" /> :
                                    <AlertCircle className="w-4 h-4 shrink-0" />}
            <span className="flex-1 text-white">{t.message}</span>
            <button onClick={() => setToasts(p => p.filter(x => x.id !== t.id))} className="opacity-60 hover:opacity-100">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}

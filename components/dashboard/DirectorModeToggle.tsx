"use client";

import { useAppStore } from "@/store/useAppStore";
import { User, ShieldCheck } from "lucide-react";
import { cn } from "@/components/ui/Button";

export function DirectorModeToggle() {
  const { isDirectorMode, setIsDirectorMode } = useAppStore();

  return (
    <button
      onClick={() => setIsDirectorMode(!isDirectorMode)}
      className={cn(
        "relative flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all duration-300 group overflow-hidden",
        isDirectorMode 
          ? "bg-accent/10 border-accent text-accent" 
          : "bg-white/5 border-white/10 text-muted hover:border-white/20"
      )}
    >
      <div className={cn(
        "flex items-center justify-center w-5 h-5 rounded-full transition-transform duration-500",
        isDirectorMode ? "translate-x-0" : "translate-x-0"
      )}>
        {isDirectorMode ? <ShieldCheck className="w-3.5 h-3.5 animate-pulse" /> : <User className="w-3.5 h-3.5" />}
      </div>
      <span className="text-[10px] font-bold uppercase tracking-widest">
        {isDirectorMode ? "Modo Diretor Ativo" : "Visão Gestor"}
      </span>
      
      {/* Subtle background glow when active */}
      {isDirectorMode && (
        <div className="absolute inset-0 bg-accent/20 blur-xl -z-10 animate-pulse" />
      )}
    </button>
  );
}

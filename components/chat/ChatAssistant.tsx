"use client";

import { useState, useRef, useEffect } from "react";
import { useAppStore } from "@/store/useAppStore";
import { extractMetric, formatCurrency, CONVERSATION_ACTION_TYPES } from "@/lib/formatters";
import { safeArray } from "@/lib/safeArray";
import { MessageCircle, X, Send, Bot, Loader2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface Message {
  role: "user" | "assistant";
  text: string;
}

const QUICK_PROMPTS = [
  "Analise o desempenho geral",
  "Quais campanhas pausar?",
  "Como reduzir o CPL?",
  "Sugira aumento de orçamento",
];

export function ChatAssistant() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const { dataA, period } = useAppStore();
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const getMetrics = () => {
    const rows = safeArray(dataA);
    const spend = rows.reduce((s, r) => s + parseFloat(r.spend || "0"), 0);
    const convs = rows.reduce((s, r) => s + extractMetric(r.actions, CONVERSATION_ACTION_TYPES), 0);
    const imps = rows.reduce((s, r) => s + parseInt(r.impressions || "0"), 0);
    const clicks = rows.reduce((s, r) => s + parseInt(r.clicks || "0"), 0);
    const ctr = imps > 0 ? (clicks / imps * 100).toFixed(2) : "0";
    const cpl = convs > 0 ? (spend / convs).toFixed(2) : "0";

    // Top 3 campaigns by spend
    const campMap: Record<string, { name: string; spend: number; convs: number }> = {};
    rows.forEach(r => {
      if (!campMap[r.campaign_id]) campMap[r.campaign_id] = { name: r.campaign_name, spend: 0, convs: 0 };
      campMap[r.campaign_id].spend += parseFloat(r.spend || "0");
      campMap[r.campaign_id].convs += extractMetric(r.actions, CONVERSATION_ACTION_TYPES);
    });
    const top3 = Object.values(campMap)
      .sort((a, b) => b.spend - a.spend)
      .slice(0, 3)
      .map(c => `  - ${c.name}: R$${c.spend.toFixed(2)} gasto, ${c.convs} conversas`)
      .join("\n");

    return `Período: ${period}
Investimento total: R$ ${spend.toFixed(2)}
Conversas: ${convs}
Impressões: ${imps.toLocaleString("pt-BR")}
Cliques: ${clicks.toLocaleString("pt-BR")}
CTR: ${ctr}%
CPL: R$ ${cpl}
Top campanhas:
${top3 || "  (sem dados)"}`;
  };

  const send = async (text: string) => {
    if (!text.trim() || loading) return;
    const userMsg = text.trim();
    setMessages(prev => [...prev, { role: "user", text: userMsg }]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsg, metrics: getMetrics() }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: "assistant", text: data.answer }]);
    } catch {
      setMessages(prev => [...prev, { role: "assistant", text: "Erro ao consultar o assistente." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(o => !o)}
        className="fixed bottom-6 right-6 z-[100] p-3.5 bg-accent rounded-full shadow-2xl hover:bg-accent/90 transition-all hover:scale-110"
        title="Assistente IA"
      >
        {open ? <X className="w-5 h-5 text-white" /> : <MessageCircle className="w-5 h-5 text-white" />}
      </button>

      {/* Chat window */}
      {open && (
        <div className="fixed bottom-20 right-6 z-[99] w-[360px] h-[520px] bg-surface border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
          {/* Header */}
          <div className="flex items-center gap-3 p-4 border-b border-white/10 bg-white/[0.03]">
            <div className="p-1.5 bg-accent/20 rounded-lg">
              <Bot className="w-4 h-4 text-accent" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">Assistente Meta Ads</p>
              <p className="text-[10px] text-muted">Powered by Gemini Flash</p>
            </div>
            <div className="ml-auto flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
              <span className="text-[9px] text-muted">Online</span>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 && (
              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <Sparkles className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-muted leading-relaxed">
                    Olá! Posso analisar suas campanhas e sugerir otimizações. O que deseja saber?
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-4">
                  {QUICK_PROMPTS.map(p => (
                    <button key={p} onClick={() => send(p)}
                      className="text-left text-[11px] p-2 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 hover:border-accent/30 transition-all text-muted hover:text-white">
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i} className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}>
                <div className={cn(
                  "max-w-[85%] rounded-xl px-3 py-2 text-sm leading-relaxed",
                  msg.role === "user"
                    ? "bg-accent text-white rounded-br-sm"
                    : "bg-white/10 text-white/90 rounded-bl-sm"
                )}>
                  {msg.text}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-white/10 rounded-xl rounded-bl-sm px-3 py-2 flex items-center gap-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-accent" />
                  <span className="text-xs text-muted">Analisando...</span>
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>

          {/* Input */}
          <div className="p-3 border-t border-white/10 flex gap-2">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && !e.shiftKey && send(input)}
              placeholder="Pergunte sobre suas campanhas..."
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-accent"
            />
            <button onClick={() => send(input)} disabled={loading || !input.trim()}
              className="p-2 bg-accent rounded-xl hover:bg-accent/90 transition-all disabled:opacity-40">
              <Send className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}

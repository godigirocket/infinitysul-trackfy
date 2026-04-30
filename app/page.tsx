"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { Zap, TrendingUp, Brain, BarChart3, Plug, ArrowRight, Check, Star, ChevronRight, Play } from "lucide-react";

function AnimatedNumber({ target, suffix = "" }: { target: number; suffix?: string }) {
  const [val, setVal] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        let start = 0;
        const step = target / 60;
        const t = setInterval(() => {
          start += step;
          if (start >= target) { setVal(target); clearInterval(t); }
          else setVal(Math.floor(start));
        }, 16);
      }
    }, { threshold: 0.5 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [target]);
  return <span ref={ref}>{val.toLocaleString("pt-BR")}{suffix}</span>;
}

const FEATURES = [
  {
    icon: Brain,
    title: "Creative Intelligence",
    desc: "Analise cada criativo com IA. Detecte fadiga, identifique vencedores e receba recomendações automáticas.",
    color: "text-purple-400",
    bg: "bg-purple-500/10 border-purple-500/20",
  },
  {
    icon: BarChart3,
    title: "Unified Ads Tracking",
    desc: "Meta Ads e Google Ads em um único painel. Métricas unificadas, sem alternância de plataformas.",
    color: "text-blue-400",
    bg: "bg-blue-500/10 border-blue-500/20",
  },
  {
    icon: Zap,
    title: "AI Optimization",
    desc: "Motor de IA que analisa performance em tempo real e sugere ações concretas para escalar resultados.",
    color: "text-yellow-400",
    bg: "bg-yellow-500/10 border-yellow-500/20",
  },
  {
    icon: TrendingUp,
    title: "Financial Analytics",
    desc: "ROI real, ROAS, margem e lucro líquido calculados automaticamente com seus dados de vendas.",
    color: "text-green-400",
    bg: "bg-green-500/10 border-green-500/20",
  },
  {
    icon: Plug,
    title: "Automation Engine",
    desc: "Regras automáticas que pausam campanhas ruins, escalam as boas e notificam sua equipe.",
    color: "text-pink-400",
    bg: "bg-pink-500/10 border-pink-500/20",
  },
];

const PLANS = [
  {
    name: "Starter",
    price: "R$ 97",
    period: "/mês",
    desc: "Para gestores iniciando com dados.",
    features: ["1 conta Meta Ads", "Dashboard básico", "Creative Hub", "Relatórios mensais"],
    cta: "Começar grátis",
    highlight: false,
  },
  {
    name: "Pro",
    price: "R$ 297",
    period: "/mês",
    desc: "Para agências e gestores avançados.",
    features: ["5 contas Meta + Google Ads", "AI Insights ilimitados", "Automações", "Financeiro completo", "Suporte prioritário"],
    cta: "Começar trial",
    highlight: true,
  },
  {
    name: "Scale",
    price: "R$ 697",
    period: "/mês",
    desc: "Para operações de alto volume.",
    features: ["Contas ilimitadas", "White-label", "API access", "Onboarding dedicado", "SLA garantido"],
    cta: "Falar com vendas",
    highlight: false,
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen" style={{ background: "#020617", fontFamily: "Manrope, sans-serif" }}>

      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 h-16 border-b border-white/[0.05]"
        style={{ background: "rgba(2,6,23,0.9)", backdropFilter: "blur(20px)" }}>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg, #7c3aed, #6d28d9)" }}>
            <Zap className="w-4 h-4 text-white" fill="white" />
          </div>
          <span className="text-sm font-bold text-white tracking-tight">TRACKFY</span>
        </div>
        <div className="hidden md:flex items-center gap-6 text-[13px] text-white/50">
          {["Produto", "Preços", "Integrações", "Blog"].map(l => (
            <a key={l} href="#" className="hover:text-white transition-colors">{l}</a>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <Link href="/settings" className="text-[13px] text-white/60 hover:text-white transition-colors font-medium">Entrar</Link>
          <Link href="/dashboard" className="px-4 py-2 text-[13px] font-semibold text-white rounded-lg transition-all"
            style={{ background: "linear-gradient(135deg, #7c3aed, #6d28d9)" }}>
            Começar grátis
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-24 px-8 text-center overflow-hidden">
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse 80% 60% at 50% -10%, rgba(124,58,237,0.2), transparent 60%)" }} />
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full opacity-10 blur-3xl pointer-events-none"
          style={{ background: "radial-gradient(circle, #7c3aed, transparent)" }} />

        <div className="relative max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-purple-500/30 bg-purple-500/10 text-purple-300 text-[12px] font-semibold mb-6">
            <Star className="w-3 h-3 fill-current" /> Novo: AI Creative Analysis
          </div>

          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight tracking-tight">
            Seu Marketing<br />
            <span style={{ background: "linear-gradient(135deg, #a78bfa, #7c3aed)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Command Center.
            </span>
          </h1>

          <p className="text-lg text-white/50 max-w-2xl mx-auto mb-10 leading-relaxed">
            Rastreie campanhas, criativos e lucro em uma plataforma inteligente.
            Tome decisões baseadas em dados, não em achismos.
          </p>

          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link href="/dashboard"
              className="flex items-center gap-2 px-7 py-3.5 text-[14px] font-bold text-white rounded-xl transition-all hover:scale-105"
              style={{ background: "linear-gradient(135deg, #7c3aed, #6d28d9)", boxShadow: "0 0 30px rgba(124,58,237,0.4)" }}>
              Começar Trial Grátis <ArrowRight className="w-4 h-4" />
            </Link>
            <button className="flex items-center gap-2 px-7 py-3.5 text-[14px] font-semibold text-white/70 hover:text-white rounded-xl border border-white/[0.08] hover:border-white/20 transition-all">
              <Play className="w-4 h-4" /> Ver Demo
            </button>
          </div>

          <p className="text-[12px] text-white/25 mt-4">Sem cartão de crédito • 14 dias grátis • Cancele quando quiser</p>
        </div>
      </section>

      {/* Social proof */}
      <section className="py-12 px-8 border-y border-white/[0.05]">
        <div className="max-w-5xl mx-auto">
          <p className="text-center text-[11px] text-white/25 uppercase tracking-widest mb-8">Confiado por gestores de tráfego em todo o Brasil</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { label: "Gestores ativos", value: 2400, suffix: "+" },
              { label: "Campanhas analisadas", value: 180000, suffix: "+" },
              { label: "Em investimento gerenciado", value: 50, suffix: "M+" },
              { label: "Uptime garantido", value: 99, suffix: ".9%" },
            ].map(s => (
              <div key={s.label}>
                <p className="text-3xl font-bold text-white mb-1">
                  <AnimatedNumber target={s.value} suffix={s.suffix} />
                </p>
                <p className="text-[12px] text-white/35">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">Tudo que você precisa para escalar</h2>
            <p className="text-[15px] text-white/40 max-w-xl mx-auto">Uma plataforma completa para gestores que querem resultados reais.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map(f => (
              <div key={f.title} className={`p-6 rounded-2xl border ${f.bg} hover:scale-[1.02] transition-all cursor-default`}>
                <div className={`w-10 h-10 rounded-xl ${f.bg} border flex items-center justify-center mb-4`}>
                  <f.icon className={`w-5 h-5 ${f.color}`} />
                </div>
                <h3 className="text-[15px] font-bold text-white mb-2">{f.title}</h3>
                <p className="text-[13px] text-white/45 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 px-8 border-y border-white/[0.05]">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-white mb-4">Como funciona</h2>
          <p className="text-[15px] text-white/40 mb-16">Três passos para transformar seus dados em lucro.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: "01", title: "Conecte suas contas", desc: "Meta Ads, Google Ads e plataformas de venda em minutos." },
              { step: "02", title: "Analise a performance", desc: "Dashboard unificado com métricas reais e insights de IA." },
              { step: "03", title: "Escale os vencedores", desc: "Automações e recomendações para maximizar seu ROI." },
            ].map((s, i) => (
              <div key={s.step} className="relative">
                {i < 2 && <div className="hidden md:block absolute top-8 left-full w-full h-px border-t border-dashed border-white/10 z-0" />}
                <div className="relative z-10">
                  <div className="w-16 h-16 rounded-2xl border border-white/[0.08] bg-surface-2 flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl font-bold" style={{ color: "#7c3aed" }}>{s.step}</span>
                  </div>
                  <h3 className="text-[15px] font-bold text-white mb-2">{s.title}</h3>
                  <p className="text-[13px] text-white/40 leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-24 px-8">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">Preços simples e transparentes</h2>
            <p className="text-[15px] text-white/40">Sem surpresas. Cancele quando quiser.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {PLANS.map(plan => (
              <div key={plan.name} className={`p-6 rounded-2xl border transition-all ${
                plan.highlight
                  ? "border-purple-500/40 bg-gradient-to-br from-purple-500/10 to-transparent scale-[1.02]"
                  : "border-white/[0.06] bg-surface hover:border-white/10"
              }`}>
                {plan.highlight && (
                  <div className="text-[10px] font-bold text-purple-300 uppercase tracking-widest mb-3 flex items-center gap-1">
                    <Star className="w-3 h-3 fill-current" /> Mais popular
                  </div>
                )}
                <h3 className="text-lg font-bold text-white mb-1">{plan.name}</h3>
                <p className="text-[12px] text-white/40 mb-4">{plan.desc}</p>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-3xl font-bold text-white">{plan.price}</span>
                  <span className="text-[13px] text-white/40">{plan.period}</span>
                </div>
                <ul className="space-y-2.5 mb-6">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-center gap-2 text-[13px] text-white/60">
                      <Check className="w-3.5 h-3.5 text-green-400 flex-shrink-0" /> {f}
                    </li>
                  ))}
                </ul>
                <Link href="/dashboard"
                  className={`block w-full py-2.5 text-center text-[13px] font-semibold rounded-xl transition-all ${
                    plan.highlight
                      ? "text-white hover:opacity-90"
                      : "bg-white/[0.06] text-white/70 hover:bg-white/10 hover:text-white"
                  }`}
                  style={plan.highlight ? { background: "linear-gradient(135deg, #7c3aed, #6d28d9)" } : {}}>
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 px-8 text-center relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse 60% 80% at 50% 50%, rgba(124,58,237,0.12), transparent)" }} />
        <div className="relative max-w-2xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">
            Pare de adivinhar.<br />Comece a escalar.
          </h2>
          <p className="text-[15px] text-white/40 mb-10">
            Junte-se a mais de 2.400 gestores que já tomam decisões baseadas em dados reais.
          </p>
          <Link href="/dashboard"
            className="inline-flex items-center gap-2 px-8 py-4 text-[15px] font-bold text-white rounded-xl transition-all hover:scale-105"
            style={{ background: "linear-gradient(135deg, #7c3aed, #6d28d9)", boxShadow: "0 0 40px rgba(124,58,237,0.4)" }}>
            Começar Trial Grátis <ArrowRight className="w-5 h-5" />
          </Link>
          <p className="text-[12px] text-white/25 mt-4">14 dias grátis • Sem cartão de crédito</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-8 border-t border-white/[0.05] text-center">
        <p className="text-[12px] text-white/25">© 2025 Trackfy Growth OS. Todos os direitos reservados.</p>
      </footer>
    </div>
  );
}

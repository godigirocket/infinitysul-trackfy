"use client";

import { useState } from "react";
import { Link2, Copy, Check, ExternalLink, Info } from "lucide-react";

const BASE_URL = typeof window !== "undefined" ? window.location.origin : "https://infinitysul-trackfy.vercel.app";

export default function UTMsPage() {
  const [form, setForm] = useState({ url: "", source: "", medium: "", campaign: "", content: "", term: "" });
  const [copied, setCopied] = useState(false);

  const generated = (() => {
    if (!form.url) return "";
    try {
      const u = new URL(form.url.startsWith("http") ? form.url : `https://${form.url}`);
      if (form.source) u.searchParams.set("utm_source", form.source);
      if (form.medium) u.searchParams.set("utm_medium", form.medium);
      if (form.campaign) u.searchParams.set("utm_campaign", form.campaign);
      if (form.content) u.searchParams.set("utm_content", form.content);
      if (form.term) u.searchParams.set("utm_term", form.term);
      return u.toString();
    } catch { return ""; }
  })();

  const copy = () => {
    if (!generated) return;
    navigator.clipboard.writeText(generated);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const trackingPixel = `${BASE_URL}/api/track`;

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">UTMs & Rastreamento</h1>
        <p className="text-sm text-muted mt-1">Gere links rastreados e configure o pixel de rastreamento first-party.</p>
      </div>

      {/* UTM Builder */}
      <div className="glass p-6 space-y-5">
        <h2 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
          <Link2 className="w-4 h-4 text-accent" /> Gerador de UTM
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { key: "url", label: "URL de Destino", placeholder: "https://seusite.com/produto", required: true },
            { key: "source", label: "utm_source", placeholder: "facebook, google, email" },
            { key: "medium", label: "utm_medium", placeholder: "cpc, social, email" },
            { key: "campaign", label: "utm_campaign", placeholder: "nome-da-campanha" },
            { key: "content", label: "utm_content", placeholder: "variante-do-criativo" },
            { key: "term", label: "utm_term", placeholder: "palavra-chave" },
          ].map(f => (
            <div key={f.key} className="space-y-1.5">
              <label className="text-[11px] font-bold text-muted uppercase tracking-wider">
                {f.label} {f.required && <span className="text-danger">*</span>}
              </label>
              <input
                value={(form as any)[f.key]}
                onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                placeholder={f.placeholder}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-accent"
              />
            </div>
          ))}
        </div>

        {generated && (
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-muted uppercase tracking-wider">URL Gerada</label>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-black/30 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-accent font-mono break-all">
                {generated}
              </div>
              <button onClick={copy} className="p-2.5 bg-accent rounded-xl hover:bg-accent/90 transition-all flex-shrink-0">
                {copied ? <Check className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4 text-white" />}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Tracking Pixel */}
      <div className="glass p-6 space-y-4">
        <h2 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
          <Info className="w-4 h-4 text-accent" /> Pixel de Rastreamento First-Party
        </h2>
        <p className="text-xs text-muted">Adicione este script no seu site para capturar visitas com UTMs automaticamente.</p>
        <div className="bg-black/40 border border-white/10 rounded-xl p-4 font-mono text-xs text-green-400 overflow-x-auto">
          <pre>{`<script>
(function() {
  var params = new URLSearchParams(window.location.search);
  var data = {
    page: window.location.pathname,
    utm_source: params.get('utm_source'),
    utm_medium: params.get('utm_medium'),
    utm_campaign: params.get('utm_campaign'),
    utm_content: params.get('utm_content'),
    fbclid: params.get('fbclid'),
    gclid: params.get('gclid'),
    session_id: sessionStorage.getItem('sid') || Math.random().toString(36).slice(2),
  };
  sessionStorage.setItem('sid', data.session_id);
  fetch('${trackingPixel}', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(data)
  });
})();
</script>`}</pre>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted">
          <ExternalLink className="w-3.5 h-3.5" />
          Endpoint: <code className="text-accent">{trackingPixel}</code>
        </div>
      </div>
    </div>
  );
}

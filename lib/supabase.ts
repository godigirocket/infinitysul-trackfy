import { createClient, SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

/**
 * Lazy-initialized Supabase client.
 * Returns null during build/SSR when env vars are not available.
 */
let _client: SupabaseClient | null = null;

function getClient(): SupabaseClient | null {
  if (_client) return _client;
  if (!supabaseUrl || !supabaseAnonKey) return null;
  _client = createClient(supabaseUrl, supabaseAnonKey);
  return _client;
}

export const supabase = { get client() { return getClient(); } };

/**
 * Fetches leads from Supabase CRM table.
 * Adapts column names to internal CRMLead format.
 */
export const fetchSupabaseLeads = async () => {
  const client = getClient();
  if (!client) {
    console.warn("[Supabase] Not configured. Skipping lead sync.");
    return [];
  }

  try {
    // Try 'leads' table first, fallback to 'crm_leads'
    let { data, error } = await client
      .from("leads")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(5000);

    if (error) {
      const alt = await client.from("crm_leads").select("*").order("created_at", { ascending: false }).limit(5000);
      if (alt.error) {
        console.error("[Supabase] Error fetching leads:", error.message, alt.error.message);
        return [];
      }
      data = alt.data;
    }

    if (!data) return [];

    return data.map((row: any) => ({
      lead_id: row.id?.toString() || row.lead_id?.toString() || Math.random().toString(36).slice(2),
      campaign_id: row.campaign_id || row.utm_campaign || row.campanha || "",
      status: mapLeadStatus(row.status || row.situacao || row.etapa || "new"),
      sale_value: parseFloat(row.sale_value || row.valor_venda || row.valor || row.value || "0"),
      date: row.created_at || row.date || row.data || new Date().toISOString(),
      product: row.product || row.produto || row.plano || row.operadora || "",
      name: row.name || row.nome || "",
      phone: row.phone || row.telefone || row.whatsapp || "",
    }));
  } catch (err) {
    console.error("[Supabase] Unexpected error:", err);
    return [];
  }
};

function mapLeadStatus(raw: string): "new" | "contacted" | "converted" | "lost" {
  const s = raw.toLowerCase().trim();
  if (["convertido", "converted", "venda", "vendido", "ganho", "won", "fechado"].includes(s)) return "converted";
  if (["contatado", "contacted", "em andamento", "negociando", "followup", "follow-up"].includes(s)) return "contacted";
  if (["perdido", "lost", "cancelado", "desistiu", "sem resposta"].includes(s)) return "lost";
  return "new";
}

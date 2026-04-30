export const runtime = "edge";

/**
 * Universal webhook ingestion endpoint.
 * Supports: Stripe, Hotmart, Kiwify, Shopify, generic POST
 * POST /api/webhook?source=stripe
 */
export async function POST(req: Request) {
  const url = new URL(req.url);
  const source = url.searchParams.get("source") || "generic";

  let body: any = {};
  try { body = await req.json(); } catch {}

  const order = parseWebhook(source, body);

  if (!order) {
    return new Response(JSON.stringify({ ok: false, error: "Unrecognized event" }), { status: 200 });
  }

  // In production: persist to DB. Here we return the parsed order for client to store.
  console.log("[WEBHOOK]", source, JSON.stringify(order));

  return new Response(JSON.stringify({ ok: true, order }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

function parseWebhook(source: string, body: any) {
  try {
    switch (source) {
      case "stripe": return parseStripe(body);
      case "hotmart": return parseHotmart(body);
      case "kiwify": return parseKiwify(body);
      case "shopify": return parseShopify(body);
      default: return parseGeneric(body);
    }
  } catch { return null; }
}

function parseStripe(body: any) {
  const obj = body?.data?.object;
  if (!obj) return null;
  const type = body?.type || "";
  const status = type.includes("succeeded") || type.includes("paid") ? "paid"
    : type.includes("refund") ? "refunded"
    : type.includes("dispute") ? "chargeback"
    : "pending";
  return {
    order_id: obj.id || obj.payment_intent || crypto.randomUUID(),
    product_name: obj.description || obj.metadata?.product_name || "Stripe Order",
    gross_revenue: (obj.amount || 0) / 100,
    net_revenue: ((obj.amount || 0) - (obj.application_fee_amount || 0)) / 100,
    gateway_fee: (obj.application_fee_amount || 0) / 100,
    status,
    payment_method: obj.payment_method_types?.[0] || "card",
    utm_source: obj.metadata?.utm_source,
    utm_campaign: obj.metadata?.utm_campaign,
    campaign_id: obj.metadata?.campaign_id,
    timestamp: new Date((obj.created || Date.now() / 1000) * 1000).toISOString(),
  };
}

function parseHotmart(body: any) {
  const data = body?.data || body;
  const status = data?.purchase?.status === "APPROVED" ? "paid"
    : data?.purchase?.status === "REFUNDED" ? "refunded"
    : data?.purchase?.status === "CHARGEBACK" ? "chargeback"
    : "pending";
  const gross = data?.purchase?.price?.value || 0;
  return {
    order_id: data?.purchase?.transaction || crypto.randomUUID(),
    product_name: data?.product?.name || "Hotmart Product",
    gross_revenue: gross,
    net_revenue: gross * 0.9, // approximate
    gateway_fee: gross * 0.1,
    status,
    payment_method: data?.purchase?.payment?.type || "credit_card",
    utm_source: data?.purchase?.tracking?.source_sck,
    utm_campaign: data?.purchase?.tracking?.source,
    timestamp: new Date().toISOString(),
  };
}

function parseKiwify(body: any) {
  const status = body?.order_status === "paid" ? "paid"
    : body?.order_status === "refunded" ? "refunded"
    : "pending";
  const gross = parseFloat(body?.order_total || "0");
  return {
    order_id: body?.order_id || crypto.randomUUID(),
    product_name: body?.product_name || "Kiwify Product",
    gross_revenue: gross,
    net_revenue: gross * 0.9,
    gateway_fee: gross * 0.1,
    status,
    payment_method: body?.payment_method || "credit_card",
    utm_source: body?.tracking?.utm_source,
    utm_campaign: body?.tracking?.utm_campaign,
    timestamp: body?.created_at || new Date().toISOString(),
  };
}

function parseShopify(body: any) {
  const status = body?.financial_status === "paid" ? "paid"
    : body?.financial_status === "refunded" ? "refunded"
    : "pending";
  const gross = parseFloat(body?.total_price || "0");
  const fee = parseFloat(body?.total_discounts || "0");
  return {
    order_id: String(body?.id || crypto.randomUUID()),
    product_name: body?.line_items?.[0]?.name || "Shopify Order",
    gross_revenue: gross,
    net_revenue: gross - fee,
    gateway_fee: fee,
    status,
    payment_method: body?.payment_gateway || "shopify",
    utm_source: body?.landing_site?.includes("utm_source") ? new URL("https://x.com" + body.landing_site).searchParams.get("utm_source") || undefined : undefined,
    timestamp: body?.created_at || new Date().toISOString(),
  };
}

function parseGeneric(body: any) {
  if (!body?.order_id && !body?.id) return null;
  return {
    order_id: body.order_id || body.id || crypto.randomUUID(),
    product_name: body.product_name || body.product || "Order",
    gross_revenue: parseFloat(body.gross_revenue || body.amount || body.value || "0"),
    net_revenue: parseFloat(body.net_revenue || body.net || "0"),
    gateway_fee: parseFloat(body.gateway_fee || body.fee || "0"),
    status: body.status || "paid",
    payment_method: body.payment_method || "unknown",
    utm_source: body.utm_source,
    utm_medium: body.utm_medium,
    utm_campaign: body.utm_campaign,
    campaign_id: body.campaign_id,
    fbclid: body.fbclid,
    timestamp: body.timestamp || body.created_at || new Date().toISOString(),
  };
}

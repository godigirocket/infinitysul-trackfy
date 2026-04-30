export const runtime = "edge";

/**
 * First-party tracking endpoint.
 * Captures UTM params, fbclid, gclid, session data.
 * GET  /api/track?utm_source=...&fbclid=...
 * POST /api/track  { event, ...params }
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const params = Object.fromEntries(url.searchParams.entries());
  return trackEvent("pageview", params, req);
}

export async function POST(req: Request) {
  let body: any = {};
  try { body = await req.json(); } catch {}
  const { event = "custom", ...params } = body;
  return trackEvent(event, params, req);
}

function trackEvent(event: string, params: Record<string, string>, req: Request) {
  const visit = {
    event,
    timestamp: new Date().toISOString(),
    utm_source: params.utm_source || null,
    utm_medium: params.utm_medium || null,
    utm_campaign: params.utm_campaign || null,
    utm_content: params.utm_content || null,
    utm_term: params.utm_term || null,
    fbclid: params.fbclid || null,
    gclid: params.gclid || null,
    session_id: params.session_id || null,
    visitor_id: params.visitor_id || null,
    campaign_id: params.campaign_id || null,
    page: params.page || null,
    referrer: req.headers.get("referer") || null,
    user_agent: req.headers.get("user-agent") || null,
  };

  // Log server-side (in production, persist to DB/KV here)
  console.log("[TRACK]", JSON.stringify(visit));

  return new Response(
    JSON.stringify({ ok: true, tracked: visit }),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    }
  );
}

export async function OPTIONS() {
  return new Response(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

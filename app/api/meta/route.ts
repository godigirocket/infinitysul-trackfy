import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

const META_HOSTS = ["graph.facebook.com", "graph-video.facebook.com"];

function validateUrl(url: unknown): { ok: true; parsed: URL } | { ok: false; error: string } {
  if (!url || typeof url !== "string") return { ok: false, error: "Missing url" };
  try {
    const parsed = new URL(url);
    if (!META_HOSTS.some(h => parsed.hostname === h)) return { ok: false, error: "URL not allowed" };
    return { ok: true, parsed };
  } catch {
    return { ok: false, error: "Invalid URL" };
  }
}

/**
 * GET proxy — read operations (insights, hierarchy)
 * Body: { url: string }
 */
export async function POST(req: NextRequest) {
  let body: any;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: { message: "Invalid JSON" } }, { status: 400 });
  }

  const check = validateUrl(body?.url);
  if (!check.ok) return NextResponse.json({ error: { message: check.error } }, { status: 400 });

  // If body.payload is present → write operation (POST to Meta)
  const isWrite = body?.payload !== undefined;

  try {
    const metaRes = await fetch(body.url, {
      method: isWrite ? "POST" : "GET",
      headers: {
        "Accept": "application/json",
        ...(isWrite ? { "Content-Type": "application/x-www-form-urlencoded" } : {}),
      },
      // Meta Graph API write ops use form-encoded body
      body: isWrite ? new URLSearchParams(body.payload).toString() : undefined,
    });

    const data = await metaRes.json();
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: { message: err?.message || "Proxy error" } }, { status: 500 });
  }
}

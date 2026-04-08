import { NextRequest, NextResponse } from "next/server";

const META_BASE = "https://graph.facebook.com";

/**
 * Server-side proxy for Meta Graph API.
 * Avoids CORS, keeps token off the network tab, handles timeouts properly.
 *
 * Usage: POST /api/meta  { url: "https://graph.facebook.com/..." }
 * Returns: the raw Meta API JSON response
 */
export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();

    if (!url || !url.startsWith(META_BASE)) {
      return NextResponse.json({ error: { message: "Invalid Meta API URL" } }, { status: 400 });
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25000); // 25s server timeout

    let metaRes: Response;
    try {
      metaRes = await fetch(url, { signal: controller.signal });
    } finally {
      clearTimeout(timeout);
    }

    const data = await metaRes.json();
    return NextResponse.json(data, { status: metaRes.status });
  } catch (err: any) {
    if (err?.name === "AbortError") {
      return NextResponse.json({ error: { message: "Meta API request timed out" } }, { status: 504 });
    }
    return NextResponse.json({ error: { message: err?.message || "Proxy error" } }, { status: 500 });
  }
}

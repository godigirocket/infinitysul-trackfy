import { NextRequest, NextResponse } from "next/server";

// Edge Runtime: no serverless timeout limits, runs at the edge globally
export const runtime = "edge";

const META_HOSTS = ["graph.facebook.com", "graph-video.facebook.com"];

/**
 * Server-side proxy for Meta Graph API — Edge Runtime.
 * Edge has no 10s timeout limit (unlike Vercel Hobby serverless functions).
 *
 * POST /api/meta  { url: "https://graph.facebook.com/..." }
 */
export async function POST(req: NextRequest) {
  let url: string;

  try {
    const body = await req.json();
    url = body?.url;
  } catch {
    return NextResponse.json({ error: { message: "Invalid request body" } }, { status: 400 });
  }

  if (!url || typeof url !== "string") {
    return NextResponse.json({ error: { message: "Missing url" } }, { status: 400 });
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch {
    return NextResponse.json({ error: { message: "Invalid URL" } }, { status: 400 });
  }

  if (!META_HOSTS.some(h => parsedUrl.hostname === h)) {
    return NextResponse.json({ error: { message: "URL not allowed" } }, { status: 400 });
  }

  try {
    const metaRes = await fetch(url, {
      headers: { "Accept": "application/json" },
    });

    const data = await metaRes.json();
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json(
      { error: { message: err?.message || "Proxy fetch error" } },
      { status: 500 }
    );
  }
}

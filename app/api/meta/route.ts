import { NextRequest, NextResponse } from "next/server";

const META_HOSTS = ["graph.facebook.com", "graph-video.facebook.com"];

/**
 * Server-side proxy for Meta Graph API.
 * - Avoids CORS blocks (Meta blocks direct browser requests)
 * - Prevents token exposure in browser network tab
 * - Handles server-side timeouts properly
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

  // Validate host — only allow Meta Graph API URLs
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch {
    return NextResponse.json({ error: { message: "Invalid URL" } }, { status: 400 });
  }

  if (!META_HOSTS.some(h => parsedUrl.hostname === h)) {
    return NextResponse.json({ error: { message: "URL not allowed" } }, { status: 400 });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 28000); // 28s — under Vercel's 30s limit

  try {
    const metaRes = await fetch(url, {
      signal: controller.signal,
      headers: { "Accept": "application/json" },
    });

    const data = await metaRes.json();

    // Always return 200 to the client — let the client handle Meta error objects
    return NextResponse.json(data);
  } catch (err: any) {
    if (err?.name === "AbortError") {
      return NextResponse.json(
        { error: { message: "Meta API request timed out (28s)" } },
        { status: 504 }
      );
    }
    return NextResponse.json(
      { error: { message: err?.message || "Proxy fetch error" } },
      { status: 500 }
    );
  } finally {
    clearTimeout(timeout);
  }
}

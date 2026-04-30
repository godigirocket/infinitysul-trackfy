export const runtime = "edge";

const META_HOSTS = ["graph.facebook.com", "graph-video.facebook.com"];

export async function POST(req: Request) {
  let body: any;
  try { body = await req.json(); } catch {
    return new Response(JSON.stringify({ error: { message: "Invalid JSON" } }), { status: 400 });
  }

  const { url, method = "GET", payload } = body ?? {};

  if (!url || typeof url !== "string") {
    return new Response(JSON.stringify({ error: { message: "Missing url" } }), { status: 400 });
  }

  let parsed: URL;
  try { parsed = new URL(url); } catch {
    return new Response(JSON.stringify({ error: { message: "Invalid URL" } }), { status: 400 });
  }

  if (!META_HOSTS.some(h => parsed.hostname === h)) {
    return new Response(JSON.stringify({ error: { message: "URL not allowed" } }), { status: 400 });
  }

  // 55s timeout — safely under Vercel Edge's 60s wall clock limit
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 55000);

  try {
    const isWrite = method === "POST" || !!payload;
    const metaRes = await fetch(url, {
      method: isWrite ? "POST" : "GET",
      signal: controller.signal,
      headers: {
        "Accept": "application/json",
        ...(isWrite ? { "Content-Type": "application/x-www-form-urlencoded" } : {}),
      },
      body: isWrite && payload ? new URLSearchParams(payload).toString() : undefined,
    });

    clearTimeout(timer);
    const data = await metaRes.json();
    // Always 200 — let client handle Meta error objects
    return new Response(JSON.stringify(data), { status: 200 });
  } catch (err: any) {
    clearTimeout(timer);
    const isTimeout = err?.name === "AbortError";
    // Return a Meta-shaped error so client retry logic works
    return new Response(
      JSON.stringify({
        error: {
          message: isTimeout ? "Request timed out" : (err?.message || "Proxy error"),
          is_transient: isTimeout,
          code: isTimeout ? 504 : 500,
        }
      }),
      { status: 200 } // Always 200 so client receives the body
    );
  }
}

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

  try {
    const isWrite = method === "POST" || !!payload;
    const metaRes = await fetch(url, {
      method: isWrite ? "POST" : "GET",
      headers: {
        "Accept": "application/json",
        ...(isWrite ? { "Content-Type": "application/x-www-form-urlencoded" } : {}),
      },
      body: isWrite && payload ? new URLSearchParams(payload).toString() : undefined,
    });

    const data = await metaRes.json();
    return new Response(JSON.stringify(data), { status: 200 });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: { message: err?.message || "Proxy error" } }), { status: 500 });
  }
}

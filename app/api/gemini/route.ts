export const runtime = "edge";

export async function POST(req: Request) {
  const { message, metrics } = await req.json();

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ answer: "Configure GEMINI_API_KEY nas variáveis de ambiente da Vercel." }), { status: 200 });
  }

  const prompt = `Você é um especialista em Meta Ads. Responda em português, de forma direta e prática (máximo 4 linhas por ponto). Sugira ações concretas quando possível.

Métricas atuais:
${metrics}

Pergunta: ${message}`;

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.2, maxOutputTokens: 400 },
        }),
      }
    );

    const data = await res.json();
    const answer = data.candidates?.[0]?.content?.parts?.[0]?.text
      || "Não foi possível gerar uma análise. Verifique sua chave Gemini.";

    return new Response(JSON.stringify({ answer }), { status: 200 });
  } catch (err: any) {
    return new Response(JSON.stringify({ answer: `Erro: ${err.message}` }), { status: 200 });
  }
}

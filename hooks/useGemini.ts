"use client";

import { useState, useCallback } from "react";
import { useAppStore } from "@/store/useAppStore";

export function useGemini() {
  const { geminiKey } = useAppStore();
  const [loading, setLoading] = useState(false);

  const getInsight = useCallback(
    async (promptText: string): Promise<string> => {
      if (!geminiKey) return "IA Desativada. Configure sua API Key.";
      setLoading(true);

      try {
        // First, fetch available models to find an active Gemini model
        const modelsRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models?key=${geminiKey}`
        );
        const modelsJson = await modelsRes.json();

        let targetModel = "models/gemini-pro"; // Default fallback
        if (modelsJson.models) {
          const activeModel = modelsJson.models.find(
            (m: any) =>
              m.name.includes("gemini") &&
              m.supportedGenerationMethods?.includes("generateContent")
          );
          if (activeModel) targetModel = activeModel.name;
        }

        const url = `https://generativelanguage.googleapis.com/v1beta/${targetModel}:generateContent?key=${geminiKey}`;
        const response = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: promptText }] }],
          }),
        });

        const json = await response.json();
        if (json.error) throw new Error(json.error.message);

        return json.candidates?.[0]?.content?.parts?.[0]?.text || "Falha na resposta.";
      } catch (e: any) {
        console.error("Gemini Error:", e);
        return `Erro IA: ${e.message}`;
      } finally {
        setLoading(false);
      }
    },
    [geminiKey]
  );

  return { getInsight, loading };
}

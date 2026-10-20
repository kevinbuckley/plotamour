"use client";

import { useState, useCallback } from "react";
import type { AiFeature, AiProvider } from "@/lib/types/ai";

interface UseAiOptions {
  bookId: string;
}

export function useAi({ bookId }: UseAiOptions) {
  const [provider, setProvider] = useState<AiProvider>("google");
  const [model, setModel] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(
    async (feature: AiFeature, extra?: { sceneId?: string; characterId?: string }) => {
      setLoading(true);
      setError(null);
      setResult(null);

      try {
        const res = await fetch("/api/ai", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ feature, bookId, ...extra, provider, model: model || undefined }),
        });

        const data = await res.json();

        if (!res.ok) {
          setError(data.error ?? "AI request failed");
          return null;
        }

        setResult(data.result);
        return data.result as string;
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Network error";
        setError(msg);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [bookId, provider, model],
  );

  const clear = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  return { run, result, loading, error, clear, provider, setProvider, model, setModel };
}

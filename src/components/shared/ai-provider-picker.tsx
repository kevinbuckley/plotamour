"use client";
import { useState } from "react";
import Link from "next/link";
import type { AiProvider, ChatGptStatus } from "@/lib/types/ai";
export function AiProviderPicker({
  provider,
  model,
  onProvider,
  onModel,
  disabled,
}: {
  provider: AiProvider;
  model: string;
  onProvider: (value: AiProvider) => void;
  onModel: (value: string) => void;
  disabled: boolean;
}) {
  const [status, setStatus] = useState<ChatGptStatus | null>(null);
  const [error, setError] = useState("");
  async function change(value: AiProvider) {
    onProvider(value);
    onModel("");
    setError("");
    setStatus(null);
    if (value === "chatgpt") {
      try {
        const res = await fetch("/api/ai/chatgpt");
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setStatus(data);
      } catch (e) {
        setError(
          e instanceof Error ? e.message : "Unable to load ChatGPT connection.",
        );
      }
    }
  }
  return (
    <div className="space-y-2 text-xs">
      <label className="block">
        AI provider
        <select
          className="ml-2 rounded border p-1"
          aria-label="AI provider"
          disabled={disabled}
          value={provider}
          onChange={(e) => void change(e.target.value as AiProvider)}
        >
          <option value="google">Google AI Studio</option>
          <option value="chatgpt">ChatGPT plan · Scene Ideas</option>
        </select>
      </label>
      {provider === "chatgpt" && (
        <>
          {status?.planUsage && (
            <label className="block">
              Model
              <select
                className="ml-2 rounded border p-1"
                aria-label="ChatGPT model"
                disabled={disabled}
                value={model}
                onChange={(e) => onModel(e.target.value)}
              >
                <option value="">Choose a model</option>
                {status.models.map((m) => (
                  <option key={m.slug} value={m.slug}>
                    {m.display_name}
                  </option>
                ))}
              </select>
            </label>
          )}
          {status && (
            <p>
              {status.account ?? "Not connected"} ·{" "}
              {status.planUsage ? "Plan usage enabled" : "Plan usage disabled"}
            </p>
          )}
          {(error || status?.error) && (
            <p role="alert">{error || status?.error}</p>
          )}
          {status?.planUsage && !status.error && !status.models.length && (
            <p>No models available. Check your ChatGPT plan and reconnect.</p>
          )}
        </>
      )}
      <Link href="/settings/ai" className="underline">
        AI settings and connections
      </Link>
    </div>
  );
}

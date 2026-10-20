"use client";
import { useState } from "react";
import type { ChatGptStatus } from "@/lib/types/ai";
import { Button } from "@/components/ui/button";

export function AiConnection({
  status,
  outcome,
}: {
  status: ChatGptStatus;
  outcome?: string;
}) {
  const [planConsent, setPlanConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(
    outcome === "failed"
      ? "Connection failed or was declined. Retry below. Your Plotamour account is unchanged."
      : "",
  );
  async function connect() {
    setBusy(true);
    try {
      const res = await fetch("/api/ai/chatgpt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planConsent }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      window.location.assign(data.url);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Connection failed.");
      setBusy(false);
    }
  }
  async function disconnect() {
    setBusy(true);
    try {
      const res = await fetch("/api/ai/chatgpt", { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      window.location.assign(
        `/settings/ai?connection=${data.revoked ? "disconnected" : "local-only"}`,
      );
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Disconnect failed.");
      setBusy(false);
    }
  }
  return (
    <section className="space-y-5 rounded-xl border p-6">
      <h2 className="text-xl font-semibold">ChatGPT connection</h2>
      <p>
        {status.connected ? `Connected: ${status.account}` : "Not connected"}
      </p>
      <p>
        {status.planUsage
          ? "ChatGPT plan usage enabled"
          : "ChatGPT plan usage disabled"}
      </p>
      {status.error && <p role="alert">{status.error}</p>}
      {message && <p role="alert">{message}</p>}
      {outcome === "disconnected" && (
        <p role="status">Disconnected. Your Plotamour account is unchanged.</p>
      )}
      {outcome === "local-only" && (
        <p role="alert">
          Local credentials cleared. Remote revocation was not confirmed.
          Disconnect Plotamour in ChatGPT Settings.
        </p>
      )}
      <p className="text-sm text-muted-foreground">
        Connect an eligible Plus or Pro account for Scene Ideas. Your Google
        sign-in and Google Docs connection stay in place. This does not give
        Plotamour access to your ChatGPT conversations.
      </p>
      {status.enabled ? (
        <>
          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              checked={planConsent}
              onChange={(e) => setPlanConsent(e.target.checked)}
            />
            <span>
              Allow Plotamour to request ChatGPT plan usage. Scene Ideas will
              send this book’s outline and character context to OpenAI and use
              your plan allowance or available credits, according to your
              ChatGPT limits. You will confirm permissions with OpenAI.
            </span>
          </label>
          <div className="flex gap-3">
            <Button disabled={busy} onClick={connect}>
              Continue with ChatGPT
            </Button>
            {status.connected && (
              <Button variant="outline" disabled={busy} onClick={disconnect}>
                Disconnect ChatGPT
              </Button>
            )}
          </div>
          <p className="text-sm">
            You can connect without allowing plan usage. Select a provider and
            model in the scene panel before generating.
          </p>
          <a
            className="underline"
            href="https://chatgpt.com/settings/usage"
            target="_blank"
            rel="noreferrer"
          >
            Manage usage and app access in ChatGPT
          </a>
        </>
      ) : (
        <p>
          ChatGPT is available only in the explicitly enabled local app. Hosted
          access is pending confirmation.
        </p>
      )}
    </section>
  );
}

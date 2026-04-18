"use client";

import { useState, useEffect } from "react";
import { Share2, Copy, Check, Trash2, ExternalLink, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ProjectShare } from "@/lib/types/database";

interface ShareDialogProps {
  projectId: string;
}

export function ShareDialog({ projectId }: ShareDialogProps) {
  const [open, setOpen] = useState(false);
  const [share, setShare] = useState<ProjectShare | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    fetch("/api/sharing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "getShare", projectId }),
    })
      .then(async (r) => {
        const json = await r.json();
        if (!r.ok || json?.error) throw new Error(json?.error ?? "Failed to load share");
        setShare(json as ProjectShare | null);
      })
      .catch((e) => {
        console.error(e);
        setError(e.message ?? "Failed to load share info");
      });
  }, [open, projectId]);

  const shareUrl = share
    ? `${window.location.origin}/share/${share.share_token}`
    : null;

  const handleCreate = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/sharing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "createShare", projectId }),
      });
      const json = await res.json();
      if (!res.ok || json?.error) throw new Error(json?.error ?? "Failed to create share");
      setShare(json as ProjectShare);
    } catch (e: unknown) {
      console.error(e);
      setError(e instanceof Error ? e.message : "Failed to create share link");
    } finally {
      setLoading(false);
    }
  };

  const handleRevoke = async () => {
    if (!share) return;
    if (!confirm("Revoke this share link? Anyone with the link will lose access.")) return;
    setLoading(true);
    try {
      await fetch("/api/sharing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "deleteShare", shareId: share.id }),
      });
      setShare(null);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="gap-1.5 text-muted-foreground hover:text-foreground"
      >
        <Share2 className="h-3.5 w-3.5" />
        Share
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <div className="relative z-10 w-full max-w-md rounded-2xl border border-border bg-background p-6 shadow-2xl">
            {/* Header */}
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold">Share Project</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Anyone with the link can view (read-only).
                </p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {error && (
              <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                {error}
              </div>
            )}

            {share ? (
              <div className="space-y-4">
                {/* Share link */}
                <div className="flex items-center gap-2 rounded-xl border border-border bg-muted/40 px-3 py-2.5">
                  <p className="flex-1 truncate font-mono text-xs text-foreground/80">
                    {shareUrl}
                  </p>
                  <button
                    onClick={handleCopy}
                    className="shrink-0 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    title="Copy link"
                  >
                    {copied ? (
                      <Check className="h-3.5 w-3.5 text-emerald-500" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </button>
                  <a
                    href={shareUrl ?? ""}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    title="Open in new tab"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>

                <div className="flex gap-2">
                  <Button
                    className="flex-1 gap-2"
                    onClick={handleCopy}
                    disabled={loading}
                  >
                    {copied ? (
                      <><Check className="h-3.5 w-3.5" /> Copied!</>
                    ) : (
                      <><Copy className="h-3.5 w-3.5" /> Copy Link</>
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleRevoke}
                    disabled={loading}
                    className="gap-1.5 text-destructive hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Revoke
                  </Button>
                </div>

                <p className="text-[11px] text-muted-foreground/70">
                  Created {new Date(share.created_at).toLocaleDateString()}. Revoking will break the link immediately.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="rounded-xl border border-border bg-muted/30 p-4 text-center">
                  <Share2 className="mx-auto mb-2 h-8 w-8 text-muted-foreground/30" />
                  <p className="text-sm text-muted-foreground">No share link yet.</p>
                  <p className="text-xs text-muted-foreground/70 mt-1">
                    Generate a read-only link to share your outline with beta readers, editors, or collaborators.
                  </p>
                </div>
                <Button
                  className="w-full gap-2"
                  onClick={handleCreate}
                  disabled={loading}
                >
                  <Share2 className="h-3.5 w-3.5" />
                  {loading ? "Creating…" : "Generate Share Link"}
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

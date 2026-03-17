"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function DeleteProjectButton({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/projects?id=${projectId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      router.push("/projects");
      router.refresh();
    } catch (e) {
      console.error(e);
      setDeleting(false);
      setConfirming(false);
    }
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-1.5 px-3 py-2">
        <span className="text-[11px] text-destructive/80">Delete?</span>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="rounded px-2 py-0.5 text-[11px] font-semibold text-destructive hover:bg-destructive/10 disabled:opacity-50"
        >
          {deleting ? "…" : "Yes"}
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="rounded px-2 py-0.5 text-[11px] text-muted-foreground hover:bg-muted"
        >
          No
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="flex w-full items-center gap-2 rounded-md px-3 py-1.5 text-[12px] text-muted-foreground/50 transition-colors hover:bg-sidebar-accent hover:text-destructive/70"
    >
      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
      </svg>
      Delete project
    </button>
  );
}

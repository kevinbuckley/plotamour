"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

export default function ProjectError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Project error:", error);
  }, [error]);

  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center gap-5 p-8 text-center">
      <div className="relative">
        <div
          className="absolute inset-0 rounded-2xl blur-xl"
          style={{ background: "oklch(0.577 0.245 27.325 / 0.12)" }}
        />
        <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10 shadow-md ring-1 ring-destructive/10">
          <AlertTriangle className="h-8 w-8 text-destructive" />
        </div>
      </div>
      <div>
        <h2 className="text-lg font-bold tracking-tight">Something went wrong</h2>
        <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-muted-foreground">
          {error.message || "An unexpected error occurred while loading this page."}
        </p>
      </div>
      <div className="flex gap-3">
        <Button onClick={reset} className="gap-1.5">
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Try again
        </Button>
        <Button variant="outline" asChild className="text-muted-foreground hover:text-foreground">
          <a href="/projects">Back to projects</a>
        </Button>
      </div>
    </div>
  );
}

"use client";

import { useRecentScenes } from "@/lib/hooks/use-recent-scenes";
import { Clock, ArrowRight, X } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";

interface ResumeBannerProps {
  projectId: string;
  bookId: string;
}

function formatTimeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "yesterday";
  if (days < 7) return `${days} days ago`;
  return `${Math.floor(days / 7)}w ago`;
}

export function ResumeBanner({ projectId, bookId }: ResumeBannerProps) {
  const { recentScenes } = useRecentScenes(projectId);
  const [dismissed, setDismissed] = useState(false);
  const router = useRouter();

  const lastScene = recentScenes[0];

  // Don't show if no recent scenes, dismissed, or if the last visit was more than 30 days ago
  if (
    !lastScene ||
    dismissed ||
    Date.now() - lastScene.timestamp > 30 * 24 * 60 * 60 * 1000
  ) {
    return null;
  }

  // Don't show if it was less than 2 minutes ago (they're still actively working)
  if (Date.now() - lastScene.timestamp < 2 * 60 * 1000) {
    return null;
  }

  return (
    <div className="mx-4 sm:mx-6 mb-2 mt-3 overflow-hidden">
      <div className="group relative inline-flex overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-all hover:shadow-md">
        {/* Plotline color accent */}
        <div
          className="absolute left-0 top-0 h-full w-[3px]"
          style={{ backgroundColor: lastScene.plotlineColor }}
        />

        <div className="inline-flex items-center gap-4 px-5 py-3.5 pl-6">
          {/* Clock icon */}
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <Clock className="h-4.5 w-4.5 text-primary" />
          </div>

          {/* Text */}
          <div className="min-w-0">
            <p className="text-sm">
              <span className="text-muted-foreground">
                Pick up where you left off —{" "}
              </span>
              <span className="font-semibold text-foreground">
                {lastScene.sceneTitle}
              </span>
            </p>
            <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground/70">
              <span>{lastScene.chapterTitle}</span>
              <span>&middot;</span>
              <span
                className="inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-semibold text-white"
                style={{ backgroundColor: lastScene.plotlineColor }}
              >
                {lastScene.plotlineTitle}
              </span>
              <span>&middot;</span>
              <span>{formatTimeAgo(lastScene.timestamp)}</span>
              {lastScene.wordCount > 0 && (
                <>
                  <span>&middot;</span>
                  <span>{lastScene.wordCount.toLocaleString()} words</span>
                </>
              )}
            </p>
          </div>

          {/* Action buttons */}
          <button
            onClick={() => {
              router.push(
                `/project/${projectId}/timeline?bookId=${lastScene.bookId}`
              );
            }}
            className="flex shrink-0 items-center gap-1.5 rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-primary/20"
          >
            Continue
            <ArrowRight className="h-3 w-3" />
          </button>

          {/* Dismiss */}
          <button
            onClick={() => setDismissed(true)}
            className="shrink-0 rounded-md p-1 text-muted-foreground/40 transition-colors hover:bg-muted hover:text-muted-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

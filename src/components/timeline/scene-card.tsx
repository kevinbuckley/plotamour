"use client";

import { cn } from "@/lib/utils/cn";
import type { Scene, SceneGoogleDoc, WritingStatus } from "@/lib/types/database";
import { FileText } from "lucide-react";

type SceneWithDoc = Scene & { google_doc?: SceneGoogleDoc | null };

interface SceneCardProps {
  scene: SceneWithDoc;
  plotlineColor: string;
  onClick: () => void;
}

const STATUS_STYLES: Record<WritingStatus, string> = {
  not_started: "bg-gray-300",
  in_progress: "bg-yellow-400",
  draft_complete: "bg-green-500",
};

export function SceneCard({ scene, plotlineColor, onClick }: SceneCardProps) {
  const doc = scene.google_doc;
  const wordCount = doc?.word_count ?? 0;
  const status = doc?.writing_status ?? "not_started";

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full rounded-md border border-border bg-card p-2.5 text-left transition-all hover:shadow-sm",
        "cursor-pointer"
      )}
      style={{ borderLeftColor: plotlineColor, borderLeftWidth: 3 }}
    >
      <div className="flex items-start justify-between gap-1">
        <span className="line-clamp-2 text-sm font-medium leading-tight">
          {scene.title}
        </span>
        <div
          className={cn("mt-0.5 h-2 w-2 shrink-0 rounded-full", STATUS_STYLES[status])}
          title={status.replace(/_/g, " ")}
        />
      </div>

      {scene.summary && (
        <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">
          {scene.summary}
        </p>
      )}

      {doc && wordCount > 0 && (
        <div className="mt-1.5 flex items-center gap-1 text-xs text-muted-foreground">
          <FileText className="h-3 w-3" />
          <span>{wordCount.toLocaleString()} words</span>
        </div>
      )}
    </button>
  );
}

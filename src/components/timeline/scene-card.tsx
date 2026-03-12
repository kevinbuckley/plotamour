"use client";

import { cn } from "@/lib/utils/cn";
import type { Scene, SceneGoogleDoc, WritingStatus } from "@/lib/types/database";
import { FileText, GripVertical } from "lucide-react";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";

type SceneWithDoc = Scene & { google_doc?: SceneGoogleDoc | null };

interface SceneCardProps {
  scene: SceneWithDoc;
  plotlineColor: string;
  onClick: () => void;
}

const STATUS_CONFIG: Record<WritingStatus, { label: string; dot: string; pill: string }> = {
  not_started: {
    label: "Not started",
    dot: "bg-gray-300 ring-1 ring-gray-300/50",
    pill: "bg-gray-100 text-gray-500",
  },
  in_progress: {
    label: "Writing",
    dot: "bg-amber-400 ring-2 ring-amber-400/30",
    pill: "bg-amber-50 text-amber-600",
  },
  draft_complete: {
    label: "Complete",
    dot: "bg-emerald-500 ring-2 ring-emerald-500/30",
    pill: "bg-emerald-50 text-emerald-600",
  },
};

export function SceneCard({ scene, plotlineColor, onClick }: SceneCardProps) {
  const doc = scene.google_doc;
  const wordCount = doc?.word_count ?? 0;
  const status = doc?.writing_status ?? "not_started";
  const statusCfg = STATUS_CONFIG[status];

  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: scene.id,
      data: {
        type: "scene",
        scene,
      },
    });

  const style = {
    transform: CSS.Translate.toString(transform),
    borderLeftColor: plotlineColor,
    borderLeftWidth: "4px",
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group/card w-full overflow-hidden rounded-lg border border-border bg-card text-left shadow-sm transition-all duration-150 hover:shadow-md",
        isDragging && "z-50 opacity-50 shadow-xl"
      )}
    >
      <div className="flex items-start gap-1 p-2.5">
        {/* Drag handle */}
        <button
          {...attributes}
          {...listeners}
          className="mt-0.5 shrink-0 cursor-grab touch-none text-muted-foreground/40 opacity-0 transition-opacity active:cursor-grabbing group-hover/card:opacity-100"
        >
          <GripVertical className="h-3.5 w-3.5" />
        </button>

        {/* Card content — clickable */}
        <button onClick={onClick} className="min-w-0 flex-1 text-left">
          <div className="flex items-start justify-between gap-1.5">
            <span className="line-clamp-2 text-sm font-medium leading-snug">
              {scene.title}
            </span>
            <div
              className={cn(
                "mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full transition-transform group-hover/card:scale-110",
                statusCfg.dot
              )}
              title={statusCfg.label}
            />
          </div>

          {scene.summary && (
            <p className="mt-1 line-clamp-1 text-xs leading-relaxed text-muted-foreground">
              {scene.summary}
            </p>
          )}

          {doc && wordCount > 0 && (
            <div className="mt-2 flex items-center gap-1 text-[11px] text-muted-foreground">
              <FileText className="h-2.5 w-2.5" />
              <span>{wordCount.toLocaleString()} words</span>
            </div>
          )}
        </button>
      </div>
    </div>
  );
}

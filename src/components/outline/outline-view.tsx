"use client";

import { useState } from "react";
import { cn } from "@/lib/utils/cn";
import { ChevronRight, ChevronDown, ExternalLink, Loader2, PenLine } from "lucide-react";
import type { Chapter, Plotline, Scene, SceneGoogleDoc, WritingStatus } from "@/lib/types/database";

type SceneWithDoc = Scene & { google_doc?: SceneGoogleDoc | null };

interface OutlineViewProps {
  projectId: string;
  chapters: Chapter[];
  plotlines: Plotline[];
  scenes: SceneWithDoc[];
}

const STATUS_CONFIG: Record<WritingStatus, { icon: string; className: string; label: string; pillClass: string }> = {
  not_started: { icon: "○", className: "text-gray-400", label: "Not started", pillClass: "bg-gray-100 text-gray-500" },
  in_progress: { icon: "◐", className: "text-amber-500", label: "Writing", pillClass: "bg-amber-50 text-amber-600" },
  draft_complete: { icon: "●", className: "text-emerald-500", label: "Complete", pillClass: "bg-emerald-50 text-emerald-700" },
};

export function OutlineView({ projectId, chapters, plotlines, scenes }: OutlineViewProps) {
  const [collapsedChapters, setCollapsedChapters] = useState<Set<string>>(new Set());
  const [creatingDocForScene, setCreatingDocForScene] = useState<string | null>(null);
  const [docErrors, setDocErrors] = useState<Record<string, string>>({});

  const toggleChapter = (id: string) => {
    setCollapsedChapters((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const getScenesForChapter = (chapterId: string) =>
    scenes
      .filter((s) => s.chapter_id === chapterId)
      .sort((a, b) => {
        const plotA = plotlines.findIndex((p) => p.id === a.plotline_id);
        const plotB = plotlines.findIndex((p) => p.id === b.plotline_id);
        return plotA - plotB || a.position - b.position;
      });

  const handleCreateDoc = async (sceneId: string) => {
    setCreatingDocForScene(sceneId);
    setDocErrors((prev) => {
      const next = { ...prev };
      delete next[sceneId];
      return next;
    });

    try {
      const res = await fetch("/api/google-docs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "createDoc",
          sceneId,
          projectId,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.url) {
          window.open(data.url, "_blank");
          // Reload to update doc status
          window.location.reload();
        } else {
          setDocErrors((prev) => ({ ...prev, [sceneId]: "Failed to create doc." }));
        }
      } else {
        const err = await res.json().catch(() => ({}));
        setDocErrors((prev) => ({
          ...prev,
          [sceneId]: err.needsReconnect ? "reconnect" : (err.error || "Failed to create Google Doc."),
        }));
      }
    } catch {
      setDocErrors((prev) => ({ ...prev, [sceneId]: "Network error. Please try again." }));
    } finally {
      setCreatingDocForScene(null);
    }
  };

  const totalWords = scenes.reduce((sum, s) => sum + (s.google_doc?.word_count ?? 0), 0);
  const completedScenes = scenes.filter((s) => s.google_doc?.writing_status === "draft_complete").length;
  const inProgressScenes = scenes.filter((s) => s.google_doc?.writing_status === "in_progress").length;
  const completionPct = scenes.length > 0 ? Math.round((completedScenes / scenes.length) * 100) : 0;

  return (
    <div className="mx-auto max-w-3xl p-6">
      {/* Summary bar */}
      <div className="mb-8 overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <div className="grid grid-cols-3 divide-x divide-border">
          <div className="px-5 py-4">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Scenes</p>
            <p className="mt-1 text-2xl font-bold text-foreground">{scenes.length}</p>
          </div>
          <div className="px-5 py-4">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Words</p>
            <p className="mt-1 text-2xl font-bold text-foreground">{totalWords.toLocaleString()}</p>
          </div>
          <div className="px-5 py-4">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Complete</p>
            <p className="mt-1 text-2xl font-bold text-foreground">
              {completedScenes}
              <span className="ml-1 text-base font-normal text-muted-foreground">/ {scenes.length}</span>
            </p>
          </div>
        </div>
        {/* Overall progress bar */}
        {scenes.length > 0 && (
          <div className="border-t border-border px-5 py-3">
            <div className="mb-1.5 flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                {inProgressScenes > 0 && `${inProgressScenes} in progress · `}
                {completionPct}% drafted
              </p>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all duration-500"
                style={{ width: `${completionPct}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Outline tree */}
      <div className="space-y-2">
        {chapters.map((chapter, chapterIdx) => {
          const chapterScenes = getScenesForChapter(chapter.id);
          const isCollapsed = collapsedChapters.has(chapter.id);
          const chapterWords = chapterScenes.reduce(
            (sum, s) => sum + (s.google_doc?.word_count ?? 0),
            0
          );
          const chapterComplete = chapterScenes.filter(
            (s) => s.google_doc?.writing_status === "draft_complete"
          ).length;
          const chapterPct =
            chapterScenes.length > 0
              ? Math.round((chapterComplete / chapterScenes.length) * 100)
              : 0;

          return (
            <div key={chapter.id} className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
              {/* Chapter header */}
              <button
                onClick={() => toggleChapter(chapter.id)}
                className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-muted/40"
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/12 text-[11px] font-bold text-primary">
                  {chapterIdx + 1}
                </span>
                {isCollapsed ? (
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                )}
                <span className="font-semibold">{chapter.title}</span>
                <div className="ml-auto flex items-center gap-3">
                  {chapterScenes.length > 0 && (
                    <div className="hidden items-center gap-2 sm:flex">
                      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-emerald-500 transition-all"
                          style={{ width: `${chapterPct}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground">{chapterPct}%</span>
                    </div>
                  )}
                  <span className="text-xs text-muted-foreground">
                    {chapterScenes.length} scene{chapterScenes.length !== 1 ? "s" : ""}
                    {chapterWords > 0 && ` · ${chapterWords.toLocaleString()} words`}
                  </span>
                </div>
              </button>

              {/* Scenes */}
              {!isCollapsed && (
                <div className="border-t border-border/60">
                  {chapterScenes.length > 0 ? (
                    chapterScenes.map((scene, sceneIdx) => {
                      const plotline = plotlines.find((p) => p.id === scene.plotline_id);
                      const doc = scene.google_doc;
                      const status = doc?.writing_status ?? "not_started";
                      const statusInfo = STATUS_CONFIG[status];
                      const isCreating = creatingDocForScene === scene.id;
                      const error = docErrors[scene.id];

                      return (
                        <div
                          key={scene.id}
                          className={cn(
                            "flex items-start gap-3 px-4 py-3 transition-colors hover:bg-muted/30",
                            sceneIdx < chapterScenes.length - 1 && "border-b border-border/40"
                          )}
                        >
                          {/* Status indicator */}
                          <span
                            className={cn("mt-0.5 shrink-0 text-base leading-none", statusInfo.className)}
                            title={statusInfo.label}
                          >
                            {statusInfo.icon}
                          </span>

                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-sm font-medium">{scene.title}</span>
                              {plotline && (
                                <span
                                  className="rounded-full px-1.5 py-0.5 text-[10px] font-semibold text-white"
                                  style={{ backgroundColor: plotline.color }}
                                >
                                  {plotline.title}
                                </span>
                              )}
                              {doc && (
                                <span className={cn("rounded-full px-1.5 py-0.5 text-[10px] font-medium", statusInfo.pillClass)}>
                                  {statusInfo.label}
                                </span>
                              )}
                            </div>
                            {scene.summary && (
                              <p className="mt-0.5 line-clamp-1 text-xs leading-relaxed text-muted-foreground">
                                {scene.summary}
                              </p>
                            )}
                            {/* Google Doc link or create button */}
                            <div className="mt-1.5">
                              {doc?.google_doc_url ? (
                                <a
                                  href={doc.google_doc_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs text-muted-foreground transition-all hover:bg-primary/8 hover:text-primary"
                                >
                                  <ExternalLink className="h-3 w-3" />
                                  <span>Open in Google Docs</span>
                                  {doc.word_count > 0 && (
                                    <span className="text-muted-foreground/60">
                                      · {doc.word_count.toLocaleString()} words
                                    </span>
                                  )}
                                </a>
                              ) : (
                                <button
                                  onClick={() => handleCreateDoc(scene.id)}
                                  disabled={isCreating}
                                  className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs text-muted-foreground transition-all hover:bg-primary/8 hover:text-primary disabled:opacity-50"
                                >
                                  {isCreating ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                  ) : (
                                    <PenLine className="h-3 w-3" />
                                  )}
                                  <span>{isCreating ? "Creating..." : "Write in Google Docs"}</span>
                                </button>
                              )}
                              {error && (
                                error === "reconnect" ? (
                                  <p className="mt-0.5 text-xs text-destructive">
                                    Google Docs not connected.{" "}
                                    <a
                                      href={`/auth/login?reconnect=true&next=${encodeURIComponent(window.location.pathname)}`}
                                      className="underline hover:no-underline"
                                    >
                                      Connect →
                                    </a>
                                  </p>
                                ) : (
                                  <p className="mt-0.5 text-xs text-destructive">{error}</p>
                                )
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p className="px-4 py-3 text-xs text-muted-foreground">
                      No scenes in this chapter yet. Add them from the Timeline.
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

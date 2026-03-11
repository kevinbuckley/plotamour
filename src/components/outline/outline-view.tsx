"use client";

import { useState } from "react";
import { cn } from "@/lib/utils/cn";
import { ChevronRight, ChevronDown, FileText, ExternalLink, Loader2 } from "lucide-react";
import type { Chapter, Plotline, Scene, SceneGoogleDoc, WritingStatus } from "@/lib/types/database";

type SceneWithDoc = Scene & { google_doc?: SceneGoogleDoc | null };

interface OutlineViewProps {
  projectId: string;
  chapters: Chapter[];
  plotlines: Plotline[];
  scenes: SceneWithDoc[];
}

const STATUS_ICONS: Record<WritingStatus, { icon: string; className: string }> = {
  not_started: { icon: "○", className: "text-gray-400" },
  in_progress: { icon: "◐", className: "text-yellow-500" },
  draft_complete: { icon: "●", className: "text-green-500" },
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

  return (
    <div className="mx-auto max-w-3xl p-6">
      {/* Summary bar */}
      <div className="mb-6 flex items-center gap-4 rounded-lg bg-muted/50 px-4 py-3 text-sm">
        <span>
          <strong>{scenes.length}</strong> scenes
        </span>
        <span className="text-muted-foreground">&middot;</span>
        <span>
          <strong>{totalWords.toLocaleString()}</strong> words
        </span>
        <span className="text-muted-foreground">&middot;</span>
        <span>
          <strong>{completedScenes}</strong> / {scenes.length} complete
        </span>
      </div>

      {/* Outline tree */}
      <div className="space-y-1">
        {chapters.map((chapter) => {
          const chapterScenes = getScenesForChapter(chapter.id);
          const isCollapsed = collapsedChapters.has(chapter.id);
          const chapterWords = chapterScenes.reduce(
            (sum, s) => sum + (s.google_doc?.word_count ?? 0),
            0
          );

          return (
            <div key={chapter.id}>
              {/* Chapter header */}
              <button
                onClick={() => toggleChapter(chapter.id)}
                className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left transition-colors hover:bg-muted"
              >
                {isCollapsed ? (
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                )}
                <span className="font-semibold">{chapter.title}</span>
                <span className="ml-auto text-xs text-muted-foreground">
                  {chapterScenes.length} scene{chapterScenes.length !== 1 ? "s" : ""}
                  {chapterWords > 0 && ` · ${chapterWords.toLocaleString()} words`}
                </span>
              </button>

              {/* Scenes */}
              {!isCollapsed && (
                <div className="ml-6 space-y-0.5 border-l border-border pl-4">
                  {chapterScenes.length > 0 ? (
                    chapterScenes.map((scene) => {
                      const plotline = plotlines.find((p) => p.id === scene.plotline_id);
                      const doc = scene.google_doc;
                      const status = doc?.writing_status ?? "not_started";
                      const statusInfo = STATUS_ICONS[status];
                      const isCreating = creatingDocForScene === scene.id;
                      const error = docErrors[scene.id];

                      return (
                        <div
                          key={scene.id}
                          className="group flex items-start gap-2 rounded-md px-2 py-2 transition-colors hover:bg-muted/50"
                        >
                          <span className={cn("mt-0.5 text-sm", statusInfo.className)}>
                            {statusInfo.icon}
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium">{scene.title}</span>
                              {plotline && (
                                <span
                                  className="rounded-full px-1.5 py-0.5 text-[10px] font-medium text-white"
                                  style={{ backgroundColor: plotline.color }}
                                >
                                  {plotline.title}
                                </span>
                              )}
                            </div>
                            {scene.summary && (
                              <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                                {scene.summary}
                              </p>
                            )}
                            {/* Google Doc link or create button */}
                            <div className="mt-1">
                              {doc?.google_doc_url ? (
                                <a
                                  href={doc.google_doc_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-primary"
                                >
                                  <ExternalLink className="h-3 w-3" />
                                  <span>Open in Google Docs</span>
                                  {doc.word_count > 0 && (
                                    <span className="text-muted-foreground/70">
                                      · {doc.word_count.toLocaleString()} words
                                    </span>
                                  )}
                                </a>
                              ) : (
                                <button
                                  onClick={() => handleCreateDoc(scene.id)}
                                  disabled={isCreating}
                                  className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-primary disabled:opacity-50"
                                >
                                  {isCreating ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                  ) : (
                                    <FileText className="h-3 w-3" />
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
                    <p className="px-2 py-2 text-xs text-muted-foreground">
                      No scenes in this chapter yet.
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

"use client";

import React, { useState, useCallback, useEffect, useMemo } from "react";
import { cn } from "@/lib/utils/cn";
import { PLOTLINE_COLORS } from "@/lib/config/constants";
import type {
  Chapter,
  Plotline,
  Scene,
  SceneGoogleDoc,
  Character,
  Place,
  Tag,
  StoryPromise,
} from "@/lib/types/database";
import { SceneCard } from "./scene-card";
import { SceneDetailPanel } from "./scene-detail-panel";
import { DroppableCell } from "./droppable-cell";
import { Plus } from "lucide-react";
import { useRecentScenes } from "@/lib/hooks/use-recent-scenes";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";

type SceneWithDoc = Scene & { google_doc?: SceneGoogleDoc | null };

interface TimelineGridProps {
  bookId: string;
  projectId: string;
  chapters: Chapter[];
  plotlines: Plotline[];
  scenes: SceneWithDoc[];
  characters: Character[];
  places: Place[];
  tags: Tag[];
}

async function timelineAction(body: Record<string, unknown>) {
  const res = await fetch("/api/timeline", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error("API call failed");
  return res.json();
}

export function TimelineGrid({
  bookId,
  projectId,
  chapters: initialChapters,
  plotlines: initialPlotlines,
  scenes: initialScenes,
  characters: initialCharacters,
  places: initialPlaces,
  tags: initialTags,
}: TimelineGridProps) {
  const [chapters, setChapters] = useState(initialChapters);
  const [plotlines, setPlotlines] = useState(initialPlotlines);
  const [scenes, setScenes] = useState(initialScenes);
  const [characters] = useState(initialCharacters);
  const [places] = useState(initialPlaces);
  const [tags, setTags] = useState(initialTags);
  const [selectedScene, setSelectedScene] = useState<SceneWithDoc | null>(null);
  const [editingChapter, setEditingChapter] = useState<string | null>(null);
  const [editingPlotline, setEditingPlotline] = useState<string | null>(null);
  const [activeScene, setActiveScene] = useState<SceneWithDoc | null>(null);
  const [promises, setPromises] = useState<StoryPromise[]>([]);
  const { trackScene } = useRecentScenes(projectId);

  // Fetch story promises for the book
  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/story-promises", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "getForBook", bookId }),
      signal: controller.signal,
    })
      .then((r) => { if (!r.ok) throw new Error("Failed to fetch promises"); return r.json(); })
      .then(setPromises)
      .catch((e) => { if (e.name !== "AbortError") console.error("Failed to load promises:", e); });
    return () => controller.abort();
  }, [bookId]);

  // Build a set of scene IDs that have promises
  const sceneIdsWithPromises = useMemo(() => {
    const ids = new Set<string>();
    for (const p of promises) {
      ids.add(p.plant_scene_id);
      if (p.payoff_scene_id) ids.add(p.payoff_scene_id);
    }
    return ids;
  }, [promises]);

  const handleSelectScene = useCallback(
    (scene: SceneWithDoc) => {
      setSelectedScene(scene);
      const chapter = chapters.find((c) => c.id === scene.chapter_id);
      const plotline = plotlines.find((p) => p.id === scene.plotline_id);
      trackScene({
        sceneId: scene.id,
        sceneTitle: scene.title,
        chapterTitle: chapter?.title ?? "Unknown Chapter",
        plotlineTitle: plotline?.title ?? "Unknown Plotline",
        plotlineColor: plotline?.color ?? "#6366f1",
        projectId,
        bookId,
        wordCount: scene.google_doc?.word_count ?? 0,
      });
    },
    [chapters, plotlines, projectId, bookId, trackScene]
  );

  // Require 8px of movement before starting a drag (so clicks still work)
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const getScenesForCell = useCallback(
    (chapterId: string, plotlineId: string) =>
      scenes.filter(
        (s) => s.chapter_id === chapterId && s.plotline_id === plotlineId
      ),
    [scenes]
  );

  const handleAddChapter = async () => {
    try {
      const index = chapters.length + 1;
      const chapter = await timelineAction({
        action: "addChapter",
        bookId,
        title: `Chapter ${index}`,
        index,
      });
      setChapters((prev) => [...prev, chapter]);
    } catch (e) {
      console.error("Failed to add chapter:", e);
    }
  };

  const handleAddPlotline = async () => {
    try {
      const colorIndex = plotlines.length % PLOTLINE_COLORS.length;
      const plotline = await timelineAction({
        action: "addPlotline",
        bookId,
        title: "New Plotline",
        colorIndex,
      });
      setPlotlines((prev) => [...prev, plotline]);
    } catch (e) {
      console.error("Failed to add plotline:", e);
    }
  };

  const handleAddScene = async (chapterId: string, plotlineId: string) => {
    try {
      const scene = await timelineAction({
        action: "addScene",
        bookId,
        chapterId,
        plotlineId,
      });
      setScenes((prev) => [...prev, { ...scene, google_doc: null }]);
    } catch (e) {
      console.error("Failed to add scene:", e);
    }
  };

  const handleUpdateScene = async (id: string, data: Partial<Scene>) => {
    try {
      const updated = await timelineAction({ action: "updateScene", id, data });
      setScenes((prev) =>
        prev.map((s) => (s.id === id ? { ...s, ...updated } : s))
      );
      if (selectedScene?.id === id) {
        setSelectedScene((prev) => (prev ? { ...prev, ...updated } : null));
      }
    } catch (e) {
      console.error("Failed to update scene:", e);
    }
  };

  const handleDeleteScene = async (id: string) => {
    try {
      await timelineAction({ action: "deleteScene", id });
      setScenes((prev) => prev.filter((s) => s.id !== id));
      if (selectedScene?.id === id) setSelectedScene(null);
    } catch (e) {
      console.error("Failed to delete scene:", e);
    }
  };

  const handleRenameChapter = async (id: string, title: string) => {
    try {
      await timelineAction({ action: "updateChapter", id, title });
      setChapters((prev) =>
        prev.map((c) => (c.id === id ? { ...c, title } : c))
      );
      setEditingChapter(null);
    } catch (e) {
      console.error("Failed to rename chapter:", e);
    }
  };

  const handleDeleteChapter = async (id: string) => {
    try {
      const scenesInChapter = scenes.filter((s) => s.chapter_id === id);
      if (scenesInChapter.length > 0) {
        if (
          !confirm(
            `This chapter has ${scenesInChapter.length} scene(s). Delete anyway?`
          )
        )
          return;
      }
      await timelineAction({ action: "deleteChapter", id });
      setChapters((prev) => prev.filter((c) => c.id !== id));
      setScenes((prev) => prev.filter((s) => s.chapter_id !== id));
    } catch (e) {
      console.error("Failed to delete chapter:", e);
    }
  };

  const handleDeletePlotline = async (id: string) => {
    try {
      const scenesInPlotline = scenes.filter((s) => s.plotline_id === id);
      if (scenesInPlotline.length > 0) {
        if (
          !confirm(
            `This plotline has ${scenesInPlotline.length} scene(s). Delete anyway?`
          )
        )
          return;
      }
      await timelineAction({ action: "deletePlotline", id });
      setPlotlines((prev) => prev.filter((p) => p.id !== id));
      setScenes((prev) => prev.filter((s) => s.plotline_id !== id));
    } catch (e) {
      console.error("Failed to delete plotline:", e);
    }
  };

  const handleMoveScene = async (
    sceneId: string,
    newChapterId: string,
    newPlotlineId: string
  ) => {
    try {
      await timelineAction({
        action: "moveScene",
        sceneId,
        chapterId: newChapterId,
        plotlineId: newPlotlineId,
        position: 0,
      });
      setScenes((prev) =>
        prev.map((s) =>
          s.id === sceneId
            ? { ...s, chapter_id: newChapterId, plotline_id: newPlotlineId }
            : s
        )
      );
    } catch (e) {
      console.error("Failed to move scene:", e);
    }
  };

  // --- Drag and Drop ---
  const handleDragStart = (event: DragStartEvent) => {
    const scene = scenes.find((s) => s.id === event.active.id);
    if (scene) setActiveScene(scene);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveScene(null);
    const { active, over } = event;
    if (!over) return;

    const overData = over.data?.current;
    if (overData?.type !== "cell") return;

    const sceneId = active.id as string;
    const scene = scenes.find((s) => s.id === sceneId);
    if (!scene) return;

    const { chapterId, plotlineId } = overData as {
      chapterId: string;
      plotlineId: string;
    };

    // Only move if the cell changed
    if (scene.chapter_id === chapterId && scene.plotline_id === plotlineId)
      return;

    handleMoveScene(sceneId, chapterId, plotlineId);
  };

  const activePlotline = activeScene
    ? plotlines.find((p) => p.id === activeScene.plotline_id)
    : null;

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      {/* ── Mobile view: chapter accordion ── */}
      <div className="md:hidden flex flex-col gap-4 p-4">
        {/* Plotline legend + add */}
        <div className="flex flex-wrap items-center gap-2">
          {plotlines.map((plotline) => (
            <span
              key={plotline.id}
              className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold text-white"
              style={{ backgroundColor: plotline.color }}
            >
              {plotline.title}
            </span>
          ))}
          <button
            onClick={handleAddPlotline}
            className="inline-flex items-center gap-1 rounded-full border border-dashed border-border/60 px-2.5 py-1 text-xs text-muted-foreground/60 hover:border-primary/60 hover:text-primary"
          >
            <Plus className="h-3 w-3" />
            Plotline
          </button>
        </div>

        {/* Chapter sections */}
        {chapters.map((chapter, idx) => (
          <div key={chapter.id} className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
            {/* Chapter header */}
            <div className="flex items-center gap-2 border-b border-border/60 bg-muted/30 px-3 py-2.5">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/15 text-[11px] font-bold text-primary">
                {idx + 1}
              </span>
              {editingChapter === chapter.id ? (
                <input
                  className="flex-1 rounded border border-input bg-background px-2 py-0.5 text-sm"
                  defaultValue={chapter.title}
                  autoFocus
                  onBlur={(e) => handleRenameChapter(chapter.id, e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleRenameChapter(chapter.id, e.currentTarget.value);
                    if (e.key === "Escape") setEditingChapter(null);
                  }}
                />
              ) : (
                <span
                  className="flex-1 text-sm font-semibold"
                  onClick={() => setEditingChapter(chapter.id)}
                >
                  {chapter.title}
                </span>
              )}
              <button
                onClick={() => handleDeleteChapter(chapter.id)}
                className="shrink-0 rounded p-1 text-muted-foreground/40 hover:bg-destructive/10 hover:text-destructive"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Scenes per plotline */}
            <div className="divide-y divide-border/40">
              {plotlines.map((plotline) => {
                const cellScenes = getScenesForCell(chapter.id, plotline.id);
                return (
                  <div key={plotline.id} className="p-3">
                    <div className="mb-2 flex items-center gap-1.5">
                      <div className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: plotline.color }} />
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                        {plotline.title}
                      </span>
                    </div>
                    <div className="space-y-1.5">
                      {cellScenes.map((scene) => (
                        <button
                          key={scene.id}
                          onClick={() => handleSelectScene(scene)}
                          className="w-full rounded-lg border border-border/60 bg-background px-3 py-2 text-left transition-colors hover:border-primary/40 hover:bg-primary/5"
                          style={{ borderLeftColor: plotline.color, borderLeftWidth: "3px" }}
                        >
                          <span className="block text-sm font-medium leading-snug">{scene.title}</span>
                          {scene.summary && (
                            <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{scene.summary}</p>
                          )}
                        </button>
                      ))}
                      <button
                        onClick={() => handleAddScene(chapter.id, plotline.id)}
                        className="flex w-full items-center gap-1.5 rounded-md border border-dashed border-border/40 px-3 py-1.5 text-xs text-muted-foreground/50 hover:border-primary/50 hover:text-primary"
                      >
                        <Plus className="h-3 w-3" />
                        Add scene
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {/* Add chapter */}
        <button
          onClick={handleAddChapter}
          className="flex items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-border/60 py-3 text-sm text-muted-foreground/60 hover:border-primary/60 hover:bg-primary/5 hover:text-primary"
        >
          <Plus className="h-4 w-4" />
          Add chapter
        </button>
      </div>

      {/* ── Desktop view: grid ── */}
      <div className="relative hidden md:block">
        {/* Grid */}
        <div className="min-w-max p-4">
          <div
            className="grid gap-2"
            style={{
              gridTemplateColumns: `188px repeat(${chapters.length}, 200px) 52px`,
              gridTemplateRows: `auto repeat(${plotlines.length}, minmax(76px, auto)) 52px`,
            }}
          >
            {/* Top-left empty cell */}
            <div />

            {/* Chapter headers */}
            {chapters.map((chapter, idx) => (
              <div
                key={chapter.id}
                className="group flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2.5 shadow-sm"
              >
                {/* Chapter number badge */}
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/15 text-[11px] font-bold text-primary">
                  {idx + 1}
                </span>

                {editingChapter === chapter.id ? (
                  <input
                    className="w-full rounded border border-input bg-background px-2 py-1 text-sm"
                    defaultValue={chapter.title}
                    autoFocus
                    onBlur={(e) =>
                      handleRenameChapter(chapter.id, e.target.value)
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter")
                        handleRenameChapter(
                          chapter.id,
                          e.currentTarget.value
                        );
                      if (e.key === "Escape") setEditingChapter(null);
                    }}
                  />
                ) : (
                  <>
                    <span
                      className="flex-1 cursor-pointer truncate text-sm font-semibold"
                      onDoubleClick={() => setEditingChapter(chapter.id)}
                      title="Double-click to rename"
                    >
                      {chapter.title}
                    </span>
                    <button
                      onClick={() => handleDeleteChapter(chapter.id)}
                      className="shrink-0 text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
                      title="Delete chapter"
                    >
                      <svg
                        className="h-3.5 w-3.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </>
                )}
              </div>
            ))}

            {/* Add chapter button */}
            <button
              onClick={handleAddChapter}
              className="flex items-center justify-center rounded-lg border-2 border-dashed border-border/60 text-muted-foreground/60 transition-all hover:border-primary/60 hover:bg-primary/5 hover:text-primary"
              title="Add chapter"
            >
              <Plus className="h-4 w-4" />
            </button>

            {/* Plotline rows */}
            {plotlines.map((plotline) => (
              <React.Fragment key={plotline.id}>
                {/* Plotline header */}
                <div
                  key={`header-${plotline.id}`}
                  className="group relative flex items-center gap-2.5 overflow-hidden rounded-lg border border-border pl-3.5 pr-3 py-2.5 shadow-sm"
                  style={{ backgroundColor: `${plotline.color}10`, borderLeftColor: plotline.color, borderLeftWidth: "3px" }}
                >
                  <div
                    className="h-2.5 w-2.5 shrink-0 rounded-full shadow-sm"
                    style={{ backgroundColor: plotline.color }}
                  />
                  {editingPlotline === plotline.id ? (
                    <input
                      className="w-full rounded border border-input bg-background px-2 py-1 text-sm"
                      defaultValue={plotline.title}
                      autoFocus
                      onBlur={(e) => {
                        const newTitle = e.target.value;
                        setPlotlines((prev) =>
                          prev.map((p) =>
                            p.id === plotline.id
                              ? { ...p, title: newTitle }
                              : p
                          )
                        );
                        setEditingPlotline(null);
                        timelineAction({
                          action: "updatePlotline",
                          id: plotline.id,
                          title: newTitle,
                        }).catch((err) => console.error("Failed to rename plotline:", err));
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          const newTitle = e.currentTarget.value;
                          setPlotlines((prev) =>
                            prev.map((p) =>
                              p.id === plotline.id
                                ? { ...p, title: newTitle }
                                : p
                            )
                          );
                          setEditingPlotline(null);
                          timelineAction({
                            action: "updatePlotline",
                            id: plotline.id,
                            title: newTitle,
                          }).catch((err) => console.error("Failed to rename plotline:", err));
                        }
                        if (e.key === "Escape") setEditingPlotline(null);
                      }}
                    />
                  ) : (
                    <>
                      <span
                        className="flex-1 cursor-pointer truncate text-sm font-semibold"
                        onDoubleClick={() =>
                          setEditingPlotline(plotline.id)
                        }
                        title="Double-click to rename"
                      >
                        {plotline.title}
                      </span>
                      <button
                        onClick={() => handleDeletePlotline(plotline.id)}
                        className="shrink-0 text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
                        title="Delete plotline"
                      >
                        <svg
                          className="h-3.5 w-3.5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </>
                  )}
                </div>

                {/* Scene cells — now droppable */}
                {chapters.map((chapter) => {
                  const cellScenes = getScenesForCell(
                    chapter.id,
                    plotline.id
                  );
                  return (
                    <DroppableCell
                      key={`${chapter.id}-${plotline.id}`}
                      chapterId={chapter.id}
                      plotlineId={plotline.id}
                      isOver={false}
                    >
                      {cellScenes.map((scene) => (
                        <SceneCard
                          key={scene.id}
                          scene={scene}
                          plotlineColor={plotline.color}
                          hasPromises={sceneIdsWithPromises.has(scene.id)}
                          onClick={() => handleSelectScene(scene)}
                        />
                      ))}
                      <button
                        onClick={() =>
                          handleAddScene(chapter.id, plotline.id)
                        }
                        className={cn(
                          "flex items-center justify-center rounded-md border border-dashed border-border/50 py-2 text-muted-foreground/50 transition-all hover:border-primary/60 hover:bg-primary/5 hover:text-primary",
                          "mt-auto opacity-0 group-hover/cell:opacity-100"
                        )}
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </DroppableCell>
                  );
                })}

                {/* Empty cell at end of plotline row */}
                <div key={`end-${plotline.id}`} />
              </React.Fragment>
            ))}

            {/* Add plotline row */}
            <button
              onClick={handleAddPlotline}
              className="flex items-center justify-center gap-1.5 rounded-lg border-2 border-dashed border-border/60 py-3 text-sm text-muted-foreground/60 transition-all hover:border-primary/60 hover:bg-primary/5 hover:text-primary"
            >
              <Plus className="h-4 w-4" />
              <span>Add plotline</span>
            </button>
          </div>
        </div>

        {/* Drag overlay — the ghost card that follows the cursor */}
        <DragOverlay dropAnimation={null}>
          {activeScene && (
            <div
              className="w-[188px] rotate-2 overflow-hidden rounded-lg border border-border bg-card p-2.5 opacity-95 shadow-2xl"
              style={{
                borderLeftColor: activePlotline?.color ?? "#6366f1",
                borderLeftWidth: "4px",
                backgroundColor: activePlotline ? `${activePlotline.color}0d` : undefined,
              }}
            >
              <span className="line-clamp-2 text-sm font-medium leading-snug">
                {activeScene.title}
              </span>
              {activeScene.summary && (
                <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">
                  {activeScene.summary}
                </p>
              )}
            </div>
          )}
        </DragOverlay>

      </div>

      {/* Scene detail panel — shared for both mobile and desktop */}
      {selectedScene && (
        <SceneDetailPanel
          scene={selectedScene}
          chapters={chapters}
          plotlines={plotlines}
          projectId={projectId}
          characters={characters}
          places={places}
          tags={tags}
          onUpdate={handleUpdateScene}
          onDelete={handleDeleteScene}
          onMove={handleMoveScene}
          onClose={() => setSelectedScene(null)}
          onTagCreated={(tag) => setTags((prev) => [...prev, tag])}
        />
      )}
    </DndContext>
  );
}

"use client";

import { useState, useCallback } from "react";
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
} from "@/lib/types/database";
import { SceneCard } from "./scene-card";
import { SceneDetailPanel } from "./scene-detail-panel";
import { DroppableCell } from "./droppable-cell";
import { Plus } from "lucide-react";
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
    const index = chapters.length + 1;
    const chapter = await timelineAction({
      action: "addChapter",
      bookId,
      title: `Chapter ${index}`,
      index,
    });
    setChapters((prev) => [...prev, chapter]);
  };

  const handleAddPlotline = async () => {
    const colorIndex = plotlines.length % PLOTLINE_COLORS.length;
    const plotline = await timelineAction({
      action: "addPlotline",
      bookId,
      title: "New Plotline",
      colorIndex,
    });
    setPlotlines((prev) => [...prev, plotline]);
  };

  const handleAddScene = async (chapterId: string, plotlineId: string) => {
    const scene = await timelineAction({
      action: "addScene",
      bookId,
      chapterId,
      plotlineId,
    });
    setScenes((prev) => [...prev, { ...scene, google_doc: null }]);
  };

  const handleUpdateScene = async (id: string, data: Partial<Scene>) => {
    const updated = await timelineAction({ action: "updateScene", id, data });
    setScenes((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...updated } : s))
    );
    if (selectedScene?.id === id) {
      setSelectedScene((prev) => (prev ? { ...prev, ...updated } : null));
    }
  };

  const handleDeleteScene = async (id: string) => {
    await timelineAction({ action: "deleteScene", id });
    setScenes((prev) => prev.filter((s) => s.id !== id));
    if (selectedScene?.id === id) setSelectedScene(null);
  };

  const handleRenameChapter = async (id: string, title: string) => {
    await timelineAction({ action: "updateChapter", id, title });
    setChapters((prev) =>
      prev.map((c) => (c.id === id ? { ...c, title } : c))
    );
    setEditingChapter(null);
  };

  const handleDeleteChapter = async (id: string) => {
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
  };

  const handleDeletePlotline = async (id: string) => {
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
  };

  const handleMoveScene = async (
    sceneId: string,
    newChapterId: string,
    newPlotlineId: string
  ) => {
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
      <div className="relative">
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
              <>
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
                        timelineAction({
                          action: "updatePlotline",
                          id: plotline.id,
                          title: e.target.value,
                        });
                        setPlotlines((prev) =>
                          prev.map((p) =>
                            p.id === plotline.id
                              ? { ...p, title: e.target.value }
                              : p
                          )
                        );
                        setEditingPlotline(null);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          timelineAction({
                            action: "updatePlotline",
                            id: plotline.id,
                            title: e.currentTarget.value,
                          });
                          setPlotlines((prev) =>
                            prev.map((p) =>
                              p.id === plotline.id
                                ? { ...p, title: e.currentTarget.value }
                                : p
                            )
                          );
                          setEditingPlotline(null);
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
                          onClick={() => setSelectedScene(scene)}
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
              </>
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

        {/* Scene detail panel */}
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
      </div>
    </DndContext>
  );
}

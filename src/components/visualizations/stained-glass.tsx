"use client";

import { useMemo, useState } from "react";
import type { Chapter, Plotline, Scene, SceneGoogleDoc } from "@/lib/types/database";

type SceneWithDoc = Scene & { google_doc?: SceneGoogleDoc | null };

interface StainedGlassProps {
  chapters: Chapter[];
  plotlines: Plotline[];
  scenes: SceneWithDoc[];
}

interface CellData {
  sceneId: string;
  sceneTitle: string;
  chapterId: string;
  chapterTitle: string;
  chapterIndex: number;
  plotlineTitle: string;
  plotlineColor: string;
  wordCount: number;
  isUnwritten: boolean;
}

interface LayoutCell extends CellData {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Simple hash from string to get pseudo-random but deterministic values */
function hashCode(s: string): number {
  let hash = 0;
  for (let i = 0; i < s.length; i++) {
    hash = ((hash << 5) - hash + s.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

const SVG_WIDTH = 800;
const CELL_GAP = 3;
const CHAPTER_GAP = 8;
const ROW_GAP = 3;
const MIN_CELL_WIDTH = 40;
const MAX_CELL_WIDTH = 160;
const MIN_CELL_HEIGHT = 50;
const MAX_CELL_HEIGHT = 80;
const PADDING_X = 6;
const PADDING_TOP = 20;

export function StainedGlass({ chapters, plotlines, scenes }: StainedGlassProps) {
  const [hoveredCell, setHoveredCell] = useState<string | null>(null);

  const cells = useMemo<CellData[]>(() => {
    const result: CellData[] = [];

    for (let ci = 0; ci < chapters.length; ci++) {
      const chapter = chapters[ci];
      const chapterScenes = scenes
        .filter((s) => s.chapter_id === chapter.id)
        .sort((a, b) => {
          const plotA = plotlines.findIndex((p) => p.id === a.plotline_id);
          const plotB = plotlines.findIndex((p) => p.id === b.plotline_id);
          if (plotA !== plotB) return plotA - plotB;
          const wcA = a.google_doc?.word_count ?? 0;
          const wcB = b.google_doc?.word_count ?? 0;
          return wcB - wcA;
        });

      for (const scene of chapterScenes) {
        const plotline = plotlines.find((p) => p.id === scene.plotline_id);
        const wc = scene.google_doc?.word_count ?? 0;
        result.push({
          sceneId: scene.id,
          sceneTitle: scene.title,
          chapterId: chapter.id,
          chapterTitle: chapter.title,
          chapterIndex: ci,
          plotlineTitle: plotline?.title ?? "Unknown",
          plotlineColor: plotline?.color ?? "#6366f1",
          wordCount: wc,
          isUnwritten: wc === 0,
        });
      }
    }

    return result;
  }, [chapters, plotlines, scenes]);

  const layout = useMemo<{ cells: LayoutCell[]; svgHeight: number; chapterLabels: { x: number; label: string }[] }>(() => {
    if (cells.length === 0) return { cells: [], svgHeight: 0, chapterLabels: [] };

    // Compute cell widths based on word count
    const maxWc = Math.max(...cells.map((c) => c.wordCount), 1);
    const MIN_WC_FOR_SIZING = 200; // minimum effective word count for unwritten scenes

    const cellWidths = cells.map((c) => {
      const effectiveWc = c.isUnwritten ? MIN_WC_FOR_SIZING : c.wordCount;
      const ratio = effectiveWc / maxWc;
      return MIN_CELL_WIDTH + ratio * (MAX_CELL_WIDTH - MIN_CELL_WIDTH);
    });

    const cellHeights = cells.map((c) => {
      const h = hashCode(c.sceneId);
      return MIN_CELL_HEIGHT + (h % (MAX_CELL_HEIGHT - MIN_CELL_HEIGHT + 1));
    });

    const usableWidth = SVG_WIDTH - PADDING_X * 2;

    // Group cells by chapter for chapter gap insertion
    const chapterGroups: { chapterIndex: number; chapterId: string; chapterTitle: string; indices: number[] }[] = [];
    let lastChapterId = "";
    for (let i = 0; i < cells.length; i++) {
      if (cells[i].chapterId !== lastChapterId) {
        chapterGroups.push({
          chapterIndex: cells[i].chapterIndex,
          chapterId: cells[i].chapterId,
          chapterTitle: cells[i].chapterTitle,
          indices: [],
        });
        lastChapterId = cells[i].chapterId;
      }
      chapterGroups[chapterGroups.length - 1].indices.push(i);
    }

    // Pack cells into rows, inserting chapter gaps
    const layoutCells: LayoutCell[] = [];
    const chapterLabels: { x: number; label: string }[] = [];
    let cursorX = PADDING_X;
    let cursorY = PADDING_TOP;
    let rowMaxHeight = 0;
    let prevChapterId = "";
    let chapterRowStartX = PADDING_X;

    for (let i = 0; i < cells.length; i++) {
      const cell = cells[i];
      const w = cellWidths[i];
      const h = cellHeights[i];

      // Check for chapter boundary
      const isNewChapter = cell.chapterId !== prevChapterId;
      if (isNewChapter && prevChapterId !== "") {
        // Add chapter gap (or wrap if not enough space)
        if (cursorX + CHAPTER_GAP + w > PADDING_X + usableWidth) {
          // Wrap to new row
          cursorY += rowMaxHeight + ROW_GAP;
          cursorX = PADDING_X;
          rowMaxHeight = 0;
        } else {
          cursorX += CHAPTER_GAP - CELL_GAP; // extra gap beyond normal
        }
      }

      if (isNewChapter) {
        chapterRowStartX = cursorX;
      }

      // Check if cell fits in current row
      if (cursorX + w > PADDING_X + usableWidth && cursorX > PADDING_X) {
        // Wrap
        cursorY += rowMaxHeight + ROW_GAP;
        cursorX = PADDING_X;
        rowMaxHeight = 0;
      }

      layoutCells.push({
        ...cell,
        x: cursorX,
        y: cursorY,
        width: w,
        height: h,
      });

      rowMaxHeight = Math.max(rowMaxHeight, h);
      cursorX += w + CELL_GAP;

      // Track chapter label position — record on first cell of each chapter
      if (isNewChapter) {
        chapterLabels.push({
          x: chapterRowStartX,
          label: `Ch ${cell.chapterIndex + 1}`,
        });
      }

      prevChapterId = cell.chapterId;
    }

    const svgHeight = cursorY + rowMaxHeight + 10;

    return { cells: layoutCells, svgHeight, chapterLabels };
  }, [cells]);

  if (scenes.length === 0) return null;
  if (layout.cells.length === 0) return null;

  const isHovering = hoveredCell !== null;

  /** Truncate text to fit within a width (approximate: 6px per char at fontSize 10) */
  const truncateText = (text: string, availableWidth: number): string => {
    const charWidth = 5.5;
    const maxChars = Math.floor((availableWidth - 8) / charWidth); // 8px horizontal padding
    if (maxChars <= 2) return "";
    if (text.length <= maxChars) return text;
    return text.slice(0, maxChars - 1) + "\u2026";
  };

  const hoveredData = hoveredCell ? layout.cells.find((c) => c.sceneId === hoveredCell) : null;

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      <div className="flex items-center justify-between border-b border-border/60 px-3 sm:px-5 py-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
            Stained Glass
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Every scene as a pane of light
          </p>
        </div>
      </div>

      <div className="relative px-1 sm:px-3 py-4">
        <svg
          viewBox={`0 0 ${SVG_WIDTH} ${layout.svgHeight}`}
          className="w-full touch-none"
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Dark background — the lead/darkness behind stained glass */}
          <rect x="0" y="0" width={SVG_WIDTH} height={layout.svgHeight} rx="6" fill="#1a1a2e" />

          {/* Glow filter for hover */}
          <defs>
            <filter id="sg-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Chapter labels */}
          {layout.chapterLabels.map((cl, i) => (
            <text
              key={i}
              x={cl.x + 2}
              y={12}
              fontSize="9"
              fontWeight="600"
              fill="rgba(255,255,255,0.3)"
              fontFamily="system-ui, sans-serif"
            >
              {cl.label}
            </text>
          ))}

          {/* Glass panes */}
          {layout.cells.map((cell) => {
            const isThisHovered = hoveredCell === cell.sceneId;
            const dimmed = isHovering && !isThisHovered;
            const label = truncateText(cell.sceneTitle, cell.width);
            const showLabel = cell.width >= 50 && cell.height >= 40;

            return (
              <g
                key={cell.sceneId}
                style={{ cursor: "pointer" }}
                onMouseEnter={() => setHoveredCell(cell.sceneId)}
                onMouseLeave={() => setHoveredCell(null)}
              >
                <rect
                  x={cell.x}
                  y={cell.y}
                  width={cell.width}
                  height={cell.height}
                  rx={8}
                  ry={8}
                  fill={cell.plotlineColor}
                  fillOpacity={
                    cell.isUnwritten
                      ? dimmed ? 0.05 : 0.15
                      : isThisHovered ? 1.0 : dimmed ? 0.35 : 0.75
                  }
                  stroke={cell.isUnwritten ? cell.plotlineColor : "#1a1a2e"}
                  strokeWidth={cell.isUnwritten ? 1.5 : 2}
                  strokeDasharray={cell.isUnwritten ? "4 3" : "none"}
                  strokeOpacity={cell.isUnwritten ? (dimmed ? 0.2 : 0.5) : 1}
                  filter={isThisHovered ? "url(#sg-glow)" : undefined}
                  style={{
                    transition: "fill-opacity 150ms, transform 150ms",
                  }}
                />

                {/* Scene title inside cell */}
                {showLabel && label && (
                  <text
                    x={cell.x + cell.width / 2}
                    y={cell.y + cell.height / 2}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontSize="10"
                    fontWeight="500"
                    fontFamily="system-ui, sans-serif"
                    fill="white"
                    fillOpacity={
                      cell.isUnwritten
                        ? dimmed ? 0.1 : 0.4
                        : isThisHovered ? 1.0 : dimmed ? 0.3 : 0.85
                    }
                    style={{
                      textShadow: "0 1px 3px rgba(0,0,0,0.8)",
                      pointerEvents: "none",
                    }}
                  >
                    {label}
                  </text>
                )}
              </g>
            );
          })}
        </svg>

        {/* Hover tooltip */}
        {hoveredData && (
          <div
            className="pointer-events-none absolute z-10 max-w-[220px] rounded-lg border border-border bg-popover px-2.5 py-1.5 shadow-lg sm:px-3 sm:py-2"
            style={{
              left: `${Math.max(10, Math.min(90, ((hoveredData.x + hoveredData.width / 2) / SVG_WIDTH) * 100))}%`,
              top: `${Math.max(0, (hoveredData.y / layout.svgHeight) * 100 - 2)}%`,
              transform: "translate(-50%, -100%)",
            }}
          >
            <p className="truncate text-xs font-semibold">{hoveredData.sceneTitle}</p>
            <p className="truncate text-[10px] text-muted-foreground">{hoveredData.chapterTitle}</p>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[10px] text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: hoveredData.plotlineColor }}
                />
                {hoveredData.plotlineTitle}
              </span>
              {hoveredData.wordCount > 0 ? (
                <span>{hoveredData.wordCount.toLocaleString()} words</span>
              ) : (
                <span className="italic">Unwritten</span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 border-t border-border/60 bg-muted/20 px-3 sm:px-5 py-2.5">
        {plotlines.map((pl) => (
          <div key={pl.id} className="flex items-center gap-1.5">
            <span
              className="h-2 w-4 rounded-sm"
              style={{ backgroundColor: pl.color }}
            />
            <span className="text-[10px] text-muted-foreground">{pl.title}</span>
          </div>
        ))}
        <div className="flex items-center gap-1.5">
          <span className="h-3 w-4 rounded-sm border-2 border-dashed border-muted-foreground/40 opacity-40" />
          <span className="text-[10px] text-muted-foreground">Unwritten</span>
        </div>
      </div>
    </div>
  );
}

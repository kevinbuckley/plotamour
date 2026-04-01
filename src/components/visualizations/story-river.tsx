"use client";

import { useMemo, useState, useRef, useCallback } from "react";
import type { Chapter, Plotline, Scene, SceneGoogleDoc } from "@/lib/types/database";

type SceneWithDoc = Scene & { google_doc?: SceneGoogleDoc | null };

interface StoryRiverProps {
  chapters: Chapter[];
  plotlines: Plotline[];
  scenes: SceneWithDoc[];
}

interface HoverInfo {
  plotlineTitle: string;
  chapterTitle: string;
  wordCount: number;
  sceneCount: number;
  x: number;
  y: number;
}

const SVG_WIDTH = 900;
const SVG_HEIGHT = 400;
const PADDING_X = 50;
const PADDING_Y = 30;
const PADDING_BOTTOM = 40;
const RIVER_GAP = 10;
const MIN_WORDS = 100;
const THREAD_THICKNESS = 2;

/**
 * Darken a hex color by a percentage for the gradient bottom.
 */
function darkenColor(hex: string, amount: number): string {
  const cleaned = hex.replace("#", "");
  const num = parseInt(cleaned, 16);
  const r = Math.max(0, ((num >> 16) & 0xff) - amount);
  const g = Math.max(0, ((num >> 8) & 0xff) - amount);
  const b = Math.max(0, (num & 0xff) - amount);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}

export function StoryRiver({ chapters, plotlines, scenes }: StoryRiverProps) {
  const [hoveredPlotline, setHoveredPlotline] = useState<string | null>(null);
  const [hoverInfo, setHoverInfo] = useState<HoverInfo | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // Compute word counts per plotline per chapter
  const riverData = useMemo(() => {
    // For each plotline, compute word count per chapter
    const data: {
      plotline: Plotline;
      chapterValues: { wordCount: number; sceneCount: number }[];
    }[] = [];

    for (const pl of plotlines) {
      const chapterValues = chapters.map((ch) => {
        const chScenes = scenes.filter(
          (s) => s.chapter_id === ch.id && s.plotline_id === pl.id
        );
        if (chScenes.length === 0) {
          return { wordCount: 0, sceneCount: 0 };
        }
        const wc = chScenes.reduce((sum, s) => {
          const raw = s.google_doc?.word_count ?? 0;
          return sum + (raw > 0 ? raw : MIN_WORDS);
        }, 0);
        return { wordCount: wc, sceneCount: chScenes.length };
      });

      // Only include plotlines that have at least one scene somewhere
      const hasAnyScene = chapterValues.some((v) => v.sceneCount > 0);
      if (hasAnyScene) {
        data.push({ plotline: pl, chapterValues });
      }
    }

    return data;
  }, [chapters, plotlines, scenes]);

  // Compute geometry: x positions, thicknesses, y centers
  const geometry = useMemo(() => {
    if (riverData.length === 0 || chapters.length < 2) return null;

    const numChapters = chapters.length;
    const graphWidth = SVG_WIDTH - PADDING_X * 2;
    const graphHeight = SVG_HEIGHT - PADDING_Y - PADDING_BOTTOM;

    // X position for each chapter
    const chapterXs = chapters.map((_, i) =>
      PADDING_X + (i / (numChapters - 1)) * graphWidth
    );

    // Find max total word count across all chapters (for scaling)
    const chapterTotals = chapters.map((_, ci) =>
      riverData.reduce((sum, rd) => sum + Math.max(rd.chapterValues[ci].wordCount, rd.chapterValues[ci].sceneCount > 0 ? 0 : 0), 0)
    );

    // For thickness scaling, find the max word count for any single plotline in any chapter
    const maxPlotlineWords = Math.max(
      ...riverData.flatMap((rd) =>
        rd.chapterValues.map((v) => v.wordCount)
      ),
      1
    );

    // Total gap space between rivers
    const totalGaps = (riverData.length - 1) * RIVER_GAP;
    // Max thickness available per river
    const maxThicknessPerRiver = (graphHeight - totalGaps) / riverData.length;
    // Scale: max words maps to max thickness
    const thicknessScale = maxThicknessPerRiver / maxPlotlineWords;

    // For each chapter column, compute the y-center and half-thickness for each river
    const rivers = riverData.map((rd, riverIdx) => {
      const chapterPoints = chapterXs.map((x, ci) => {
        const wc = rd.chapterValues[ci].wordCount;
        const hasScenes = rd.chapterValues[ci].sceneCount > 0;
        const thickness = hasScenes
          ? Math.max(THREAD_THICKNESS * 2, wc * thicknessScale)
          : THREAD_THICKNESS;
        return { x, halfThickness: thickness / 2, wordCount: wc, sceneCount: rd.chapterValues[ci].sceneCount };
      });

      return { plotline: rd.plotline, chapterPoints };
    });

    // Now compute y-centers by stacking at each chapter column
    // Use the maximum thickness of each river across all chapters to determine its "lane"
    const riverMaxThickness = rivers.map((r) =>
      Math.max(...r.chapterPoints.map((p) => p.halfThickness * 2))
    );

    // Compute lane center positions (fixed across chapters for smooth flow)
    const totalRiverHeight =
      riverMaxThickness.reduce((a, b) => a + b, 0) + totalGaps;
    const startY = PADDING_Y + (graphHeight - totalRiverHeight) / 2;

    let currentY = startY;
    const riverCenters = riverMaxThickness.map((maxH) => {
      const center = currentY + maxH / 2;
      currentY += maxH + RIVER_GAP;
      return center;
    });

    // Assign y-centers
    const finalRivers = rivers.map((r, ri) => ({
      ...r,
      yCenter: riverCenters[ri],
    }));

    return { chapterXs, rivers: finalRivers };
  }, [riverData, chapters]);

  /**
   * Build a smooth closed path for a river given its top and bottom edge points.
   */
  const buildRiverPath = useCallback(
    (
      points: { x: number; halfThickness: number }[],
      yCenter: number
    ): string => {
      if (points.length < 2) return "";

      // Top edge: left to right
      const topPoints = points.map((p) => ({
        x: p.x,
        y: yCenter - p.halfThickness,
      }));
      // Bottom edge: right to left
      const bottomPoints = points
        .map((p) => ({
          x: p.x,
          y: yCenter + p.halfThickness,
        }))
        .reverse();

      // Build top edge with cubic beziers
      let d = `M ${topPoints[0].x} ${topPoints[0].y}`;
      for (let i = 1; i < topPoints.length; i++) {
        const prev = topPoints[i - 1];
        const curr = topPoints[i];
        const cpx1 = prev.x + (curr.x - prev.x) * 0.45;
        const cpx2 = prev.x + (curr.x - prev.x) * 0.55;
        d += ` C ${cpx1} ${prev.y}, ${cpx2} ${curr.y}, ${curr.x} ${curr.y}`;
      }

      // Connect to bottom edge (rightmost point)
      d += ` L ${bottomPoints[0].x} ${bottomPoints[0].y}`;

      // Build bottom edge with cubic beziers (going right to left)
      for (let i = 1; i < bottomPoints.length; i++) {
        const prev = bottomPoints[i - 1];
        const curr = bottomPoints[i];
        const cpx1 = prev.x + (curr.x - prev.x) * 0.45;
        const cpx2 = prev.x + (curr.x - prev.x) * 0.55;
        d += ` C ${cpx1} ${prev.y}, ${cpx2} ${curr.y}, ${curr.x} ${curr.y}`;
      }

      d += " Z";
      return d;
    },
    []
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent, plotline: Plotline) => {
      const svg = svgRef.current;
      if (!svg || !geometry) return;

      const rect = svg.getBoundingClientRect();
      const svgX = ((e.clientX - rect.left) / rect.width) * SVG_WIDTH;

      // Find nearest chapter
      let nearestIdx = 0;
      let nearestDist = Infinity;
      for (let i = 0; i < geometry.chapterXs.length; i++) {
        const dist = Math.abs(svgX - geometry.chapterXs[i]);
        if (dist < nearestDist) {
          nearestDist = dist;
          nearestIdx = i;
        }
      }

      const river = geometry.rivers.find((r) => r.plotline.id === plotline.id);
      if (!river) return;

      const cp = river.chapterPoints[nearestIdx];
      setHoverInfo({
        plotlineTitle: plotline.title,
        chapterTitle: chapters[nearestIdx].title,
        wordCount: cp.wordCount,
        sceneCount: cp.sceneCount,
        x: ((e.clientX - rect.left) / rect.width) * 100,
        y: ((river.yCenter - cp.halfThickness) / SVG_HEIGHT) * 100,
      });
      setHoveredPlotline(plotline.id);
    },
    [geometry, chapters]
  );

  const handleMouseLeave = useCallback(() => {
    setHoverInfo(null);
    setHoveredPlotline(null);
  }, []);

  if (chapters.length < 2 || scenes.length === 0) {
    return null;
  }

  if (!geometry || geometry.rivers.length === 0) {
    return null;
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      <div className="flex items-center justify-between border-b border-border/60 px-3 sm:px-5 py-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
            Story River
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Plotline flow across your story
          </p>
        </div>
      </div>

      <div className="relative px-1 sm:px-3 py-4">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
          className="w-full touch-none"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            {/* Gradient for each river */}
            {geometry.rivers.map((river) => (
              <linearGradient
                key={`grad-${river.plotline.id}`}
                id={`river-grad-${river.plotline.id}`}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop
                  offset="0%"
                  stopColor={river.plotline.color}
                  stopOpacity="0.8"
                />
                <stop
                  offset="100%"
                  stopColor={darkenColor(river.plotline.color, 40)}
                  stopOpacity="0.65"
                />
              </linearGradient>
            ))}
          </defs>

          {/* Chapter vertical dashed lines */}
          {geometry.chapterXs.map((x, i) => (
            <g key={`ch-${i}`}>
              <line
                x1={x}
                y1={PADDING_Y - 5}
                x2={x}
                y2={SVG_HEIGHT - PADDING_BOTTOM + 5}
                stroke="currentColor"
                className="text-border/40"
                strokeDasharray="3 4"
                strokeWidth="0.5"
              />
              <text
                x={x}
                y={SVG_HEIGHT - PADDING_BOTTOM + 20}
                textAnchor="middle"
                className="fill-muted-foreground/50"
                fontSize="10"
                fontWeight="500"
              >
                Ch {i + 1}
              </text>
            </g>
          ))}

          {/* River paths */}
          {geometry.rivers.map((river) => {
            const path = buildRiverPath(river.chapterPoints, river.yCenter);
            const isHovered = hoveredPlotline === river.plotline.id;
            const isDimmed =
              hoveredPlotline !== null && hoveredPlotline !== river.plotline.id;

            return (
              <g key={river.plotline.id}>
                {/* Filled river shape */}
                <path
                  d={path}
                  fill={`url(#river-grad-${river.plotline.id})`}
                  fillOpacity={isDimmed ? 0.2 : isHovered ? 0.9 : 0.7}
                  stroke={river.plotline.color}
                  strokeWidth={isHovered ? 1.5 : 1}
                  strokeOpacity={isDimmed ? 0.15 : isHovered ? 1 : 0.6}
                  style={{ transition: "fill-opacity 200ms, stroke-opacity 200ms" }}
                />

                {/* Invisible wider hit-area path for easier hovering */}
                <path
                  d={buildRiverPath(
                    river.chapterPoints.map((p) => ({
                      ...p,
                      halfThickness: Math.max(p.halfThickness, 10),
                    })),
                    river.yCenter
                  )}
                  fill="transparent"
                  stroke="transparent"
                  strokeWidth="0"
                  className="cursor-pointer"
                  onMouseMove={(e) => handleMouseMove(e, river.plotline)}
                  onMouseLeave={handleMouseLeave}
                />
              </g>
            );
          })}
        </svg>

        {/* Hover tooltip */}
        {hoverInfo && (
          <div
            className="pointer-events-none absolute z-10 max-w-[220px] rounded-lg border border-border bg-popover px-2.5 py-1.5 shadow-lg"
            style={{
              left: `${Math.max(10, Math.min(90, hoverInfo.x))}%`,
              top: `${Math.max(0, hoverInfo.y - 4)}%`,
              transform: "translate(-50%, -100%)",
            }}
          >
            <p className="truncate text-xs font-semibold">{hoverInfo.plotlineTitle}</p>
            <p className="truncate text-[10px] text-muted-foreground">
              {hoverInfo.chapterTitle}:{" "}
              {hoverInfo.sceneCount > 0
                ? `${hoverInfo.wordCount.toLocaleString()} words (${hoverInfo.sceneCount} scene${hoverInfo.sceneCount !== 1 ? "s" : ""})`
                : "No scenes"}
            </p>
          </div>
        )}
      </div>

      {/* Legend footer */}
      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 border-t border-border/60 bg-muted/20 px-3 sm:px-5 py-2.5">
        {plotlines.map((p) => (
          <div key={p.id} className="flex items-center gap-1.5">
            <span
              className="h-2 w-4 rounded-sm"
              style={{ backgroundColor: p.color }}
            />
            <span className="text-[10px] text-muted-foreground">{p.title}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

"use client";

import { useMemo, useState, useCallback, useRef } from "react";
import { cn } from "@/lib/utils/cn";
import type { Chapter, Plotline, Scene, SceneGoogleDoc } from "@/lib/types/database";

type SceneWithDoc = Scene & { google_doc?: SceneGoogleDoc | null };

interface PacingHeartbeatProps {
  chapters: Chapter[];
  plotlines: Plotline[];
  scenes: SceneWithDoc[];
}

interface PacingPoint {
  sceneId: string;
  sceneTitle: string;
  chapterId: string;
  chapterTitle: string;
  chapterIndex: number;
  intensity: number; // 0-1 normalized
  rawScore: number;
  wordCount: number;
  hasConflict: boolean;
  plotlineColor: string;
}

/**
 * Calculate emotional intensity score for a scene.
 * Derives pacing from existing scene data — no AI needed.
 */
function calculateIntensity(scene: SceneWithDoc): number {
  let score = 0;

  // Conflict: strongest pacing signal (0-40 points)
  if (scene.conflict) {
    const conflictLen = scene.conflict.trim().length;
    score += Math.min(40, 10 + conflictLen * 0.15);
  }

  // Summary complexity (0-25 points)
  if (scene.summary) {
    const summaryLen = scene.summary.trim().length;
    const sentences = scene.summary.split(/[.!?]+/).filter(Boolean).length;
    score += Math.min(15, summaryLen * 0.05);
    score += Math.min(10, sentences * 2);

    // Tension keywords boost
    const tensionWords = /\b(fight|battle|argue|confront|reveal|betray|escape|chase|attack|scream|die|death|kill|secret|shock|discover|danger|threat|fear|desperate|urgent|crisis|climax|twist|clash|ambush|trap)\b/gi;
    const matches = scene.summary.match(tensionWords);
    if (matches) score += Math.min(15, matches.length * 5);

    // Emotional keywords
    const emotionWords = /\b(love|hate|anger|grief|joy|tears|cry|laugh|kiss|embrace|mourn|rage|heartbreak|passion|fury)\b/gi;
    const emotionMatches = scene.summary.match(emotionWords);
    if (emotionMatches) score += Math.min(10, emotionMatches.length * 3);
  }

  // Word count indicates scene weight (0-10 points)
  const wordCount = scene.google_doc?.word_count ?? 0;
  if (wordCount > 0) {
    score += Math.min(10, wordCount / 300);
  }

  return score;
}

/**
 * Smooth intensity values using a simple moving average.
 */
function smoothValues(values: number[], windowSize: number): number[] {
  if (values.length <= 2) return values;
  const half = Math.floor(windowSize / 2);
  return values.map((_, i) => {
    const start = Math.max(0, i - half);
    const end = Math.min(values.length, i + half + 1);
    const slice = values.slice(start, end);
    return slice.reduce((a, b) => a + b, 0) / slice.length;
  });
}

// SVG layout constants — extracted so they're available in callbacks
const SVG_WIDTH = 800;
const SVG_HEIGHT = 200;
const PADDING_X = 40;
const PADDING_Y = 24;
const GRAPH_WIDTH = SVG_WIDTH - PADDING_X * 2;
const GRAPH_HEIGHT = SVG_HEIGHT - PADDING_Y * 2;

export function PacingHeartbeat({ chapters, plotlines, scenes }: PacingHeartbeatProps) {
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);
  const [showLabels, setShowLabels] = useState(true);
  const svgRef = useRef<SVGSVGElement>(null);

  const pacingData = useMemo(() => {
    const points: PacingPoint[] = [];

    for (let chapterIdx = 0; chapterIdx < chapters.length; chapterIdx++) {
      const chapter = chapters[chapterIdx];
      const chapterScenes = scenes
        .filter((s) => s.chapter_id === chapter.id)
        .sort((a, b) => a.position - b.position);

      for (const scene of chapterScenes) {
        const plotline = plotlines.find((p) => p.id === scene.plotline_id);
        const rawScore = calculateIntensity(scene);

        points.push({
          sceneId: scene.id,
          sceneTitle: scene.title,
          chapterId: chapter.id,
          chapterTitle: chapter.title,
          chapterIndex: chapterIdx,
          intensity: 0,
          rawScore,
          wordCount: scene.google_doc?.word_count ?? 0,
          hasConflict: !!scene.conflict?.trim(),
          plotlineColor: plotline?.color ?? "#6366f1",
        });
      }
    }

    const maxScore = Math.max(...points.map((p) => p.rawScore), 1);
    const smoothed = smoothValues(
      points.map((p) => p.rawScore),
      3
    );

    return points.map((p, i) => ({
      ...p,
      intensity: smoothed[i] / maxScore,
    }));
  }, [chapters, plotlines, scenes]);

  /**
   * Find nearest data point from a touch/click on the SVG.
   */
  const findNearestPoint = useCallback(
    (clientX: number) => {
      const svg = svgRef.current;
      if (!svg || pacingData.length < 2) return null;

      const rect = svg.getBoundingClientRect();
      const relativeX = (clientX - rect.left) / rect.width;

      // Map to SVG viewBox coordinates
      const svgX = relativeX * SVG_WIDTH;

      // Find closest point
      let closest = 0;
      let closestDist = Infinity;
      for (let i = 0; i < pacingData.length; i++) {
        const px = PADDING_X + (i / (pacingData.length - 1)) * GRAPH_WIDTH;
        const dist = Math.abs(svgX - px);
        if (dist < closestDist) {
          closestDist = dist;
          closest = i;
        }
      }
      return closest;
    },
    [pacingData]
  );

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (e.touches.length === 1) {
        const idx = findNearestPoint(e.touches[0].clientX);
        setHoveredPoint(idx);
      }
    },
    [findNearestPoint]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (e.touches.length === 1) {
        const idx = findNearestPoint(e.touches[0].clientX);
        setHoveredPoint(idx);
      }
    },
    [findNearestPoint]
  );

  const handleTouchEnd = useCallback(() => {
    // Delay clearing so the user can read the tooltip
    setTimeout(() => setHoveredPoint(null), 1500);
  }, []);

  if (pacingData.length < 2) {
    return null;
  }

  // Build the SVG path for the waveform
  const points = pacingData.map((p, i) => ({
    x: PADDING_X + (i / (pacingData.length - 1)) * GRAPH_WIDTH,
    y: PADDING_Y + GRAPH_HEIGHT - p.intensity * GRAPH_HEIGHT,
  }));

  // Create smooth bezier curve
  const pathD = points.reduce((path, point, i) => {
    if (i === 0) return `M ${point.x} ${point.y}`;
    const prev = points[i - 1];
    const cpx = (prev.x + point.x) / 2;
    return `${path} C ${cpx} ${prev.y}, ${cpx} ${point.y}, ${point.x} ${point.y}`;
  }, "");

  // Fill area path
  const fillD = `${pathD} L ${points[points.length - 1].x} ${PADDING_Y + GRAPH_HEIGHT} L ${points[0].x} ${PADDING_Y + GRAPH_HEIGHT} Z`;

  // Chapter boundaries for vertical markers
  const chapterBoundaries: { x: number; label: string }[] = [];
  let prevChapter = -1;
  pacingData.forEach((p, i) => {
    if (p.chapterIndex !== prevChapter) {
      prevChapter = p.chapterIndex;
      chapterBoundaries.push({
        x: PADDING_X + (i / (pacingData.length - 1)) * GRAPH_WIDTH,
        label: `Ch ${p.chapterIndex + 1}`,
      });
    }
  });

  const getIntensityColor = (intensity: number) => {
    if (intensity > 0.75) return "oklch(0.65 0.2 25)";
    if (intensity > 0.5) return "oklch(0.7 0.18 55)";
    if (intensity > 0.25) return "oklch(0.75 0.12 250)";
    return "oklch(0.75 0.08 200)";
  };

  const hoveredData = hoveredPoint !== null ? pacingData[hoveredPoint] : null;

  // Tooltip positioning — clamp to stay within bounds
  const getTooltipStyle = (pointIdx: number): React.CSSProperties => {
    const pct = (points[pointIdx].x / SVG_WIDTH) * 100;
    const yPct = (points[pointIdx].y / SVG_HEIGHT) * 100;
    // Clamp left so tooltip doesn't overflow on edges
    const clampedLeft = Math.max(15, Math.min(85, pct));
    return {
      left: `${clampedLeft}%`,
      top: `${Math.max(0, yPct - 16)}%`,
      transform: "translate(-50%, -100%)",
    };
  };

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      <div className="flex items-center justify-between border-b border-border/60 px-3 sm:px-5 py-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
            Pacing Heartbeat
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Emotional intensity across your story
          </p>
        </div>
        <button
          onClick={() => setShowLabels(!showLabels)}
          className="shrink-0 rounded-md px-2 py-1 text-[10px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          {showLabels ? "Hide" : "Show"} labels
        </button>
      </div>

      <div className="relative px-1 sm:px-3 py-4">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
          className="w-full touch-none"
          preserveAspectRatio="xMidYMid meet"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <defs>
            <linearGradient id="heartbeat-gradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="oklch(0.488 0.183 274.376)" stopOpacity="0.3" />
              <stop offset="100%" stopColor="oklch(0.488 0.183 274.376)" stopOpacity="0.02" />
            </linearGradient>
          </defs>

          {/* Horizontal grid lines */}
          {[0.25, 0.5, 0.75].map((level) => (
            <line
              key={level}
              x1={PADDING_X}
              y1={PADDING_Y + GRAPH_HEIGHT - level * GRAPH_HEIGHT}
              x2={PADDING_X + GRAPH_WIDTH}
              y2={PADDING_Y + GRAPH_HEIGHT - level * GRAPH_HEIGHT}
              stroke="currentColor"
              className="text-border/40"
              strokeDasharray="4 4"
            />
          ))}

          {/* Chapter boundary lines */}
          {chapterBoundaries.map((cb, i) => (
            <g key={i}>
              <line
                x1={cb.x}
                y1={PADDING_Y - 4}
                x2={cb.x}
                y2={PADDING_Y + GRAPH_HEIGHT}
                stroke="currentColor"
                className="text-border/60"
                strokeDasharray="2 3"
              />
              {showLabels && (
                <text
                  x={cb.x}
                  y={PADDING_Y + GRAPH_HEIGHT + 16}
                  textAnchor="middle"
                  className="fill-muted-foreground/50"
                  fontSize="10"
                  fontWeight="500"
                >
                  {cb.label}
                </text>
              )}
            </g>
          ))}

          {/* Y-axis labels */}
          {showLabels && (
            <>
              <text x={PADDING_X - 6} y={PADDING_Y + 4} textAnchor="end" className="fill-muted-foreground/40" fontSize="9">
                High
              </text>
              <text x={PADDING_X - 6} y={PADDING_Y + GRAPH_HEIGHT} textAnchor="end" className="fill-muted-foreground/40" fontSize="9">
                Low
              </text>
            </>
          )}

          {/* Fill area under curve */}
          <path d={fillD} fill="url(#heartbeat-gradient)" />

          {/* Main waveform line */}
          <path
            d={pathD}
            fill="none"
            stroke="oklch(0.488 0.183 274.376)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Data points */}
          {points.map((point, i) => {
            const data = pacingData[i];
            const isHovered = hoveredPoint === i;
            return (
              <g key={i}>
                {/* Hover/tap hitbox */}
                <circle
                  cx={point.x}
                  cy={point.y}
                  r={16}
                  fill="transparent"
                  className="cursor-pointer"
                  onMouseEnter={() => setHoveredPoint(i)}
                  onMouseLeave={() => setHoveredPoint(null)}
                />
                {/* Visible dot */}
                <circle
                  cx={point.x}
                  cy={point.y}
                  r={isHovered ? 6 : data.hasConflict ? 4 : 3}
                  fill={isHovered ? getIntensityColor(data.intensity) : "oklch(0.488 0.183 274.376)"}
                  stroke="white"
                  strokeWidth={isHovered ? 2 : 1.5}
                  className="transition-all duration-150"
                />
              </g>
            );
          })}
        </svg>

        {/* Hover/tap tooltip */}
        {hoveredData && hoveredPoint !== null && (
          <div
            className="pointer-events-none absolute z-10 max-w-[200px] rounded-lg border border-border bg-popover px-2.5 py-1.5 shadow-lg sm:px-3 sm:py-2"
            style={getTooltipStyle(hoveredPoint)}
          >
            <p className="truncate text-xs font-semibold">{hoveredData.sceneTitle}</p>
            <p className="truncate text-[10px] text-muted-foreground">{hoveredData.chapterTitle}</p>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[10px] text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: getIntensityColor(hoveredData.intensity) }}
                />
                {Math.round(hoveredData.intensity * 100)}% intensity
              </span>
              {hoveredData.wordCount > 0 && (
                <span>{hoveredData.wordCount.toLocaleString()} words</span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Intensity legend */}
      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 border-t border-border/60 bg-muted/20 px-3 sm:px-5 py-2.5">
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: "oklch(0.75 0.08 200)" }} />
          <span className="text-[10px] text-muted-foreground">Calm</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: "oklch(0.75 0.12 250)" }} />
          <span className="text-[10px] text-muted-foreground">Rising</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: "oklch(0.7 0.18 55)" }} />
          <span className="text-[10px] text-muted-foreground">Tense</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: "oklch(0.65 0.2 25)" }} />
          <span className="text-[10px] text-muted-foreground">Peak</span>
        </div>
      </div>
    </div>
  );
}

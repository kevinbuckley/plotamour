"use client";

import { useMemo, useState } from "react";
import type { Chapter, Plotline, Scene, SceneGoogleDoc } from "@/lib/types/database";

type SceneWithDoc = Scene & { google_doc?: SceneGoogleDoc | null };

interface TheSpineProps {
  chapters: Chapter[];
  plotlines: Plotline[];
  scenes: SceneWithDoc[];
}

interface ChapterData {
  chapter: Chapter;
  chapterIndex: number;
  totalWords: number;
  plotlineSegments: {
    plotline: Plotline;
    wordCount: number;
    sceneCount: number;
    hasUnwritten: boolean;
    allUnwritten: boolean;
  }[];
}

interface HoverInfo {
  chapterTitle: string;
  plotlineTitle: string;
  wordCount: number;
  sceneCount: number;
  x: number;
  y: number;
}

const SVG_WIDTH = 320;
const SVG_HEIGHT = 800;
const SPINE_WIDTH = 200;
const SPINE_X = (SVG_WIDTH - SPINE_WIDTH) / 2;
const GAP = 3;
const SEGMENT_GAP = 1;
const LABEL_X = SPINE_X - 10;
const MIN_WORDS = 150;

export function TheSpine({ chapters, plotlines, scenes }: TheSpineProps) {
  const [hover, setHover] = useState<HoverInfo | null>(null);
  const [hoveredChapterLabel, setHoveredChapterLabel] = useState<string | null>(null);

  const chapterData = useMemo(() => {
    const data: ChapterData[] = [];

    for (let i = 0; i < chapters.length; i++) {
      const chapter = chapters[i];
      const chapterScenes = scenes.filter((s) => s.chapter_id === chapter.id);

      // Group scenes by plotline
      const plotlineMap = new Map<
        string,
        { wordCount: number; sceneCount: number; hasUnwritten: boolean; allUnwritten: boolean }
      >();

      for (const scene of chapterScenes) {
        const wc = scene.google_doc?.word_count ?? 0;
        const effectiveWc = wc > 0 ? wc : MIN_WORDS;
        const isUnwritten = wc === 0;

        const existing = plotlineMap.get(scene.plotline_id);
        if (existing) {
          existing.wordCount += effectiveWc;
          existing.sceneCount += 1;
          if (isUnwritten) existing.hasUnwritten = true;
          if (!isUnwritten) existing.allUnwritten = false;
        } else {
          plotlineMap.set(scene.plotline_id, {
            wordCount: effectiveWc,
            sceneCount: 1,
            hasUnwritten: isUnwritten,
            allUnwritten: isUnwritten,
          });
        }
      }

      // Build segments in plotline sort order
      const segments: ChapterData["plotlineSegments"] = [];
      for (const pl of plotlines) {
        const entry = plotlineMap.get(pl.id);
        if (entry) {
          segments.push({ plotline: pl, ...entry });
        }
      }

      const totalWords = segments.reduce((sum, s) => sum + s.wordCount, 0);

      if (segments.length > 0) {
        data.push({ chapter, chapterIndex: i, totalWords, plotlineSegments: segments });
      }
    }

    return data;
  }, [chapters, plotlines, scenes]);

  if (chapters.length < 1 || scenes.length === 0) {
    return null;
  }

  if (chapterData.length === 0) {
    return null;
  }

  // Compute heights proportional to word count
  const maxWords = Math.max(...chapterData.map((c) => c.totalWords));
  const totalGaps = (chapterData.length - 1) * GAP;
  const availableHeight = SVG_HEIGHT - 40 - totalGaps; // 20px top/bottom padding
  const totalWords = chapterData.reduce((sum, c) => sum + c.totalWords, 0);

  // Each chapter height proportional to its share of total words, with a minimum
  const MIN_STRIPE_HEIGHT = 12;
  const rawHeights = chapterData.map((c) => (c.totalWords / totalWords) * availableHeight);
  const heights = rawHeights.map((h) => Math.max(MIN_STRIPE_HEIGHT, h));
  const heightSum = heights.reduce((a, b) => a + b, 0);
  // Normalize if we exceeded available space
  const scale = heightSum > availableHeight ? availableHeight / heightSum : 1;
  const finalHeights = heights.map((h) => h * scale);

  // Build stripe positions
  let currentY = 20;
  const stripes = chapterData.map((cd, i) => {
    const y = currentY;
    const height = finalHeights[i];
    currentY += height + GAP;
    return { ...cd, y, height };
  });

  const isHoveringSegment = hover !== null;

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      <div className="flex items-center justify-between border-b border-border/60 px-3 sm:px-5 py-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
            The Spine
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Your manuscript as a cross-section
          </p>
        </div>
      </div>

      <div className="relative flex justify-center px-1 sm:px-3 py-6">
        <svg
          viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
          className="w-full max-w-[280px] touch-none"
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Subtle spine outline */}
          <rect
            x={SPINE_X - 1}
            y={(stripes[0]?.y ?? 20) - 1}
            width={SPINE_WIDTH + 2}
            height={(stripes[stripes.length - 1]?.y ?? 0) + (stripes[stripes.length - 1]?.height ?? 0) - ((stripes[0]?.y ?? 20)) + 2}
            rx="8"
            fill="none"
            stroke="currentColor"
            className="text-border/30"
            strokeWidth="0.5"
          />

          {stripes.map((stripe) => {
            const totalSegmentGaps = (stripe.plotlineSegments.length - 1) * SEGMENT_GAP;
            const segmentAreaWidth = SPINE_WIDTH - totalSegmentGaps;
            let segX = SPINE_X;

            return (
              <g key={stripe.chapter.id}>
                {/* Chapter number label */}
                <text
                  x={LABEL_X}
                  y={stripe.y + stripe.height / 2}
                  textAnchor="end"
                  dominantBaseline="central"
                  className="fill-muted-foreground/40"
                  fontSize="9"
                  fontWeight="500"
                  style={{ cursor: "default" }}
                  onMouseEnter={() => setHoveredChapterLabel(stripe.chapter.id)}
                  onMouseLeave={() => setHoveredChapterLabel(null)}
                >
                  {stripe.chapterIndex + 1}
                </text>

                {/* Chapter title tooltip on label hover */}
                {hoveredChapterLabel === stripe.chapter.id && (
                  <g>
                    <rect
                      x={2}
                      y={stripe.y + stripe.height / 2 - 10}
                      width={Math.min(stripe.chapter.title.length * 5.5 + 12, LABEL_X - 14)}
                      height={20}
                      rx="4"
                      className="fill-popover stroke-border"
                      strokeWidth="0.5"
                    />
                    <text
                      x={8}
                      y={stripe.y + stripe.height / 2}
                      dominantBaseline="central"
                      className="fill-foreground"
                      fontSize="8"
                      fontWeight="500"
                    >
                      {stripe.chapter.title.length > 18
                        ? stripe.chapter.title.slice(0, 18) + "..."
                        : stripe.chapter.title}
                    </text>
                  </g>
                )}

                {/* Plotline segments */}
                {stripe.plotlineSegments.map((seg, segIdx) => {
                  const widthFraction = seg.wordCount / stripe.totalWords;
                  const segWidth = widthFraction * segmentAreaWidth;
                  const x = segX;
                  segX += segWidth + SEGMENT_GAP;

                  const isThisHovered =
                    hover?.chapterTitle === stripe.chapter.title &&
                    hover?.plotlineTitle === seg.plotline.title;
                  const dimmed = isHoveringSegment && !isThisHovered;

                  // Slight rx variation for organic feel
                  const rx = stripe.height > 16 ? 6 : 4;
                  const ry = segWidth > 12 ? 5 : 3;

                  return (
                    <g key={`${stripe.chapter.id}-${seg.plotline.id}`}>
                      {seg.allUnwritten ? (
                        // Dashed outline for fully unwritten segments
                        <rect
                          x={x}
                          y={stripe.y}
                          width={Math.max(segWidth, 2)}
                          height={stripe.height}
                          rx={rx}
                          ry={ry}
                          fill={seg.plotline.color}
                          fillOpacity={dimmed ? 0.03 : 0.06}
                          stroke={seg.plotline.color}
                          strokeWidth={isThisHovered ? 1.5 : 1}
                          strokeDasharray="4 2"
                          strokeOpacity={dimmed ? 0.2 : 0.5}
                          style={{ cursor: "pointer", transition: "opacity 150ms, fill-opacity 150ms" }}
                          onMouseEnter={(e) => {
                            const svgEl = e.currentTarget.closest("svg");
                            const rect = svgEl?.getBoundingClientRect();
                            if (!rect) return;
                            setHover({
                              chapterTitle: stripe.chapter.title,
                              plotlineTitle: seg.plotline.title,
                              wordCount: seg.wordCount,
                              sceneCount: seg.sceneCount,
                              x: ((x + segWidth / 2) / SVG_WIDTH) * rect.width,
                              y: (stripe.y / SVG_HEIGHT) * rect.height,
                            });
                          }}
                          onMouseLeave={() => setHover(null)}
                        />
                      ) : (
                        // Filled segment
                        <rect
                          x={x}
                          y={stripe.y}
                          width={Math.max(segWidth, 2)}
                          height={stripe.height}
                          rx={rx}
                          ry={ry}
                          fill={seg.plotline.color}
                          fillOpacity={dimmed ? 0.15 : 0.85}
                          stroke={isThisHovered ? seg.plotline.color : "none"}
                          strokeWidth={isThisHovered ? 2 : 0}
                          strokeOpacity={1}
                          style={{ cursor: "pointer", transition: "fill-opacity 150ms" }}
                          onMouseEnter={(e) => {
                            const svgEl = e.currentTarget.closest("svg");
                            const rect = svgEl?.getBoundingClientRect();
                            if (!rect) return;
                            setHover({
                              chapterTitle: stripe.chapter.title,
                              plotlineTitle: seg.plotline.title,
                              wordCount: seg.wordCount,
                              sceneCount: seg.sceneCount,
                              x: ((x + segWidth / 2) / SVG_WIDTH) * rect.width,
                              y: (stripe.y / SVG_HEIGHT) * rect.height,
                            });
                          }}
                          onMouseLeave={() => setHover(null)}
                        />
                      )}
                    </g>
                  );
                })}
              </g>
            );
          })}
        </svg>

        {/* Hover tooltip */}
        {hover && (
          <div
            className="pointer-events-none absolute z-10 max-w-[220px] rounded-lg border border-border bg-popover px-2.5 py-1.5 shadow-lg"
            style={{
              left: `${Math.max(16, Math.min(hover.x, 240))}px`,
              top: `${Math.max(0, hover.y - 8)}px`,
              transform: "translate(-50%, -100%)",
            }}
          >
            <p className="truncate text-xs font-semibold">{hover.chapterTitle}</p>
            <p className="truncate text-[10px] text-muted-foreground">
              {hover.plotlineTitle}: {hover.wordCount.toLocaleString()} words ({hover.sceneCount}{" "}
              scene{hover.sceneCount !== 1 ? "s" : ""})
            </p>
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
          <span className="h-2 w-4 rounded-sm border border-dashed border-muted-foreground/40" />
          <span className="text-[10px] text-muted-foreground">Unwritten</span>
        </div>
      </div>
    </div>
  );
}

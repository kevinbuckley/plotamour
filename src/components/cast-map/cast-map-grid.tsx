"use client";

import { useState, useMemo } from "react";
import { cn } from "@/lib/utils/cn";
import type { Character, Chapter, Plotline, Scene, SceneGoogleDoc } from "@/lib/types/database";

type SceneWithDoc = Scene & { google_doc?: SceneGoogleDoc | null };

interface PresenceEntry {
  characterId: string;
  sceneId: string;
  chapterId: string;
}

interface CastMapGridProps {
  characters: Character[];
  chapters: Chapter[];
  plotlines: Plotline[];
  scenes: SceneWithDoc[];
  presence: PresenceEntry[];
  projectId: string;
}

/** Deterministic color for character avatar from name */
function getAvatarColor(name: string): { bg: string; text: string } {
  const COLORS = [
    { bg: "#dbeafe", text: "#1d4ed8" },
    { bg: "#ede9fe", text: "#7c3aed" },
    { bg: "#fce7f3", text: "#be185d" },
    { bg: "#dcfce7", text: "#15803d" },
    { bg: "#fef3c7", text: "#b45309" },
    { bg: "#ffedd5", text: "#c2410c" },
    { bg: "#e0f2fe", text: "#0369a1" },
    { bg: "#f0fdf4", text: "#166534" },
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) | 0;
  return COLORS[Math.abs(hash) % COLORS.length];
}

export function CastMapGrid({
  characters,
  chapters,
  plotlines,
  scenes,
  presence,
  projectId,
}: CastMapGridProps) {
  const [hoveredCharacter, setHoveredCharacter] = useState<string | null>(null);
  const [hoveredChapter, setHoveredChapter] = useState<string | null>(null);

  // Build a quick lookup: Set of "characterId:chapterId" pairs
  const presenceSet = useMemo(() => {
    const set = new Set<string>();
    for (const p of presence) {
      set.add(`${p.characterId}:${p.chapterId}`);
    }
    return set;
  }, [presence]);

  // Count scenes per character per chapter (for dot size)
  const presenceCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const p of presence) {
      const key = `${p.characterId}:${p.chapterId}`;
      map.set(key, (map.get(key) ?? 0) + 1);
    }
    return map;
  }, [presence]);

  // Count total appearances per character
  const characterTotals = useMemo(() => {
    const map = new Map<string, number>();
    for (const p of presence) {
      map.set(p.characterId, (map.get(p.characterId) ?? 0) + 1);
    }
    return map;
  }, [presence]);

  // Find "gaps" - chapters where a character is absent between appearances
  const characterGaps = useMemo(() => {
    const gaps = new Set<string>();
    for (const char of characters) {
      const chapterIndices = chapters
        .map((ch, idx) => ({ idx, present: presenceSet.has(`${char.id}:${ch.id}`) }));

      let firstAppearance = -1;
      let lastAppearance = -1;
      for (let i = 0; i < chapterIndices.length; i++) {
        if (chapterIndices[i].present) {
          if (firstAppearance === -1) firstAppearance = i;
          lastAppearance = i;
        }
      }

      // Mark gaps between first and last appearance
      if (firstAppearance !== -1) {
        for (let i = firstAppearance + 1; i < lastAppearance; i++) {
          if (!chapterIndices[i].present) {
            gaps.add(`${char.id}:${chapters[i].id}`);
          }
        }
      }
    }
    return gaps;
  }, [characters, chapters, presenceSet]);

  // Characters that are never in any scene
  const orphanCharacters = useMemo(() => {
    return characters.filter((c) => !characterTotals.has(c.id));
  }, [characters, characterTotals]);

  // Sort characters: those with appearances first (by count desc), orphans at bottom
  const sortedCharacters = useMemo(() => {
    return [...characters].sort((a, b) => {
      const aTotal = characterTotals.get(a.id) ?? 0;
      const bTotal = characterTotals.get(b.id) ?? 0;
      return bTotal - aTotal;
    });
  }, [characters, characterTotals]);

  if (characters.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 mb-4">
          <svg className="h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
        <h2 className="text-lg font-semibold">No characters yet</h2>
        <p className="mt-1 max-w-xs text-sm text-muted-foreground">
          Add characters to your project, then link them to scenes to see the presence matrix.
        </p>
      </div>
    );
  }

  if (chapters.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <h2 className="text-lg font-semibold">No chapters yet</h2>
        <p className="mt-1 max-w-xs text-sm text-muted-foreground">
          Add chapters to your timeline to see the cast map.
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6">
      {/* Summary stats */}
      <div className="mb-6 flex flex-wrap items-center gap-4">
        <div className="rounded-lg border border-border bg-card px-4 py-2.5 shadow-sm">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">Characters</p>
          <p className="mt-0.5 text-xl font-bold tabular-nums">{characters.length}</p>
        </div>
        <div className="rounded-lg border border-border bg-card px-4 py-2.5 shadow-sm">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">Chapters</p>
          <p className="mt-0.5 text-xl font-bold tabular-nums">{chapters.length}</p>
        </div>
        <div className="rounded-lg border border-border bg-card px-4 py-2.5 shadow-sm">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">Appearances</p>
          <p className="mt-0.5 text-xl font-bold tabular-nums">{presence.length}</p>
        </div>
        {orphanCharacters.length > 0 && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 shadow-sm">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-amber-600/70">Unused Characters</p>
            <p className="mt-0.5 text-xl font-bold tabular-nums text-amber-700">{orphanCharacters.length}</p>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="mb-4 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded-full bg-primary" />
          <span>Present</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded-full border-2 border-dashed border-amber-400" />
          <span>Gap (absent between appearances)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded-full bg-muted" />
          <span>Not present</span>
        </div>
      </div>

      {/* Matrix grid */}
      <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
        <div className="min-w-max">
          <div
            className="grid"
            style={{
              gridTemplateColumns: `200px repeat(${chapters.length}, 56px) 64px`,
            }}
          >
            {/* Header row: empty + chapter names */}
            <div className="sticky left-0 z-10 bg-card border-b border-r border-border p-2" />
            {chapters.map((chapter, idx) => (
              <div
                key={chapter.id}
                className={cn(
                  "border-b border-border p-1.5 text-center",
                  hoveredChapter === chapter.id && "bg-primary/5"
                )}
                onMouseEnter={() => setHoveredChapter(chapter.id)}
                onMouseLeave={() => setHoveredChapter(null)}
              >
                <span className="flex h-6 w-6 mx-auto items-center justify-center rounded-full bg-primary/12 text-[10px] font-bold text-primary">
                  {idx + 1}
                </span>
                <p className="mt-1 text-[10px] text-muted-foreground/70 truncate max-w-[52px]" title={chapter.title}>
                  {chapter.title}
                </p>
              </div>
            ))}
            {/* Total column header */}
            <div className="border-b border-l border-border p-2 text-center">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">Total</p>
            </div>

            {/* Character rows */}
            {sortedCharacters.map((character) => {
              const avatarColor = getAvatarColor(character.name);
              const total = characterTotals.get(character.id) ?? 0;
              const isOrphan = total === 0;

              return (
                <div key={character.id} className="contents">
                  {/* Character name cell */}
                  <div
                    className={cn(
                      "sticky left-0 z-10 bg-card flex items-center gap-2.5 border-b border-r border-border/60 px-3 py-2",
                      hoveredCharacter === character.id && "bg-primary/5",
                      isOrphan && "opacity-50"
                    )}
                    onMouseEnter={() => setHoveredCharacter(character.id)}
                    onMouseLeave={() => setHoveredCharacter(null)}
                  >
                    <div
                      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold"
                      style={{ backgroundColor: avatarColor.bg, color: avatarColor.text }}
                    >
                      {character.name.charAt(0).toUpperCase()}
                    </div>
                    <span className={cn("text-sm truncate max-w-[140px]", isOrphan ? "text-muted-foreground italic" : "font-medium")}>
                      {character.name}
                    </span>
                  </div>

                  {/* Presence dots */}
                  {chapters.map((chapter) => {
                    const key = `${character.id}:${chapter.id}`;
                    const isPresent = presenceSet.has(key);
                    const count = presenceCounts.get(key) ?? 0;
                    const isGap = characterGaps.has(key);
                    const isHighlighted = hoveredCharacter === character.id || hoveredChapter === chapter.id;

                    return (
                      <div
                        key={key}
                        className={cn(
                          "flex items-center justify-center border-b border-border/40 p-1",
                          isHighlighted && "bg-primary/5"
                        )}
                        onMouseEnter={() => {
                          setHoveredCharacter(character.id);
                          setHoveredChapter(chapter.id);
                        }}
                        onMouseLeave={() => {
                          setHoveredCharacter(null);
                          setHoveredChapter(null);
                        }}
                        title={
                          isPresent
                            ? `${character.name} in ${chapter.title} (${count} scene${count !== 1 ? "s" : ""})`
                            : isGap
                            ? `${character.name} absent from ${chapter.title}`
                            : undefined
                        }
                      >
                        {isPresent ? (
                          <div
                            className={cn(
                              "rounded-full bg-primary transition-transform",
                              count >= 3 ? "h-4 w-4" : count >= 2 ? "h-3.5 w-3.5" : "h-2.5 w-2.5",
                              isHighlighted && "scale-125"
                            )}
                          />
                        ) : isGap ? (
                          <div className="h-2.5 w-2.5 rounded-full border-2 border-dashed border-amber-400" />
                        ) : null}
                      </div>
                    );
                  })}

                  {/* Total count */}
                  <div className={cn(
                    "flex items-center justify-center border-b border-l border-border/60",
                    isOrphan && "opacity-50"
                  )}>
                    <span className={cn(
                      "text-xs tabular-nums",
                      total > 0 ? "font-semibold text-foreground" : "text-muted-foreground/40"
                    )}>
                      {total}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

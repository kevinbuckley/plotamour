"use client";

import { useCallback, useEffect, useState } from "react";

export interface RecentScene {
  sceneId: string;
  sceneTitle: string;
  chapterTitle: string;
  plotlineTitle: string;
  plotlineColor: string;
  projectId: string;
  bookId: string;
  timestamp: number; // Date.now()
  wordCount: number;
}

const STORAGE_KEY = "plotamour:recent-scenes";
const MAX_RECENT = 5;

function getStoredScenes(): RecentScene[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function storeScenes(scenes: RecentScene[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(scenes));
  } catch {
    // localStorage full or unavailable
  }
}

export function useRecentScenes(projectId?: string) {
  const [recentScenes, setRecentScenes] = useState<RecentScene[]>([]);

  useEffect(() => {
    const all = getStoredScenes();
    const filtered = projectId
      ? all.filter((s) => s.projectId === projectId)
      : all;
    setRecentScenes(filtered);
  }, [projectId]);

  const trackScene = useCallback(
    (scene: Omit<RecentScene, "timestamp">) => {
      const all = getStoredScenes();
      // Remove existing entry for same scene
      const filtered = all.filter((s) => s.sceneId !== scene.sceneId);
      const updated = [{ ...scene, timestamp: Date.now() }, ...filtered].slice(
        0,
        MAX_RECENT * 3
      ); // Keep more across all projects
      storeScenes(updated);
      if (projectId) {
        setRecentScenes(updated.filter((s) => s.projectId === projectId));
      } else {
        setRecentScenes(updated);
      }
    },
    [projectId]
  );

  const getLastScene = useCallback(
    (forProjectId?: string): RecentScene | null => {
      const pid = forProjectId ?? projectId;
      const all = getStoredScenes();
      const forProject = pid ? all.filter((s) => s.projectId === pid) : all;
      return forProject[0] ?? null;
    },
    [projectId]
  );

  return { recentScenes, trackScene, getLastScene };
}

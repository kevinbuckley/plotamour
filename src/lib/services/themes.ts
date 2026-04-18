// Layer 3: Services — themes / motif tracker

import { createClient } from "@/lib/db/server";
import type { Theme } from "@/lib/types/database";

export interface ThemeWithCount extends Theme {
  scene_count: number;
}

export async function getThemes(projectId: string): Promise<Theme[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("themes")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);
  return data as Theme[];
}

export async function getThemesWithCounts(
  projectId: string
): Promise<ThemeWithCount[]> {
  const supabase = await createClient();
  const { data: themes, error } = await supabase
    .from("themes")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);
  if (!themes || themes.length === 0) return [];

  const themeIds = themes.map((t) => t.id);
  const { data: links } = await supabase
    .from("scene_themes")
    .select("theme_id")
    .in("theme_id", themeIds);

  const countMap = new Map<string, number>();
  for (const link of links ?? []) {
    countMap.set(link.theme_id, (countMap.get(link.theme_id) ?? 0) + 1);
  }

  return themes.map((t) => ({
    ...(t as Theme),
    scene_count: countMap.get(t.id) ?? 0,
  }));
}

export async function createTheme(
  projectId: string,
  name: string,
  color: string,
  description = ""
): Promise<Theme> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("themes")
    .insert({ project_id: projectId, name, color, description })
    .select("*")
    .single();

  if (error || !data) throw new Error(error?.message ?? "Failed to create theme");
  return data as Theme;
}

export async function updateTheme(
  id: string,
  data: Partial<Pick<Theme, "name" | "color" | "description">>
): Promise<Theme> {
  const supabase = await createClient();
  const { data: updated, error } = await supabase
    .from("themes")
    .update(data)
    .eq("id", id)
    .select("*")
    .single();

  if (error || !updated) throw new Error(error?.message ?? "Failed to update theme");
  return updated as Theme;
}

export async function deleteTheme(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("themes").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function getSceneThemeIds(sceneId: string): Promise<string[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("scene_themes")
    .select("theme_id")
    .eq("scene_id", sceneId);
  return (data ?? []).map((r) => r.theme_id);
}

export async function addThemeToScene(
  sceneId: string,
  themeId: string
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("scene_themes")
    .insert({ scene_id: sceneId, theme_id: themeId });
  if (error && error.code !== "23505") throw new Error(error.message);
}

export async function removeThemeFromScene(
  sceneId: string,
  themeId: string
): Promise<void> {
  const supabase = await createClient();
  await supabase
    .from("scene_themes")
    .delete()
    .eq("scene_id", sceneId)
    .eq("theme_id", themeId);
}

export interface SceneForTheme {
  sceneId: string;
  sceneTitle: string;
  chapterTitle: string;
  plotlineTitle: string;
  plotlineColor: string;
}

/**
 * Get all scenes tagged with a given theme, enriched with chapter/plotline info.
 */
export async function getThemeScenes(
  themeId: string
): Promise<SceneForTheme[]> {
  const supabase = await createClient();

  const { data: links } = await supabase
    .from("scene_themes")
    .select("scene_id")
    .eq("theme_id", themeId);

  if (!links || links.length === 0) return [];

  const sceneIds = links.map((l) => l.scene_id);

  const { data: scenes } = await supabase
    .from("scenes")
    .select("id, title, chapter_id, plotline_id")
    .in("id", sceneIds)
    .is("deleted_at", null);

  if (!scenes || scenes.length === 0) return [];

  const chapterIds = [...new Set(scenes.map((s) => s.chapter_id))];
  const plotlineIds = [...new Set(scenes.map((s) => s.plotline_id))];

  const [chaptersRes, plotlinesRes] = await Promise.all([
    supabase
      .from("chapters")
      .select("id, title, sort_order")
      .in("id", chapterIds),
    supabase
      .from("plotlines")
      .select("id, title, color")
      .in("id", plotlineIds),
  ]);

  const chapters = chaptersRes.data ?? [];
  const plotlines = plotlinesRes.data ?? [];

  return scenes.map((s) => {
    const chapter = chapters.find((c) => c.id === s.chapter_id);
    const plotline = plotlines.find((p) => p.id === s.plotline_id);
    return {
      sceneId: s.id,
      sceneTitle: s.title,
      chapterTitle: chapter?.title ?? "Unknown",
      plotlineTitle: plotline?.title ?? "Unknown",
      plotlineColor: plotline?.color ?? "#6366f1",
    };
  });
}

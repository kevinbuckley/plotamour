// Layer 3: Services — project sharing (read-only share links)

import { createClient } from "@/lib/db/server";
import type { ProjectShare } from "@/lib/types/database";

export async function getShare(projectId: string): Promise<ProjectShare | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("project_shares")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data as ProjectShare | null;
}

export async function createShare(
  projectId: string,
  label = ""
): Promise<ProjectShare> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("project_shares")
    .insert({ project_id: projectId, label, user_id: user.id })
    .select("*")
    .single();
  if (error || !data) throw new Error(error?.message ?? "Failed to create share");
  return data as ProjectShare;
}

export async function deleteShare(shareId: string): Promise<void> {
  const supabase = await createClient();
  await supabase.from("project_shares").delete().eq("id", shareId);
}

/**
 * Validate a share token and return the project_id.
 * Uses the anon key — public RLS policies (migration 00007) allow reading
 * project_shares without auth so no service role key is needed.
 */
export async function resolveShareToken(
  token: string
): Promise<{ projectId: string; label: string } | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("project_shares")
    .select("project_id, label, expires_at")
    .eq("share_token", token)
    .maybeSingle();

  if (!data) return null;
  if (data.expires_at && new Date(data.expires_at) < new Date()) return null;

  return { projectId: data.project_id, label: data.label };
}

/**
 * Fetch the full export data for a shared project.
 * Uses the anon key — public RLS policies (migration 00007) allow reading
 * projects/scenes/characters/places when a valid share exists.
 */
export async function getSharedProjectData(projectId: string) {
  const supabase = await createClient();

  // Get project info
  const { data: project } = await supabase
    .from("projects")
    .select("id, title, project_type")
    .eq("id", projectId)
    .single();

  if (!project) return null;

  // Get first book (standalone) or all books (series)
  const { data: books } = await supabase
    .from("books")
    .select("*")
    .eq("project_id", projectId)
    .is("deleted_at", null)
    .order("sort_order", { ascending: true });

  if (!books || books.length === 0) return null;

  const bookId = books[0].id;

  const [chaptersRes, plotlinesRes, scenesRes, charsRes, placesRes] =
    await Promise.all([
      supabase
        .from("chapters")
        .select("*")
        .eq("book_id", bookId)
        .order("sort_order", { ascending: true }),
      supabase
        .from("plotlines")
        .select("*")
        .eq("book_id", bookId)
        .order("sort_order", { ascending: true }),
      supabase
        .from("scenes")
        .select("*")
        .eq("book_id", bookId)
        .is("deleted_at", null)
        .is("archived_at", null)
        .order("position", { ascending: true }),
      supabase
        .from("characters")
        .select("id, name, description")
        .eq("project_id", projectId)
        .is("deleted_at", null)
        .order("sort_order", { ascending: true }),
      supabase
        .from("places")
        .select("id, name, description")
        .eq("project_id", projectId)
        .is("deleted_at", null)
        .order("sort_order", { ascending: true }),
    ]);

  const chapters = chaptersRes.data ?? [];
  const plotlines = plotlinesRes.data ?? [];
  const scenes = scenesRes.data ?? [];
  const characters = charsRes.data ?? [];
  const places = placesRes.data ?? [];

  // Fetch scene-character and scene-place links
  const sceneIds = scenes.map((s) => s.id);
  const [sceneCharsRes, scenePlacesRes] = await Promise.all([
    sceneIds.length > 0
      ? supabase
          .from("scene_characters")
          .select("scene_id, character_id")
          .in("scene_id", sceneIds)
      : Promise.resolve({ data: [] }),
    sceneIds.length > 0
      ? supabase
          .from("scene_places")
          .select("scene_id, place_id")
          .in("scene_id", sceneIds)
      : Promise.resolve({ data: [] }),
  ]);

  const sceneCharMap = new Map<string, string[]>();
  for (const link of sceneCharsRes.data ?? []) {
    const list = sceneCharMap.get(link.scene_id) ?? [];
    const char = characters.find((c) => c.id === link.character_id);
    if (char) list.push(char.name);
    sceneCharMap.set(link.scene_id, list);
  }

  const scenePlaceMap = new Map<string, string[]>();
  for (const link of scenePlacesRes.data ?? []) {
    const list = scenePlaceMap.get(link.scene_id) ?? [];
    const place = places.find((p) => p.id === link.place_id);
    if (place) list.push(place.name);
    scenePlaceMap.set(link.scene_id, list);
  }

  const enrichedChapters = chapters.map((ch) => {
    const chapterScenes = scenes
      .filter((s) => s.chapter_id === ch.id)
      .map((s) => {
        const plotline = plotlines.find((p) => p.id === s.plotline_id);
        return {
          ...s,
          plotlineTitle: plotline?.title ?? "Unknown",
          plotlineColor: plotline?.color ?? "#6366f1",
          characters: sceneCharMap.get(s.id) ?? [],
          places: scenePlaceMap.get(s.id) ?? [],
        };
      });
    return { ...ch, scenes: chapterScenes };
  });

  return {
    projectTitle: project.title,
    bookTitle: books[0].title,
    chapters: enrichedChapters,
    plotlines,
    characters,
    places,
    books,
  };
}

// Layer 3: Services — project sharing (read-only share links)

import { randomBytes } from "crypto";
import { createClient } from "@/lib/db/server";
import { serviceSql } from "@/lib/db/service";
import type { ProjectShare } from "@/lib/types/database";

/** Generates a URL-safe base64 token (~24 chars, no +/= chars). */
function generateShareToken(): string {
  return randomBytes(18).toString("base64url");
}

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
    .insert({
      project_id: projectId,
      label,
      user_id: user.id,
      share_token: generateShareToken(),
    })
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
 * Uses the owner SQL connection — the Neon Data API requires a JWT on every
 * request (no anonymous role), so public share reads are served by the server
 * with the secret token as the access check (same as the original pre-00007
 * design noted in migration 00006).
 */
export async function resolveShareToken(
  token: string
): Promise<{ projectId: string; label: string } | null> {
  const sql = serviceSql();
  const rows = (await sql`
    SELECT project_id, label, expires_at
    FROM project_shares
    WHERE share_token = ${token}
    LIMIT 1
  `) as { project_id: string; label: string; expires_at: string | null }[];

  const data = rows[0];
  if (!data) return null;
  if (data.expires_at && new Date(data.expires_at) < new Date()) return null;

  return { projectId: data.project_id, label: data.label };
}

/**
 * Fetch the full export data for a shared project.
 * Owner SQL connection — only ever called with a projectId resolved from a
 * valid share token (see resolveShareToken), so bypassing RLS here is safe.
 */
export async function getSharedProjectData(projectId: string) {
  const sql = serviceSql();

  // Get project info
  const projects = (await sql`
    SELECT id, title, project_type FROM projects
    WHERE id = ${projectId} AND deleted_at IS NULL
    LIMIT 1
  `) as { id: string; title: string; project_type: string }[];
  const project = projects[0];
  if (!project) return null;

  // Get first book (standalone) or all books (series)
  const books = (await sql`
    SELECT * FROM books
    WHERE project_id = ${projectId} AND deleted_at IS NULL
    ORDER BY sort_order ASC
  `) as { id: string; title: string; [k: string]: unknown }[];

  if (!books || books.length === 0) return null;

  const bookId = books[0].id;

  const [chapters, plotlines, scenes, characters, places] = (await Promise.all([
    sql`SELECT * FROM chapters WHERE book_id = ${bookId} ORDER BY sort_order ASC`,
    sql`SELECT * FROM plotlines WHERE book_id = ${bookId} ORDER BY sort_order ASC`,
    sql`SELECT * FROM scenes
        WHERE book_id = ${bookId} AND deleted_at IS NULL AND archived_at IS NULL
        ORDER BY position ASC`,
    sql`SELECT id, name, description FROM characters
        WHERE project_id = ${projectId} AND deleted_at IS NULL
        ORDER BY sort_order ASC`,
    sql`SELECT id, name, description FROM places
        WHERE project_id = ${projectId} AND deleted_at IS NULL
        ORDER BY sort_order ASC`,
  ])) as [
    { id: string; title: string; description?: string; [k: string]: unknown }[],
    { id: string; title: string; color: string; [k: string]: unknown }[],
    {
      id: string;
      title: string;
      summary?: string;
      conflict?: string;
      chapter_id: string;
      plotline_id: string;
      [k: string]: unknown;
    }[],
    { id: string; name: string; description: string }[],
    { id: string; name: string; description: string }[],
  ];

  // Fetch scene-character and scene-place links
  const sceneIds = scenes.map((s) => s.id);
  const [sceneChars, scenePlaces] = sceneIds.length
    ? ((await Promise.all([
        sql`SELECT scene_id, character_id FROM scene_characters WHERE scene_id = ANY(${sceneIds})`,
        sql`SELECT scene_id, place_id FROM scene_places WHERE scene_id = ANY(${sceneIds})`,
      ])) as [
        { scene_id: string; character_id: string }[],
        { scene_id: string; place_id: string }[],
      ])
    : [[], []];

  const sceneCharMap = new Map<string, string[]>();
  for (const link of sceneChars) {
    const list = sceneCharMap.get(link.scene_id) ?? [];
    const char = characters.find((c) => c.id === link.character_id);
    if (char) list.push(char.name);
    sceneCharMap.set(link.scene_id, list);
  }

  const scenePlaceMap = new Map<string, string[]>();
  for (const link of scenePlaces) {
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

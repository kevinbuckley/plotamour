// Layer 3: Services — timeline data (chapters, plotlines, scenes for a book)

import { createClient } from "@/lib/db/server";
import type { Chapter, Plotline, Scene, SceneGoogleDoc } from "@/lib/types/database";

export interface TimelineData {
  chapters: Chapter[];
  plotlines: Plotline[];
  scenes: (Scene & { google_doc?: SceneGoogleDoc | null })[];
}

export async function getTimelineData(bookId: string): Promise<TimelineData> {
  const supabase = await createClient();

  const [chaptersRes, plotlinesRes, scenesRes] = await Promise.all([
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
      .select("*, scene_google_docs(*)")
      .eq("book_id", bookId)
      .is("deleted_at", null)
      .order("position", { ascending: true }),
  ]);

  if (chaptersRes.error) throw chaptersRes.error;
  if (plotlinesRes.error) throw plotlinesRes.error;
  if (scenesRes.error) throw scenesRes.error;

  const scenes = (scenesRes.data ?? []).map((s) => ({
    ...s,
    google_doc: Array.isArray(s.scene_google_docs)
      ? s.scene_google_docs[0] ?? null
      : s.scene_google_docs ?? null,
  }));

  return {
    chapters: chaptersRes.data ?? [],
    plotlines: plotlinesRes.data ?? [],
    scenes,
  };
}

export async function addChapter(bookId: string, title: string): Promise<Chapter> {
  const supabase = await createClient();

  // Get the max sort_order
  const { data: existing } = await supabase
    .from("chapters")
    .select("sort_order")
    .eq("book_id", bookId)
    .order("sort_order", { ascending: false })
    .limit(1);

  const nextOrder = (existing?.[0]?.sort_order ?? -1) + 1;

  const { data, error } = await supabase
    .from("chapters")
    .insert({ book_id: bookId, title, sort_order: nextOrder })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateChapter(
  id: string,
  input: { title?: string; sort_order?: number }
): Promise<Chapter> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("chapters")
    .update(input)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteChapter(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("chapters").delete().eq("id", id);
  if (error) throw error;
}

export async function addPlotline(
  bookId: string,
  title: string,
  color: string
): Promise<Plotline> {
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("plotlines")
    .select("sort_order")
    .eq("book_id", bookId)
    .order("sort_order", { ascending: false })
    .limit(1);

  const nextOrder = (existing?.[0]?.sort_order ?? -1) + 1;

  const { data, error } = await supabase
    .from("plotlines")
    .insert({ book_id: bookId, title, color, sort_order: nextOrder })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updatePlotline(
  id: string,
  input: { title?: string; color?: string; sort_order?: number }
): Promise<Plotline> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("plotlines")
    .update(input)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deletePlotline(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("plotlines").delete().eq("id", id);
  if (error) throw error;
}

export async function reorderChapters(
  bookId: string,
  chapterIds: string[]
): Promise<void> {
  const supabase = await createClient();
  const updates = chapterIds.map((id, i) =>
    supabase.from("chapters").update({ sort_order: i }).eq("id", id).eq("book_id", bookId)
  );
  await Promise.all(updates);
}

export async function reorderPlotlines(
  bookId: string,
  plotlineIds: string[]
): Promise<void> {
  const supabase = await createClient();
  const updates = plotlineIds.map((id, i) =>
    supabase.from("plotlines").update({ sort_order: i }).eq("id", id).eq("book_id", bookId)
  );
  await Promise.all(updates);
}

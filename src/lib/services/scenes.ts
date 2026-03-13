// Layer 3: Services — scene CRUD

import { createClient } from "@/lib/db/server";
import type { Scene } from "@/lib/types/database";

export async function createScene(input: {
  bookId: string;
  chapterId: string;
  plotlineId: string;
  title?: string;
}): Promise<Scene> {
  const supabase = await createClient();

  // Get the max position in this cell
  const { data: existing } = await supabase
    .from("scenes")
    .select("position")
    .eq("chapter_id", input.chapterId)
    .eq("plotline_id", input.plotlineId)
    .is("deleted_at", null)
    .order("position", { ascending: false })
    .limit(1);

  const nextPosition = (existing?.[0]?.position ?? -1) + 1;

  const { data, error } = await supabase
    .from("scenes")
    .insert({
      book_id: input.bookId,
      chapter_id: input.chapterId,
      plotline_id: input.plotlineId,
      title: input.title ?? "New Scene",
      position: nextPosition,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getScene(id: string): Promise<Scene | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("scenes")
    .select("*")
    .eq("id", id)
    .is("deleted_at", null)
    .single();

  if (error) return null;
  return data;
}

export async function updateScene(
  id: string,
  input: {
    title?: string;
    summary?: string;
    conflict?: string;
    pov_character_id?: string | null;
    chapter_id?: string;
    plotline_id?: string;
    position?: number;
  }
): Promise<Scene> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("scenes")
    .update(input)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteScene(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("scenes")
    .delete()
    .eq("id", id);

  if (error) throw error;
}

export async function moveScene(
  sceneId: string,
  newChapterId: string,
  newPlotlineId: string,
  newPosition: number
): Promise<void> {
  const supabase = await createClient();

  // Validate that the target chapter and plotline belong to the same book as the scene
  const { data: scene } = await supabase
    .from("scenes")
    .select("book_id")
    .eq("id", sceneId)
    .single();

  if (!scene) throw new Error("Scene not found");

  const [chapterRes, plotlineRes] = await Promise.all([
    supabase.from("chapters").select("book_id").eq("id", newChapterId).single(),
    supabase.from("plotlines").select("book_id").eq("id", newPlotlineId).single(),
  ]);

  if (!chapterRes.data || chapterRes.data.book_id !== scene.book_id) {
    throw new Error("Target chapter does not belong to the same book");
  }
  if (!plotlineRes.data || plotlineRes.data.book_id !== scene.book_id) {
    throw new Error("Target plotline does not belong to the same book");
  }

  const { error } = await supabase
    .from("scenes")
    .update({
      chapter_id: newChapterId,
      plotline_id: newPlotlineId,
      position: newPosition,
    })
    .eq("id", sceneId);

  if (error) throw error;
}

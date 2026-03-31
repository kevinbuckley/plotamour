// Layer 3: Services — story promises (Chekhov's Wall)

import { createClient } from "@/lib/db/server";
import type { StoryPromise } from "@/lib/types/database";

export async function getPromisesForBook(bookId: string): Promise<StoryPromise[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("story_promises")
    .select("*")
    .eq("book_id", bookId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function getPromisesForScene(sceneId: string): Promise<StoryPromise[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("story_promises")
    .select("*")
    .or(`plant_scene_id.eq.${sceneId},payoff_scene_id.eq.${sceneId}`)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function createPromise(input: {
  bookId: string;
  description: string;
  plantSceneId: string;
}): Promise<StoryPromise> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("story_promises")
    .insert({
      book_id: input.bookId,
      description: input.description,
      plant_scene_id: input.plantSceneId,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updatePromise(
  id: string,
  input: { description?: string; payoff_scene_id?: string | null; resolved?: boolean }
): Promise<StoryPromise> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("story_promises")
    .update(input)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deletePromise(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("story_promises").delete().eq("id", id);
  if (error) throw error;
}

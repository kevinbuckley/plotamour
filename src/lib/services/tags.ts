// Layer 3: Services — tag CRUD and entity linking

import { createClient } from "@/lib/db/server";
import type { Tag } from "@/lib/types/database";

export async function getTags(projectId: string): Promise<Tag[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tags")
    .select("*")
    .eq("project_id", projectId)
    .order("category", { ascending: true })
    .order("name", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function createTag(input: {
  projectId: string;
  name: string;
  color?: string;
  category?: string;
}): Promise<Tag> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tags")
    .insert({
      project_id: input.projectId,
      name: input.name,
      color: input.color ?? "#6366f1",
      category: input.category ?? "",
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateTag(
  id: string,
  input: { name?: string; color?: string; category?: string }
): Promise<Tag> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tags")
    .update(input)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteTag(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("tags").delete().eq("id", id);
  if (error) throw error;
}

// Scene tags
export async function getSceneTagIds(sceneId: string): Promise<string[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("scene_tags")
    .select("tag_id")
    .eq("scene_id", sceneId);

  if (error) throw error;
  return (data ?? []).map((r) => r.tag_id);
}

export async function addTagToScene(sceneId: string, tagId: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("scene_tags")
    .upsert({ scene_id: sceneId, tag_id: tagId });

  if (error) throw error;
}

export async function removeTagFromScene(sceneId: string, tagId: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("scene_tags")
    .delete()
    .eq("scene_id", sceneId)
    .eq("tag_id", tagId);

  if (error) throw error;
}

// Character tags
export async function getCharacterTagIds(characterId: string): Promise<string[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("character_tags")
    .select("tag_id")
    .eq("character_id", characterId);

  if (error) throw error;
  return (data ?? []).map((r) => r.tag_id);
}

export async function addTagToCharacter(characterId: string, tagId: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("character_tags")
    .upsert({ character_id: characterId, tag_id: tagId });

  if (error) throw error;
}

export async function removeTagFromCharacter(characterId: string, tagId: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("character_tags")
    .delete()
    .eq("character_id", characterId)
    .eq("tag_id", tagId);

  if (error) throw error;
}

// Place tags
export async function getPlaceTagIds(placeId: string): Promise<string[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("place_tags")
    .select("tag_id")
    .eq("place_id", placeId);

  if (error) throw error;
  return (data ?? []).map((r) => r.tag_id);
}

export async function addTagToPlace(placeId: string, tagId: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("place_tags")
    .upsert({ place_id: placeId, tag_id: tagId });

  if (error) throw error;
}

export async function removeTagFromPlace(placeId: string, tagId: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("place_tags")
    .delete()
    .eq("place_id", placeId)
    .eq("tag_id", tagId);

  if (error) throw error;
}

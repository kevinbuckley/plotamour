// Layer 3: Services — character CRUD and scene linking

import { createClient } from "@/lib/db/server";
import type { Character } from "@/lib/types/database";

export async function getCharacters(projectId: string): Promise<Character[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("characters")
    .select("*")
    .eq("project_id", projectId)
    .is("deleted_at", null)
    .order("sort_order", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function getCharacter(id: string): Promise<Character | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("characters")
    .select("*")
    .eq("id", id)
    .is("deleted_at", null)
    .single();

  if (error) return null;
  return data;
}

export async function createCharacter(input: {
  projectId: string;
  name: string;
  description?: string;
}): Promise<Character> {
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("characters")
    .select("sort_order")
    .eq("project_id", input.projectId)
    .is("deleted_at", null)
    .order("sort_order", { ascending: false })
    .limit(1);

  const nextOrder = (existing?.[0]?.sort_order ?? -1) + 1;

  const { data, error } = await supabase
    .from("characters")
    .insert({
      project_id: input.projectId,
      name: input.name,
      description: input.description ?? "",
      sort_order: nextOrder,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateCharacter(
  id: string,
  input: {
    name?: string;
    description?: string;
    avatar_url?: string | null;
    custom_attributes?: Record<string, unknown>;
  }
): Promise<Character> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("characters")
    .update(input)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteCharacter(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("characters")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);

  if (error) throw error;
}

export async function getCharacterSceneIds(characterId: string): Promise<string[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("scene_characters")
    .select("scene_id")
    .eq("character_id", characterId);

  if (error) throw error;
  return (data ?? []).map((r) => r.scene_id);
}

export async function getSceneCharacterIds(sceneId: string): Promise<string[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("scene_characters")
    .select("character_id")
    .eq("scene_id", sceneId);

  if (error) throw error;
  return (data ?? []).map((r) => r.character_id);
}

export async function linkCharacterToScene(
  sceneId: string,
  characterId: string
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("scene_characters")
    .upsert({ scene_id: sceneId, character_id: characterId });

  if (error) throw error;
}

export async function unlinkCharacterFromScene(
  sceneId: string,
  characterId: string
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("scene_characters")
    .delete()
    .eq("scene_id", sceneId)
    .eq("character_id", characterId);

  if (error) throw error;
}

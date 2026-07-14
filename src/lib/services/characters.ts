// Layer 3: Services — character CRUD and scene linking

import { createClient } from "@/lib/db/server";
import type { Character, CharacterRelation } from "@/lib/types/database";

export interface SceneMention {
  sceneId: string;
  sceneTitle: string;
  chapterId: string;
  chapterTitle: string;
  chapterOrder: number;
}

export async function getCharacters(projectId: string): Promise<Character[]> {
  const db = await createClient();
  const { data, error } = await db
    .from("characters")
    .select("*")
    .eq("project_id", projectId)
    .is("deleted_at", null)
    .order("sort_order", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function getCharacter(id: string): Promise<Character | null> {
  const db = await createClient();
  const { data, error } = await db
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
  const db = await createClient();

  const { data: existing } = await db
    .from("characters")
    .select("sort_order")
    .eq("project_id", input.projectId)
    .is("deleted_at", null)
    .order("sort_order", { ascending: false })
    .limit(1);

  const nextOrder = (existing?.[0]?.sort_order ?? -1) + 1;

  const { data, error } = await db
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
    aliases?: string[];
    custom_attributes?: Record<string, unknown>;
  }
): Promise<Character> {
  const db = await createClient();
  const { data, error } = await db
    .from("characters")
    .update(input)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteCharacter(id: string): Promise<void> {
  const db = await createClient();
  const { error } = await db
    .from("characters")
    .delete()
    .eq("id", id);

  if (error) throw error;
}

export async function getCharacterSceneIds(characterId: string): Promise<string[]> {
  const db = await createClient();
  const { data, error } = await db
    .from("scene_characters")
    .select("scene_id")
    .eq("character_id", characterId);

  if (error) throw error;
  return (data ?? []).map((r) => r.scene_id);
}

export async function getSceneCharacterIds(sceneId: string): Promise<string[]> {
  const db = await createClient();
  const { data, error } = await db
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
  const db = await createClient();
  const { error } = await db
    .from("scene_characters")
    .upsert({ scene_id: sceneId, character_id: characterId });

  if (error) throw error;
}

export async function unlinkCharacterFromScene(
  sceneId: string,
  characterId: string
): Promise<void> {
  const db = await createClient();
  const { error } = await db
    .from("scene_characters")
    .delete()
    .eq("scene_id", sceneId)
    .eq("character_id", characterId);

  if (error) throw error;
}

export async function getCharacterPresenceMatrix(bookId: string, projectId: string): Promise<{
  characterId: string;
  sceneId: string;
  chapterId: string;
}[]> {
  const db = await createClient();

  // Get all scene_characters for scenes in this book, joined with scene data
  const { data, error } = await db
    .from("scene_characters")
    .select("character_id, scene_id, scenes!inner(chapter_id, book_id)")
    .eq("scenes.book_id", bookId);

  if (error) throw error;

  type PresenceRow = { character_id: string; scene_id: string; scenes: { chapter_id: string; book_id: string } | { chapter_id: string; book_id: string }[] };
  return (data as unknown as PresenceRow[] ?? []).map((row) => {
    const scenes = Array.isArray(row.scenes) ? row.scenes[0] : row.scenes;
    return {
      characterId: row.character_id,
      sceneId: row.scene_id,
      chapterId: scenes.chapter_id,
    };
  });
}

export async function getCharacterScenesDetailed(characterId: string): Promise<SceneMention[]> {
  const db = await createClient();

  const { data, error } = await db
    .from("scene_characters")
    .select("scene_id, scenes!inner(id, title, deleted_at, archived_at, chapter_id, chapters!inner(id, title, sort_order))")
    .eq("character_id", characterId)
    .is("scenes.deleted_at", null)
    .is("scenes.archived_at", null);

  if (error) throw error;

  type Row = {
    scene_id: string;
    scenes: {
      id: string;
      title: string;
      chapter_id: string;
      chapters: { id: string; title: string; sort_order: number };
    };
  };

  return ((data as unknown as Row[]) ?? []).map((row) => ({
    sceneId: row.scenes.id,
    sceneTitle: row.scenes.title,
    chapterId: row.scenes.chapter_id,
    chapterTitle: row.scenes.chapters.title,
    chapterOrder: row.scenes.chapters.sort_order,
  })).sort((a, b) => a.chapterOrder - b.chapterOrder);
}

// ─── Character Relations ────────────────────────────────────────────────────

export async function getCharacterRelations(characterId: string): Promise<CharacterRelation[]> {
  const db = await createClient();
  const { data, error } = await db
    .from("character_relations")
    .select("*")
    .or(`from_character_id.eq.${characterId},to_character_id.eq.${characterId}`)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function addCharacterRelation(input: {
  fromCharacterId: string;
  toCharacterId: string;
  relationType: string;
  description?: string;
}): Promise<CharacterRelation> {
  const db = await createClient();
  const { data, error } = await db
    .from("character_relations")
    .insert({
      from_character_id: input.fromCharacterId,
      to_character_id: input.toCharacterId,
      relation_type: input.relationType,
      description: input.description ?? "",
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateCharacterRelation(
  id: string,
  input: { relation_type?: string; description?: string }
): Promise<CharacterRelation> {
  const db = await createClient();
  const { data, error } = await db
    .from("character_relations")
    .update(input)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteCharacterRelation(id: string): Promise<void> {
  const db = await createClient();
  const { error } = await db
    .from("character_relations")
    .delete()
    .eq("id", id);

  if (error) throw error;
}

// Layer 3: Services — place CRUD and scene linking

import { createClient } from "@/lib/db/server";
import type { Place } from "@/lib/types/database";

export async function getPlaces(projectId: string): Promise<Place[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("places")
    .select("*")
    .eq("project_id", projectId)
    .is("deleted_at", null)
    .order("sort_order", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function getPlace(id: string): Promise<Place | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("places")
    .select("*")
    .eq("id", id)
    .is("deleted_at", null)
    .single();

  if (error) return null;
  return data;
}

export async function createPlace(input: {
  projectId: string;
  name: string;
  description?: string;
}): Promise<Place> {
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("places")
    .select("sort_order")
    .eq("project_id", input.projectId)
    .is("deleted_at", null)
    .order("sort_order", { ascending: false })
    .limit(1);

  const nextOrder = (existing?.[0]?.sort_order ?? -1) + 1;

  const { data, error } = await supabase
    .from("places")
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

export async function updatePlace(
  id: string,
  input: {
    name?: string;
    description?: string;
    image_url?: string | null;
    custom_attributes?: Record<string, unknown>;
  }
): Promise<Place> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("places")
    .update(input)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deletePlace(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("places")
    .delete()
    .eq("id", id);

  if (error) throw error;
}

export async function getPlaceSceneIds(placeId: string): Promise<string[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("scene_places")
    .select("scene_id")
    .eq("place_id", placeId);

  if (error) throw error;
  return (data ?? []).map((r) => r.scene_id);
}

export async function getScenePlaceIds(sceneId: string): Promise<string[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("scene_places")
    .select("place_id")
    .eq("scene_id", sceneId);

  if (error) throw error;
  return (data ?? []).map((r) => r.place_id);
}

export async function linkPlaceToScene(
  sceneId: string,
  placeId: string
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("scene_places")
    .upsert({ scene_id: sceneId, place_id: placeId });

  if (error) throw error;
}

export async function unlinkPlaceFromScene(
  sceneId: string,
  placeId: string
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("scene_places")
    .delete()
    .eq("scene_id", sceneId)
    .eq("place_id", placeId);

  if (error) throw error;
}

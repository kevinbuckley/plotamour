// Layer 3: Services — note CRUD

import { createClient } from "@/lib/db/server";
import type { Note } from "@/lib/types/database";

export async function getNotes(projectId: string): Promise<Note[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("notes")
    .select("*")
    .eq("project_id", projectId)
    .is("deleted_at", null)
    .order("updated_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function getNote(id: string): Promise<Note | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("notes")
    .select("*")
    .eq("id", id)
    .is("deleted_at", null)
    .single();

  if (error) return null;
  return data;
}

export async function createNote(input: {
  projectId: string;
  title?: string;
  category?: string;
}): Promise<Note> {
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("notes")
    .select("sort_order")
    .eq("project_id", input.projectId)
    .is("deleted_at", null)
    .order("sort_order", { ascending: false })
    .limit(1);

  const nextOrder = (existing?.[0]?.sort_order ?? -1) + 1;

  const { data, error } = await supabase
    .from("notes")
    .insert({
      project_id: input.projectId,
      title: input.title ?? "Untitled Note",
      category: input.category ?? "",
      sort_order: nextOrder,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateNote(
  id: string,
  input: {
    title?: string;
    content?: string;
    category?: string;
  }
): Promise<Note> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("notes")
    .update(input)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteNote(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("notes")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);

  if (error) throw error;
}

export async function getNoteCategories(projectId: string): Promise<string[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("notes")
    .select("category")
    .eq("project_id", projectId)
    .is("deleted_at", null)
    .neq("category", "");

  if (error) throw error;
  const categories = [...new Set((data ?? []).map((n) => n.category))];
  return categories.sort();
}

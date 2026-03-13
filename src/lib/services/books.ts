// Layer 3: Services — book management for series projects

import { createClient } from "@/lib/db/server";
import type { Book } from "@/lib/types/database";
import { DEFAULT_CHAPTERS, DEFAULT_PLOTLINE, DEFAULT_PLOTLINE_COLOR } from "@/lib/config/constants";

export async function getBooks(projectId: string): Promise<Book[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("books")
    .select("*")
    .eq("project_id", projectId)
    .is("deleted_at", null)
    .order("sort_order", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function getBook(id: string): Promise<Book | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("books")
    .select("*")
    .eq("id", id)
    .is("deleted_at", null)
    .single();

  if (error) return null;
  return data;
}

export async function createBook(
  projectId: string,
  input: { title: string; description?: string }
): Promise<Book> {
  const supabase = await createClient();

  // Get max sort order
  const { data: existing } = await supabase
    .from("books")
    .select("sort_order")
    .eq("project_id", projectId)
    .is("deleted_at", null)
    .order("sort_order", { ascending: false })
    .limit(1);

  const nextOrder = (existing?.[0]?.sort_order ?? -1) + 1;

  const { data: book, error: bookError } = await supabase
    .from("books")
    .insert({
      project_id: projectId,
      title: input.title,
      description: input.description ?? "",
      sort_order: nextOrder,
    })
    .select()
    .single();

  if (bookError) throw bookError;

  // Create default chapters
  const chapterInserts = DEFAULT_CHAPTERS.map((title, i) => ({
    book_id: book.id,
    title,
    sort_order: i,
  }));

  const { error: chaptersError } = await supabase
    .from("chapters")
    .insert(chapterInserts);

  if (chaptersError) throw chaptersError;

  // Create default plotline
  const { error: plotlineError } = await supabase
    .from("plotlines")
    .insert({
      book_id: book.id,
      title: DEFAULT_PLOTLINE,
      color: DEFAULT_PLOTLINE_COLOR,
      sort_order: 0,
    });

  if (plotlineError) throw plotlineError;

  return book;
}

export async function updateBook(
  id: string,
  input: { title?: string; description?: string; sort_order?: number }
): Promise<Book> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("books")
    .update(input)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteBook(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("books")
    .delete()
    .eq("id", id);

  if (error) throw error;
}

export async function getBookStats(bookId: string): Promise<{
  chapterCount: number;
  sceneCount: number;
  wordCount: number;
}> {
  const supabase = await createClient();

  const [chaptersRes, scenesRes, docsRes] = await Promise.all([
    supabase
      .from("chapters")
      .select("id", { count: "exact" })
      .eq("book_id", bookId),
    supabase
      .from("scenes")
      .select("id", { count: "exact" })
      .eq("book_id", bookId)
      .is("deleted_at", null),
    supabase
      .from("scene_google_docs")
      .select("word_count, scenes!inner(book_id)")
      .eq("scenes.book_id", bookId),
  ]);

  const wordCount = (docsRes.data ?? []).reduce(
    (sum, doc) => sum + (doc.word_count ?? 0),
    0
  );

  return {
    chapterCount: chaptersRes.count ?? 0,
    sceneCount: scenesRes.count ?? 0,
    wordCount,
  };
}

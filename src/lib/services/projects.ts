// Layer 3: Services — project business logic

import { createClient } from "@/lib/db/server";
import type { Project, ProjectType } from "@/lib/types/database";
import { DEFAULT_CHAPTERS, DEFAULT_PLOTLINE, DEFAULT_PLOTLINE_COLOR } from "@/lib/config/constants";

export async function getProjects(): Promise<Project[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .is("deleted_at", null)
    .order("updated_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function getProject(id: string): Promise<Project | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("id", id)
    .is("deleted_at", null)
    .single();

  if (error) return null;
  return data;
}

export async function createProject(input: {
  title: string;
  description?: string;
  projectType?: ProjectType;
}): Promise<{ project: Project; bookId: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Create project
  const { data: project, error: projectError } = await supabase
    .from("projects")
    .insert({
      user_id: user.id,
      title: input.title,
      description: input.description ?? "",
      project_type: input.projectType ?? "standalone",
    })
    .select()
    .single();

  if (projectError) throw projectError;

  // Create default book
  const { data: book, error: bookError } = await supabase
    .from("books")
    .insert({
      project_id: project.id,
      title: input.title,
      sort_order: 0,
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

  return { project, bookId: book.id };
}

export async function updateProject(
  id: string,
  input: { title?: string; description?: string }
): Promise<Project> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("projects")
    .update(input)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteProject(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("projects")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);

  if (error) throw error;
}

export async function getFirstBookId(projectId: string): Promise<string | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("books")
    .select("id")
    .eq("project_id", projectId)
    .is("deleted_at", null)
    .order("sort_order", { ascending: true })
    .limit(1)
    .single();

  if (error) return null;
  return data.id;
}

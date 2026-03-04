// Layer 3: Services — template application logic

import { createClient } from "@/lib/db/server";
import type { Chapter, Plotline } from "@/lib/types/database";
import { getTemplateById, BUILT_IN_TEMPLATES } from "@/lib/data/templates";
import type { TemplateDefinition } from "@/lib/data/templates";

/**
 * Apply a built-in template to a book.
 * Replaces existing chapters/plotlines with the template structure.
 * Creates placeholder scenes for each chapter × plotline combination.
 */
export async function applyTemplate(
  bookId: string,
  templateId: string
): Promise<{ chapters: Chapter[]; plotlines: Plotline[] }> {
  const template = getTemplateById(templateId);
  if (!template) throw new Error(`Template not found: ${templateId}`);

  return applyTemplateDefinition(bookId, template);
}

/**
 * Apply any template definition (built-in or custom) to a book.
 */
export async function applyTemplateDefinition(
  bookId: string,
  template: TemplateDefinition
): Promise<{ chapters: Chapter[]; plotlines: Plotline[] }> {
  const supabase = await createClient();

  // Delete existing scenes, chapters, and plotlines for this book
  await supabase.from("scenes").delete().eq("book_id", bookId);
  await supabase.from("chapters").delete().eq("book_id", bookId);
  await supabase.from("plotlines").delete().eq("book_id", bookId);

  // Create plotlines from template
  const plotlineInserts = template.plotlines.map((p, i) => ({
    book_id: bookId,
    title: p.title,
    color: p.color,
    sort_order: i,
  }));

  const { data: plotlines, error: plotlineError } = await supabase
    .from("plotlines")
    .insert(plotlineInserts)
    .select();

  if (plotlineError) throw plotlineError;

  // Create chapters from template
  const chapterInserts = template.chapters.map((ch, i) => ({
    book_id: bookId,
    title: ch.title,
    description: ch.description,
    sort_order: i,
  }));

  const { data: chapters, error: chapterError } = await supabase
    .from("chapters")
    .insert(chapterInserts)
    .select();

  if (chapterError) throw chapterError;

  // Create a placeholder scene for each chapter in the first plotline
  if (plotlines.length > 0 && chapters.length > 0) {
    const mainPlotline = plotlines[0];
    const sceneInserts = chapters.map((ch, i) => ({
      book_id: bookId,
      chapter_id: ch.id,
      plotline_id: mainPlotline.id,
      title: template.chapters[i]?.title ?? `Scene ${i + 1}`,
      summary: template.chapters[i]?.description ?? "",
      conflict: "",
      position: 0,
    }));

    const { error: sceneError } = await supabase
      .from("scenes")
      .insert(sceneInserts);

    if (sceneError) throw sceneError;
  }

  return { chapters, plotlines };
}

/**
 * Save the current book's structure as a custom template.
 */
export async function saveBookAsTemplate(
  bookId: string,
  name: string
): Promise<TemplateDefinition> {
  const supabase = await createClient();

  // Fetch current book structure
  const [chaptersRes, plotlinesRes] = await Promise.all([
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
  ]);

  if (chaptersRes.error) throw chaptersRes.error;
  if (plotlinesRes.error) throw plotlinesRes.error;

  const chapters = chaptersRes.data ?? [];
  const plotlines = plotlinesRes.data ?? [];

  const template: TemplateDefinition = {
    id: `custom-${Date.now()}`,
    name,
    author: "Custom",
    description: `Custom template saved from book structure (${chapters.length} chapters, ${plotlines.length} plotlines)`,
    chapters: chapters.map((ch) => ({
      title: ch.title,
      description: ch.description || "",
    })),
    plotlines: plotlines.map((p) => ({
      title: p.title,
      color: p.color,
    })),
  };

  // Store in the user's project attribute_templates or as a standalone record
  // For now, we store custom templates in the profiles table or a dedicated store
  // Using localStorage on the client side for MVP — will upgrade to DB later
  return template;
}

/**
 * List all available templates (built-in only for now).
 */
export function listTemplates(): TemplateDefinition[] {
  return BUILT_IN_TEMPLATES;
}

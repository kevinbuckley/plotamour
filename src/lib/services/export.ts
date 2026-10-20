// Layer 3: Services — export outline to various formats

import { createClient } from "@/lib/db/server";
import type { Chapter, Plotline, Scene, Character, Place } from "@/lib/types/database";
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from "docx";

export interface ExportData {
  projectTitle: string;
  bookTitle: string;
  chapters: (Chapter & {
    scenes: (Scene & {
      plotlineTitle: string;
      plotlineColor: string;
      characters: string[];
      places: string[];
    })[];
  })[];
  plotlines: Plotline[];
  characters: Character[];
  places: Place[];
}

/**
 * Gather all data needed to export a book's outline.
 */
export async function getExportData(bookId: string): Promise<ExportData> {
  const db = await createClient();

  // Fetch book info
  const { data: book, error: bookErr } = await db
    .from("books")
    .select("*, projects(*)")
    .eq("id", bookId)
    .single();

  if (bookErr || !book) throw new Error("Book not found");

  const projectId = book.project_id;

  // Fetch all related data in parallel
  const [chaptersRes, plotlinesRes, scenesRes, charsRes, placesRes] =
    await Promise.all([
      db
        .from("chapters")
        .select("*")
        .eq("book_id", bookId)
        .order("sort_order", { ascending: true }),
      db
        .from("plotlines")
        .select("*")
        .eq("book_id", bookId)
        .order("sort_order", { ascending: true }),
      db
        .from("scenes")
        .select("*")
        .eq("book_id", bookId)
        .is("deleted_at", null)
        .order("position", { ascending: true }),
      db
        .from("characters")
        .select("*")
        .eq("project_id", projectId)
        .is("deleted_at", null)
        .order("sort_order", { ascending: true }),
      db
        .from("places")
        .select("*")
        .eq("project_id", projectId)
        .is("deleted_at", null)
        .order("sort_order", { ascending: true }),
    ]);

  const chapters = chaptersRes.data ?? [];
  const plotlines = plotlinesRes.data ?? [];
  const scenes = scenesRes.data ?? [];
  const characters = charsRes.data ?? [];
  const places = placesRes.data ?? [];

  // Fetch scene-character and scene-place links
  const sceneIds = scenes.map((s) => s.id);

  const [sceneCharsRes, scenePlacesRes] = await Promise.all([
    sceneIds.length > 0
      ? db
          .from("scene_characters")
          .select("scene_id, character_id")
          .in("scene_id", sceneIds)
      : Promise.resolve({ data: [] }),
    sceneIds.length > 0
      ? db
          .from("scene_places")
          .select("scene_id, place_id")
          .in("scene_id", sceneIds)
      : Promise.resolve({ data: [] }),
  ]);

  const sceneCharMap = new Map<string, string[]>();
  for (const link of sceneCharsRes.data ?? []) {
    const list = sceneCharMap.get(link.scene_id) ?? [];
    const char = characters.find((c) => c.id === link.character_id);
    if (char) list.push(char.name);
    sceneCharMap.set(link.scene_id, list);
  }

  const scenePlaceMap = new Map<string, string[]>();
  for (const link of scenePlacesRes.data ?? []) {
    const list = scenePlaceMap.get(link.scene_id) ?? [];
    const place = places.find((p) => p.id === link.place_id);
    if (place) list.push(place.name);
    scenePlaceMap.set(link.scene_id, list);
  }

  // Build enriched chapters
  const enrichedChapters = chapters.map((ch) => {
    const chapterScenes = scenes
      .filter((s) => s.chapter_id === ch.id)
      .map((s) => {
        const plotline = plotlines.find((p) => p.id === s.plotline_id);
        return {
          ...s,
          plotlineTitle: plotline?.title ?? "Unknown",
          plotlineColor: plotline?.color ?? "#6366f1",
          characters: sceneCharMap.get(s.id) ?? [],
          places: scenePlaceMap.get(s.id) ?? [],
        };
      });

    return { ...ch, scenes: chapterScenes };
  });

  const projectData = book.projects as { title: string } | null;

  return {
    projectTitle: projectData?.title ?? "Untitled",
    bookTitle: book.title,
    chapters: enrichedChapters,
    plotlines,
    characters,
    places,
  };
}

/**
 * Generate a plain-text outline export.
 */
export function generateTextOutline(data: ExportData): string {
  const lines: string[] = [];

  lines.push(`# ${data.projectTitle}`);
  if (data.bookTitle !== data.projectTitle) {
    lines.push(`## ${data.bookTitle}`);
  }
  lines.push("");

  // Plotlines summary
  lines.push("## Plotlines");
  for (const p of data.plotlines) {
    lines.push(`- ${p.title}`);
  }
  lines.push("");

  // Chapters and scenes
  for (const chapter of data.chapters) {
    lines.push(`## ${chapter.title}`);
    if (chapter.description) {
      lines.push(chapter.description);
    }
    lines.push("");

    for (const scene of chapter.scenes) {
      lines.push(`### ${scene.title} [${scene.plotlineTitle}]`);
      if (scene.summary) lines.push(scene.summary);
      if (scene.conflict) lines.push(`**Conflict:** ${scene.conflict}`);
      if (scene.characters.length > 0) {
        lines.push(`**Characters:** ${scene.characters.join(", ")}`);
      }
      if (scene.places.length > 0) {
        lines.push(`**Places:** ${scene.places.join(", ")}`);
      }
      lines.push("");
    }
  }

  // Characters
  if (data.characters.length > 0) {
    lines.push("## Characters");
    for (const c of data.characters) {
      lines.push(`### ${c.name}`);
      if (c.description) lines.push(c.description);
      lines.push("");
    }
  }

  // Places
  if (data.places.length > 0) {
    lines.push("## Places");
    for (const p of data.places) {
      lines.push(`### ${p.name}`);
      if (p.description) lines.push(p.description);
      lines.push("");
    }
  }

  return lines.join("\n");
}

/**
 * Generate an HTML outline export (can be used for PDF conversion).
 */
export function generateHtmlOutline(data: ExportData): string {
  const sections: string[] = [];

  sections.push(`<h1>${esc(data.projectTitle)}</h1>`);
  if (data.bookTitle !== data.projectTitle) {
    sections.push(`<h2>${esc(data.bookTitle)}</h2>`);
  }

  // Plotlines
  sections.push("<h2>Plotlines</h2><ul>");
  for (const p of data.plotlines) {
    sections.push(
      `<li><span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${p.color};margin-right:6px"></span>${esc(p.title)}</li>`
    );
  }
  sections.push("</ul>");

  // Chapters
  for (const chapter of data.chapters) {
    sections.push(`<h2>${esc(chapter.title)}</h2>`);
    if (chapter.description) {
      sections.push(`<p style="color:#666">${esc(chapter.description)}</p>`);
    }

    for (const scene of chapter.scenes) {
      sections.push(
        `<div style="margin:12px 0;padding:12px;border:1px solid #ddd;border-left:3px solid ${scene.plotlineColor};border-radius:4px">`
      );
      sections.push(`<h3 style="margin:0">${esc(scene.title)}</h3>`);
      sections.push(
        `<p style="font-size:12px;color:#888;margin:2px 0">${esc(scene.plotlineTitle)}</p>`
      );
      if (scene.summary) {
        sections.push(`<p>${esc(scene.summary)}</p>`);
      }
      if (scene.conflict) {
        sections.push(`<p><strong>Conflict:</strong> ${esc(scene.conflict)}</p>`);
      }
      if (scene.characters.length > 0) {
        sections.push(
          `<p><strong>Characters:</strong> ${scene.characters.map(esc).join(", ")}</p>`
        );
      }
      if (scene.places.length > 0) {
        sections.push(
          `<p><strong>Places:</strong> ${scene.places.map(esc).join(", ")}</p>`
        );
      }
      sections.push("</div>");
    }
  }

  // Characters
  if (data.characters.length > 0) {
    sections.push("<h2>Characters</h2>");
    for (const c of data.characters) {
      sections.push(`<h3>${esc(c.name)}</h3>`);
      if (c.description) sections.push(`<p>${esc(c.description)}</p>`);
    }
  }

  // Places
  if (data.places.length > 0) {
    sections.push("<h2>Places</h2>");
    for (const p of data.places) {
      sections.push(`<h3>${esc(p.name)}</h3>`);
      if (p.description) sections.push(`<p>${esc(p.description)}</p>`);
    }
  }

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${esc(data.projectTitle)} — Outline</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 800px; margin: 0 auto; padding: 40px 20px; color: #1a1a1a; }
    h1 { border-bottom: 2px solid #6366f1; padding-bottom: 8px; }
    h2 { color: #374151; margin-top: 32px; }
    h3 { margin-bottom: 4px; }
  </style>
</head>
<body>${sections.join("\n")}</body>
</html>`;
}

/**
 * Generate a Word (.docx) outline export.
 */
export async function generateDocxOutline(data: ExportData): Promise<Buffer> {
  const children: Paragraph[] = [];

  // Title
  children.push(
    new Paragraph({
      text: data.projectTitle,
      heading: HeadingLevel.HEADING_1,
      spacing: { after: 120 },
    })
  );

  if (data.bookTitle !== data.projectTitle) {
    children.push(
      new Paragraph({
        text: data.bookTitle,
        heading: HeadingLevel.HEADING_2,
        spacing: { after: 80 },
      })
    );
  }

  // Plotlines
  children.push(
    new Paragraph({
      text: "Plotlines",
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 240, after: 80 },
    })
  );
  for (const p of data.plotlines) {
    children.push(
      new Paragraph({
        bullet: { level: 0 },
        children: [new TextRun({ text: p.title })],
        spacing: { after: 40 },
      })
    );
  }

  // Chapters
  for (const chapter of data.chapters) {
    children.push(
      new Paragraph({
        text: chapter.title,
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 320, after: 80 },
      })
    );

    if (chapter.description) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: chapter.description, italics: true, color: "555555" }),
          ],
          spacing: { after: 120 },
        })
      );
    }

    for (const scene of chapter.scenes) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: scene.title, bold: true }),
            new TextRun({ text: `  [${scene.plotlineTitle}]`, color: "666666", size: 20 }),
          ],
          heading: HeadingLevel.HEADING_3,
          spacing: { before: 160, after: 60 },
        })
      );

      if (scene.summary) {
        children.push(
          new Paragraph({
            children: [new TextRun({ text: scene.summary })],
            spacing: { after: 60 },
          })
        );
      }
      if (scene.conflict) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({ text: "Conflict: ", bold: true }),
              new TextRun({ text: scene.conflict }),
            ],
            spacing: { after: 60 },
          })
        );
      }
      if (scene.characters.length > 0) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({ text: "Characters: ", bold: true }),
              new TextRun({ text: scene.characters.join(", ") }),
            ],
            spacing: { after: 60 },
          })
        );
      }
      if (scene.places.length > 0) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({ text: "Places: ", bold: true }),
              new TextRun({ text: scene.places.join(", ") }),
            ],
            spacing: { after: 60 },
          })
        );
      }
    }
  }

  // Characters
  if (data.characters.length > 0) {
    children.push(
      new Paragraph({
        text: "Characters",
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 320, after: 80 },
      })
    );
    for (const c of data.characters) {
      children.push(
        new Paragraph({
          text: c.name,
          heading: HeadingLevel.HEADING_3,
          spacing: { before: 160, after: 40 },
        })
      );
      if (c.description) {
        children.push(
          new Paragraph({
            children: [new TextRun({ text: c.description })],
            spacing: { after: 80 },
          })
        );
      }
    }
  }

  // Places
  if (data.places.length > 0) {
    children.push(
      new Paragraph({
        text: "Places",
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 320, after: 80 },
      })
    );
    for (const p of data.places) {
      children.push(
        new Paragraph({
          text: p.name,
          heading: HeadingLevel.HEADING_3,
          spacing: { before: 160, after: 40 },
        })
      );
      if (p.description) {
        children.push(
          new Paragraph({
            children: [new TextRun({ text: p.description })],
            spacing: { after: 80 },
          })
        );
      }
    }
  }

  const doc = new Document({
    creator: "plotamour",
    title: `${data.projectTitle} — Outline`,
    styles: {
      default: {
        document: {
          run: { font: "Calibri", size: 24 },
        },
      },
    },
    sections: [{ children }],
  });

  return Packer.toBuffer(doc);
}

function esc(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

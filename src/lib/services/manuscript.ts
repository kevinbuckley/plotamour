// Layer 3: Services — manuscript compilation from Google Docs

import { createClient } from "@/lib/db/server";
import type { Chapter, Scene, SceneGoogleDoc } from "@/lib/types/database";

interface GoogleTokens {
  access_token: string;
}

interface ManuscriptScene {
  title: string;
  chapterTitle: string;
  chapterIndex: number;
  sceneIndex: number;
  content: string; // plain text extracted from Google Doc
  wordCount: number;
}

export interface ManuscriptData {
  projectTitle: string;
  bookTitle: string;
  totalWords: number;
  scenes: ManuscriptScene[];
  skippedScenes: { title: string; reason: string }[];
}

/**
 * Get a fresh Google access token for the current user.
 */
async function getAccessToken(userId: string): Promise<string | null> {
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("google_refresh_token")
    .eq("id", userId)
    .single();

  if (!profile?.google_refresh_token) return null;

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: profile.google_refresh_token,
      grant_type: "refresh_token",
    }),
  });

  if (!res.ok) return null;
  const data = await res.json();
  return data.access_token ?? null;
}

/**
 * Extract plain text from a Google Doc's JSON body content.
 */
function extractTextFromDocBody(body: { content?: Array<Record<string, unknown>> }): string {
  if (!body?.content) return "";

  const paragraphs: string[] = [];

  for (const element of body.content) {
    if (element.paragraph) {
      const para = element.paragraph as {
        elements?: Array<{ textRun?: { content?: string } }>;
      };
      let paraText = "";
      for (const el of para.elements ?? []) {
        if (el.textRun?.content) {
          paraText += el.textRun.content;
        }
      }
      paragraphs.push(paraText);
    }
  }

  return paragraphs.join("");
}

/**
 * Check if a paragraph is part of the plotamour context header block.
 * These are the gray metadata lines inserted when the doc was created.
 */
function isContextLine(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed) return false;
  if (trimmed.startsWith("plotamour ·")) return true;
  if (trimmed.startsWith("Scene:")) return true;
  if (trimmed.startsWith("Characters:")) return true;
  if (trimmed.startsWith("Setting:")) return true;
  if (trimmed === "---") return true;
  return false;
}

/**
 * Strip the plotamour context header from extracted doc text.
 */
function stripContextHeader(text: string): string {
  const lines = text.split("\n");
  let headerEnd = 0;
  let foundDivider = false;

  for (let i = 0; i < Math.min(lines.length, 15); i++) {
    if (isContextLine(lines[i])) {
      headerEnd = i + 1;
      if (lines[i].trim() === "---") {
        foundDivider = true;
        headerEnd = i + 1;
        break;
      }
    } else if (lines[i].trim() === "" && i < 10) {
      // Empty lines within the header block
      headerEnd = i + 1;
    } else {
      break;
    }
  }

  if (!foundDivider) {
    // No clear divider found, check if first few lines look like context
    headerEnd = 0;
    for (let i = 0; i < Math.min(lines.length, 8); i++) {
      if (isContextLine(lines[i]) || lines[i].trim() === "") {
        headerEnd = i + 1;
      } else {
        break;
      }
    }
  }

  // Skip blank lines after header
  while (headerEnd < lines.length && lines[headerEnd].trim() === "") {
    headerEnd++;
  }

  return lines.slice(headerEnd).join("\n").trim();
}

/**
 * Fetch and compile all Google Docs for a book into a single manuscript.
 */
export async function compileManuscript(bookId: string): Promise<ManuscriptData> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Fetch book info
  const { data: book, error: bookErr } = await supabase
    .from("books")
    .select("*, projects(*)")
    .eq("id", bookId)
    .single();

  if (bookErr || !book) throw new Error("Book not found");

  // Fetch chapters and scenes in order
  const [chaptersRes, scenesRes] = await Promise.all([
    supabase
      .from("chapters")
      .select("*")
      .eq("book_id", bookId)
      .order("sort_order", { ascending: true }),
    supabase
      .from("scenes")
      .select("*, scene_google_docs(*)")
      .eq("book_id", bookId)
      .is("deleted_at", null)
      .order("position", { ascending: true }),
  ]);

  const chapters: Chapter[] = chaptersRes.data ?? [];
  const scenes = (scenesRes.data ?? []).map((s: Record<string, unknown>) => ({
    ...s,
    google_doc: Array.isArray(s.scene_google_docs)
      ? (s.scene_google_docs as SceneGoogleDoc[])[0] ?? null
      : (s.scene_google_docs as SceneGoogleDoc | null) ?? null,
  })) as (Scene & { google_doc?: SceneGoogleDoc | null })[];

  // Get access token
  const accessToken = await getAccessToken(user.id);
  if (!accessToken) throw new Error("Google Docs not connected. Please reconnect your Google account.");

  const manuscriptScenes: ManuscriptScene[] = [];
  const skippedScenes: { title: string; reason: string }[] = [];

  // Process each chapter in order
  for (let chapterIdx = 0; chapterIdx < chapters.length; chapterIdx++) {
    const chapter = chapters[chapterIdx];
    const chapterScenes = scenes
      .filter((s) => s.chapter_id === chapter.id)
      .sort((a, b) => a.position - b.position);

    for (let sceneIdx = 0; sceneIdx < chapterScenes.length; sceneIdx++) {
      const scene = chapterScenes[sceneIdx];
      const doc = scene.google_doc;

      if (!doc?.google_doc_id) {
        skippedScenes.push({ title: scene.title, reason: "No Google Doc linked" });
        continue;
      }

      try {
        const res = await fetch(
          `https://docs.googleapis.com/v1/documents/${doc.google_doc_id}`,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );

        if (!res.ok) {
          skippedScenes.push({
            title: scene.title,
            reason: `Google API error (${res.status})`,
          });
          continue;
        }

        const docData = await res.json();
        const rawText = extractTextFromDocBody(docData.body);
        const content = stripContextHeader(rawText);

        if (!content.trim()) {
          skippedScenes.push({ title: scene.title, reason: "Document is empty" });
          continue;
        }

        const wordCount = content.trim().split(/\s+/).filter(Boolean).length;

        manuscriptScenes.push({
          title: scene.title,
          chapterTitle: chapter.title,
          chapterIndex: chapterIdx,
          sceneIndex: sceneIdx,
          content,
          wordCount,
        });
      } catch {
        skippedScenes.push({ title: scene.title, reason: "Failed to fetch document" });
      }
    }
  }

  const totalWords = manuscriptScenes.reduce((sum, s) => sum + s.wordCount, 0);
  const projectData = book.projects as { title: string } | null;

  return {
    projectTitle: projectData?.title ?? "Untitled",
    bookTitle: book.title,
    totalWords,
    scenes: manuscriptScenes,
    skippedScenes,
  };
}

/**
 * Generate an HTML manuscript from compiled data.
 */
export function generateHtmlManuscript(data: ManuscriptData): string {
  const sections: string[] = [];

  // Title page
  sections.push(`
    <div class="title-page">
      <h1>${esc(data.bookTitle)}</h1>
      ${data.projectTitle !== data.bookTitle ? `<p class="author-line">${esc(data.projectTitle)}</p>` : ""}
      <p class="word-count">${data.totalWords.toLocaleString()} words</p>
    </div>
  `);

  // Group scenes by chapter
  let currentChapter = -1;

  for (const scene of data.scenes) {
    if (scene.chapterIndex !== currentChapter) {
      currentChapter = scene.chapterIndex;
      // Chapter break
      sections.push(`
        <div class="chapter-break">
          <h2>${esc(scene.chapterTitle)}</h2>
        </div>
      `);
    }

    // Scene content — use scene separator for non-first scenes in a chapter
    if (scene.sceneIndex > 0) {
      sections.push('<div class="scene-break">* * *</div>');
    }

    // Convert newlines to paragraphs
    const paragraphs = scene.content
      .split(/\n\n+/)
      .map((p) => p.trim())
      .filter(Boolean);

    for (const para of paragraphs) {
      // Preserve single newlines within a paragraph as line breaks
      const html = esc(para).replace(/\n/g, "<br>");
      sections.push(`<p>${html}</p>`);
    }
  }

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${esc(data.bookTitle)} — Manuscript</title>
  <style>
    @page {
      size: letter;
      margin: 1in;
    }
    body {
      font-family: "Times New Roman", "Georgia", serif;
      font-size: 12pt;
      line-height: 2;
      color: #000;
      max-width: 650px;
      margin: 0 auto;
      padding: 40px 20px;
    }
    .title-page {
      text-align: center;
      padding: 120px 0 80px;
      page-break-after: always;
    }
    .title-page h1 {
      font-size: 24pt;
      font-weight: bold;
      margin: 0 0 16px;
      text-transform: uppercase;
      letter-spacing: 2px;
    }
    .title-page .author-line {
      font-size: 14pt;
      color: #444;
      margin: 8px 0;
    }
    .title-page .word-count {
      font-size: 11pt;
      color: #888;
      margin-top: 24px;
    }
    .chapter-break {
      page-break-before: always;
      text-align: center;
      padding-top: 120px;
      margin-bottom: 40px;
    }
    .chapter-break h2 {
      font-size: 18pt;
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin: 0;
    }
    .scene-break {
      text-align: center;
      margin: 24px 0;
      font-size: 14pt;
      letter-spacing: 4px;
    }
    p {
      text-indent: 0.5in;
      margin: 0;
    }
    p:first-of-type {
      text-indent: 0;
    }
    .chapter-break + p {
      text-indent: 0;
    }
    .scene-break + p {
      text-indent: 0;
    }
  </style>
</head>
<body>
${sections.join("\n")}
</body>
</html>`;
}

/**
 * Generate a plain-text manuscript from compiled data.
 */
export function generateTextManuscript(data: ManuscriptData): string {
  const lines: string[] = [];

  // Title
  lines.push(data.bookTitle.toUpperCase());
  if (data.projectTitle !== data.bookTitle) {
    lines.push(data.projectTitle);
  }
  lines.push(`${data.totalWords.toLocaleString()} words`);
  lines.push("");
  lines.push("---");
  lines.push("");

  let currentChapter = -1;

  for (const scene of data.scenes) {
    if (scene.chapterIndex !== currentChapter) {
      currentChapter = scene.chapterIndex;
      if (lines.length > 6) {
        lines.push("");
        lines.push("");
      }
      lines.push(scene.chapterTitle.toUpperCase());
      lines.push("");
    }

    if (scene.sceneIndex > 0) {
      lines.push("");
      lines.push("* * *");
      lines.push("");
    }

    lines.push(scene.content);
  }

  return lines.join("\n");
}

function esc(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

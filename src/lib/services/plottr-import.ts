// Layer 3: Services — Plottr (.pltr) file import

import { createClient } from "@/lib/db/server";

// --- Plottr file types ---

interface PlottrRichText {
  children?: { text?: string }[];
}

interface PlottrCard {
  id: number;
  title: string;
  description?: PlottrRichText[];
  beatId: number;
  lineId: number;
  characters?: number[];
  places?: number[];
  tags?: number[];
  position?: number;
  positionWithinLine?: number;
}

interface PlottrBeat {
  id: number;
  title: string;
  position: number;
}

interface PlottrLine {
  id: number;
  title: string;
  color: string;
  position: number;
  bookId?: number;
}

interface PlottrCharacter {
  id: number;
  name: string;
  description?: string | PlottrRichText[];
  notes?: string | PlottrRichText[];
  templates?: PlottrRichText[];
}

interface PlottrPlace {
  id: number;
  name: string;
  description?: string | PlottrRichText[];
  notes?: string | PlottrRichText[];
}

interface PlottrTag {
  id: number;
  title: string;
  color?: string;
  type?: string;
}

interface PlottrNote {
  id: number;
  title: string;
  content?: string | PlottrRichText[];
}

interface PlottrBook {
  id: number;
  title: string;
  premise?: string;
}

interface PlottrFile {
  // Template format (arrays)
  cards?: PlottrCard[];
  lines?: PlottrLine[];

  // Full file format (objects with nested structure)
  beats?: Record<string, Record<string, PlottrBeat>>;
  books?: Record<string, PlottrBook> & { allIds?: number[] };
  characters?: PlottrCharacter[];
  places?: PlottrPlace[];
  tags?: PlottrTag[];
  notes?: PlottrNote[];

  // Template wrapper
  templateData?: {
    cards?: PlottrCard[];
    lines?: PlottrLine[];
    beats?: Record<string, Record<string, PlottrBeat>>;
  };

  // Metadata
  storyName?: string;
  name?: string;
  file?: { fileName?: string };
}

// --- Helpers ---

function extractText(description: PlottrRichText[] | string | undefined): string {
  if (!description) return "";
  if (typeof description === "string") return description;
  return description
    .map((block) =>
      block.children
        ?.map((child) => child.text ?? "")
        .join("") ?? ""
    )
    .join("\n")
    .trim();
}

function extractBeats(beats: PlottrFile["beats"], bookId: number): PlottrBeat[] {
  if (!beats) return [];

  const bookBeats = beats[String(bookId)];
  if (!bookBeats) {
    // Try first available book
    const firstKey = Object.keys(beats)[0];
    if (!firstKey) return [];
    const firstBookBeats = beats[firstKey];
    if (!firstBookBeats) return [];
    return Object.values(firstBookBeats).sort((a, b) => a.position - b.position);
  }

  return Object.values(bookBeats).sort((a, b) => a.position - b.position);
}

function getProjectTitle(data: PlottrFile): string {
  if (data.storyName) return data.storyName;
  if (data.name) return data.name;
  if (data.file?.fileName) return data.file.fileName.replace(/\.pltr$/, "");

  // Try to find a book title
  if (data.books) {
    const bookIds = data.books.allIds ?? Object.keys(data.books).filter((k) => k !== "allIds").map(Number);
    if (bookIds.length > 0) {
      const firstBook = data.books[String(bookIds[0])] as PlottrBook | undefined;
      if (firstBook?.title) return firstBook.title;
    }
  }

  return "Imported from Plottr";
}

// --- Preview (no DB, pure analysis) ---

export interface PlottrPreview {
  title: string;
  books: number;
  chapters: number;
  plotlines: number;
  scenes: number;
  characters: number;
  places: number;
  notes: number;
  tags: number;
}

export function previewPlottrFile(data: PlottrFile): PlottrPreview {
  const td = data.templateData;
  const cards = td?.cards ?? data.cards ?? [];
  const lines = td?.lines ?? data.lines ?? [];
  const beats = td?.beats ?? data.beats;

  let chapterCount = 0;
  if (beats) {
    for (const bookKey of Object.keys(beats)) {
      const bookBeats = beats[bookKey];
      if (bookBeats && typeof bookBeats === "object") {
        chapterCount += Object.keys(bookBeats).length;
      }
    }
  }

  const bookIds = data.books?.allIds ?? [];

  return {
    title: getProjectTitle(data),
    books: Math.max(bookIds.length, 1),
    chapters: chapterCount,
    plotlines: lines.length,
    scenes: cards.length,
    characters: data.characters?.length ?? 0,
    places: data.places?.length ?? 0,
    notes: data.notes?.length ?? 0,
    tags: data.tags?.length ?? 0,
  };
}

// --- Import (writes to DB) ---

export async function importPlottrFile(data: PlottrFile): Promise<{ projectId: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const projectTitle = getProjectTitle(data);

  // 1. Create project
  const { data: project, error: projectError } = await supabase
    .from("projects")
    .insert({
      user_id: user.id,
      title: projectTitle,
      description: "Imported from Plottr",
      project_type: "standalone",
    })
    .select()
    .single();

  if (projectError) throw projectError;

  // Resolve template data
  const td = data.templateData;
  const cards = td?.cards ?? data.cards ?? [];
  const lines = td?.lines ?? data.lines ?? [];
  const beatsData = td?.beats ?? data.beats;

  // Determine books to import
  const bookIds = data.books?.allIds ?? [1];
  const firstBookId = bookIds[0] ?? 1;

  // 2. Create book
  const bookTitle = data.books?.[String(firstBookId)]?.title ?? projectTitle;
  const { data: book, error: bookError } = await supabase
    .from("books")
    .insert({
      project_id: project.id,
      title: bookTitle,
      description: data.books?.[String(firstBookId)]?.premise ?? "",
      sort_order: 0,
    })
    .select()
    .single();

  if (bookError) throw bookError;

  // 3. Create chapters from beats
  const beats = extractBeats(beatsData, firstBookId);
  const beatIdToChapterId: Record<number, string> = {};

  if (beats.length > 0) {
    const chapterInserts = beats.map((beat, i) => ({
      book_id: book.id,
      title: beat.title === "auto" ? `Chapter ${i + 1}` : beat.title,
      sort_order: i,
    }));

    const { data: chapters, error: chaptersError } = await supabase
      .from("chapters")
      .insert(chapterInserts)
      .select();

    if (chaptersError) throw chaptersError;

    chapters?.forEach((ch, i) => {
      const beat = beats[i];
      if (beat) beatIdToChapterId[beat.id] = ch.id;
    });
  } else {
    // Create a single default chapter
    const { data: defaultChapter, error } = await supabase
      .from("chapters")
      .insert({ book_id: book.id, title: "Chapter 1", sort_order: 0 })
      .select()
      .single();

    if (error) throw error;
    beatIdToChapterId[0] = defaultChapter.id;
  }

  // 4. Create plotlines from lines
  const lineIdToPlotlineId: Record<number, string> = {};
  const DEFAULT_COLORS = ["#6cace4", "#78be20", "#e63946", "#f4a261", "#9b59b6", "#2ecc71"];

  if (lines.length > 0) {
    const plotlineInserts = lines
      .sort((a, b) => a.position - b.position)
      .map((line, i) => ({
        book_id: book.id,
        title: line.title || `Plotline ${i + 1}`,
        color: line.color || DEFAULT_COLORS[i % DEFAULT_COLORS.length],
        sort_order: i,
      }));

    const { data: plotlines, error: plotlinesError } = await supabase
      .from("plotlines")
      .insert(plotlineInserts)
      .select();

    if (plotlinesError) throw plotlinesError;

    const sortedLines = lines.sort((a, b) => a.position - b.position);
    plotlines?.forEach((pl, i) => {
      const line = sortedLines[i];
      if (line) lineIdToPlotlineId[line.id] = pl.id;
    });
  } else {
    // Create default plotline
    const { data: defaultPlotline, error } = await supabase
      .from("plotlines")
      .insert({ book_id: book.id, title: "Main Plot", color: "#6cace4", sort_order: 0 })
      .select()
      .single();

    if (error) throw error;
    lineIdToPlotlineId[0] = defaultPlotline.id;
  }

  // 5. Create characters
  const plottrCharIdToId: Record<number, string> = {};
  if (data.characters?.length) {
    const charInserts = data.characters.map((c, i) => ({
      project_id: project.id,
      name: c.name || `Character ${i + 1}`,
      description: extractText(c.description) || extractText(c.notes) || "",
      sort_order: i,
    }));

    const { data: characters, error: charError } = await supabase
      .from("characters")
      .insert(charInserts)
      .select();

    if (charError) throw charError;

    characters?.forEach((ch, i) => {
      const plottrChar = data.characters![i];
      if (plottrChar) plottrCharIdToId[plottrChar.id] = ch.id;
    });
  }

  // 6. Create places
  const plottrPlaceIdToId: Record<number, string> = {};
  if (data.places?.length) {
    const placeInserts = data.places.map((p, i) => ({
      project_id: project.id,
      name: p.name || `Place ${i + 1}`,
      description: extractText(p.description) || extractText(p.notes) || "",
      sort_order: i,
    }));

    const { data: places, error: placeError } = await supabase
      .from("places")
      .insert(placeInserts)
      .select();

    if (placeError) throw placeError;

    places?.forEach((pl, i) => {
      const plottrPlace = data.places![i];
      if (plottrPlace) plottrPlaceIdToId[plottrPlace.id] = pl.id;
    });
  }

  // 7. Create notes
  if (data.notes?.length) {
    const noteInserts = data.notes.map((n, i) => ({
      project_id: project.id,
      title: n.title || `Note ${i + 1}`,
      content: extractText(n.content),
      category: "general",
      sort_order: i,
    }));

    await supabase.from("notes").insert(noteInserts);
  }

  // 8. Create tags
  const plottrTagIdToId: Record<number, string> = {};
  if (data.tags?.length) {
    const tagInserts = data.tags.map((t) => ({
      project_id: project.id,
      name: t.title || "Tag",
      color: t.color || "#6cace4",
      category: t.type || "general",
    }));

    const { data: tags, error: tagError } = await supabase
      .from("tags")
      .insert(tagInserts)
      .select();

    if (tagError) throw tagError;

    tags?.forEach((tag, i) => {
      const plottrTag = data.tags![i];
      if (plottrTag) plottrTagIdToId[plottrTag.id] = tag.id;
    });
  }

  // 9. Create scenes from cards
  const firstChapterId = Object.values(beatIdToChapterId)[0];
  const firstPlotlineId = Object.values(lineIdToPlotlineId)[0];

  if (cards.length > 0 && firstChapterId && firstPlotlineId) {
    // Track position per chapter+plotline combo
    const positionCounters: Record<string, number> = {};

    const sceneInserts = cards.map((card) => {
      const chapterId = beatIdToChapterId[card.beatId] ?? firstChapterId;
      const plotlineId = lineIdToPlotlineId[card.lineId] ?? firstPlotlineId;
      const key = `${chapterId}:${plotlineId}`;
      const position = positionCounters[key] ?? 0;
      positionCounters[key] = position + 1;

      return {
        book_id: book.id,
        chapter_id: chapterId,
        plotline_id: plotlineId,
        title: card.title || "Untitled Scene",
        summary: extractText(card.description),
        conflict: "",
        position,
      };
    });

    const { data: scenes, error: sceneError } = await supabase
      .from("scenes")
      .insert(sceneInserts)
      .select();

    if (sceneError) throw sceneError;

    // 10. Link characters and places to scenes
    if (scenes) {
      const sceneCharLinks: { scene_id: string; character_id: string }[] = [];
      const scenePlaceLinks: { scene_id: string; place_id: string }[] = [];

      scenes.forEach((scene, i) => {
        const card = cards[i];
        if (!card) return;

        // Character links
        card.characters?.forEach((plottrCharId) => {
          const charId = plottrCharIdToId[plottrCharId];
          if (charId) {
            sceneCharLinks.push({ scene_id: scene.id, character_id: charId });
          }
        });

        // Place links
        card.places?.forEach((plottrPlaceId) => {
          const placeId = plottrPlaceIdToId[plottrPlaceId];
          if (placeId) {
            scenePlaceLinks.push({ scene_id: scene.id, place_id: placeId });
          }
        });
      });

      if (sceneCharLinks.length > 0) {
        await supabase.from("scene_characters").upsert(sceneCharLinks);
      }
      if (scenePlaceLinks.length > 0) {
        await supabase.from("scene_places").upsert(scenePlaceLinks);
      }
    }
  }

  return { projectId: project.id };
}

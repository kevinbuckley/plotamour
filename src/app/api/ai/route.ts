import { NextResponse } from "next/server";
import { createClient } from "@/lib/db/server";
import { runAiFeature, type AiFeature, type StoryContext } from "@/lib/services/ai";
import { getTimelineData } from "@/lib/services/timeline";
import { getCharacters } from "@/lib/services/characters";
import { getBook } from "@/lib/services/books";

export async function POST(request: Request) {
  try {
    // Auth check
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { feature, bookId, sceneId, characterId } = body as {
      feature: AiFeature;
      bookId: string;
      sceneId?: string;
      characterId?: string;
    };

    if (!feature || !bookId) {
      return NextResponse.json(
        { error: "feature and bookId are required" },
        { status: 400 },
      );
    }

    // Gather story context
    const [timeline, book] = await Promise.all([
      getTimelineData(bookId),
      getBook(bookId),
    ]);

    if (!book) {
      return NextResponse.json({ error: "Book not found" }, { status: 404 });
    }

    // Get project characters
    const characters = await getCharacters(book.project_id);

    const ctx: StoryContext = {
      bookTitle: book.title,
      chapters: timeline.chapters.map((ch) => ({
        id: ch.id,
        title: ch.title,
        sort_order: ch.sort_order,
      })),
      plotlines: timeline.plotlines.map((p) => ({
        id: p.id,
        title: p.title,
        color: p.color,
      })),
      characters: characters.map((c) => ({
        id: c.id,
        name: c.name,
        description: c.description,
      })),
      scenes: timeline.scenes.map((s) => ({
        id: s.id,
        title: s.title,
        summary: s.summary,
        conflict: s.conflict,
        chapter_id: s.chapter_id,
        plotline_id: s.plotline_id,
      })),
    };

    const result = await runAiFeature(feature, ctx, { sceneId, characterId });

    return NextResponse.json({ result });
  } catch (error) {
    console.error("[AI API]", error);

    const message = error instanceof Error ? error.message : "AI request failed";

    // Surface API key issues clearly
    if (message.includes("API key") || message.includes("401") || message.includes("403")) {
      return NextResponse.json(
        { error: "Google AI Studio API key not configured. Add GOOGLE_GENERATIVE_AI_API_KEY to your environment." },
        { status: 503 },
      );
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}

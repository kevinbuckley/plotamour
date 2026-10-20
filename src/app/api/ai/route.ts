import { NextResponse } from "next/server";
import { currentUser } from "@/lib/services/current-user";
import { checkLocalRequest } from "@/lib/services/chatgpt";
import { z } from "zod";
import { runAiFeature, type StoryContext } from "@/lib/services/ai";
import { getTimelineData } from "@/lib/services/timeline";
import { getCharacters } from "@/lib/services/characters";
import { getBook } from "@/lib/services/books";

export async function POST(request: Request) {
  try {
    // Auth check
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const parsed = z
      .object({
        feature: z.enum([
          "what-if",
          "scene-ideas",
          "character-voice",
          "pacing-check",
        ]),
        bookId: z.string().uuid(),
        sceneId: z.string().uuid().optional(),
        characterId: z.string().uuid().optional(),
        provider: z.enum(["google", "chatgpt"]),
        model: z.string().min(1).max(200).optional(),
      })
      .safeParse(await request.json().catch(() => null));
    if (!parsed.success)
      return NextResponse.json(
        { error: "Choose a provider, valid feature and book." },
        { status: 400 },
      );
    const { feature, bookId, sceneId, characterId, provider, model } =
      parsed.data;
    if (provider === "chatgpt") {
      checkLocalRequest(request, true);
      if (feature !== "scene-ideas" || !model)
        return NextResponse.json(
          { error: "Select a ChatGPT model for Scene Ideas." },
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

    if (
      (sceneId && !ctx.scenes.some((s) => s.id === sceneId)) ||
      (characterId && !ctx.characters.some((c) => c.id === characterId))
    ) {
      return NextResponse.json(
        { error: "Story item not found in this book." },
        { status: 404 },
      );
    }
    const result = await runAiFeature(
      feature,
      ctx,
      { sceneId, characterId },
      { provider, userId: user.id, model },
    );

    return NextResponse.json(
      { result, provider },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    // Never log provider errors: they can include credentials or story content.

    const message =
      error instanceof Error ? error.message : "AI request failed";

    // Surface API key issues clearly
    if (
      message.includes("API key") ||
      message.includes("401") ||
      message.includes("403")
    ) {
      return NextResponse.json(
        {
          error:
            "Google AI Studio API key not configured. Add GOOGLE_GENERATIVE_AI_API_KEY to your environment.",
        },
        { status: 503 },
      );
    }

    return NextResponse.json(
      {
        error:
          message.startsWith("ChatGPT") ||
          message.startsWith("Connect ChatGPT") ||
          message.startsWith("Choose") ||
          message.startsWith("OpenAI") ||
          message.startsWith("Open the local")
            ? message
            : "AI request failed. Retry or check AI settings.",
      },
      { status: 503 },
    );
  }
}

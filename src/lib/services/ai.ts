// Layer 2: AI service — wraps Vercel AI SDK with Google provider
import { google } from "@ai-sdk/google";
import { generateText } from "ai";
import type { Chapter, Character, Plotline, Scene } from "@/lib/types/database";

const model = google("gemma-3-27b-it");

/** Context assembled from the user's project data */
export interface StoryContext {
  bookTitle: string;
  chapters: Pick<Chapter, "id" | "title" | "sort_order">[];
  plotlines: Pick<Plotline, "id" | "title" | "color">[];
  characters: Pick<Character, "id" | "name" | "description">[];
  scenes: Pick<Scene, "id" | "title" | "summary" | "conflict" | "chapter_id" | "plotline_id">[];
}

function buildStoryContext(ctx: StoryContext): string {
  const lines: string[] = [`Book: "${ctx.bookTitle}"`];

  if (ctx.plotlines.length > 0) {
    lines.push(`\nPlotlines: ${ctx.plotlines.map((p) => p.title).join(", ")}`);
  }

  if (ctx.characters.length > 0) {
    lines.push("\nCharacters:");
    for (const c of ctx.characters) {
      lines.push(`- ${c.name}${c.description ? `: ${c.description.slice(0, 200)}` : ""}`);
    }
  }

  if (ctx.chapters.length > 0) {
    lines.push("\nStory so far:");
    const sortedChapters = [...ctx.chapters].sort((a, b) => a.sort_order - b.sort_order);
    for (const ch of sortedChapters) {
      const chScenes = ctx.scenes.filter((s) => s.chapter_id === ch.id);
      if (chScenes.length > 0) {
        lines.push(`\n${ch.title}:`);
        for (const s of chScenes) {
          lines.push(`  - ${s.title}${s.summary ? `: ${s.summary.slice(0, 150)}` : ""}`);
        }
      }
    }
  }

  return lines.join("\n");
}

export type AiFeature = "what-if" | "scene-ideas" | "character-voice" | "pacing-check";

export async function runAiFeature(
  feature: AiFeature,
  ctx: StoryContext,
  extra: { sceneId?: string; characterId?: string } = {},
): Promise<string> {
  const storyContext = buildStoryContext(ctx);
  let prompt: string;

  switch (feature) {
    case "what-if": {
      const scene = ctx.scenes.find((s) => s.id === extra.sceneId);
      prompt = `You are a creative writing assistant helping a novelist brainstorm.

Here is the story context:
${storyContext}

${scene ? `Current scene: "${scene.title}" — ${scene.summary}` : ""}

Generate 3 compelling "What If" alternate directions for this story point. For each:
- Start with "What if..."
- Explain how it would ripple through the existing plotlines and characters
- Keep each to 2-3 sentences

Be creative but stay consistent with the established characters and world.`;
      break;
    }

    case "scene-ideas": {
      const chapter = extra.sceneId
        ? ctx.chapters.find((ch) => ch.id === ctx.scenes.find((s) => s.id === extra.sceneId)?.chapter_id)
        : ctx.chapters[ctx.chapters.length - 1];
      prompt = `You are a creative writing assistant helping a novelist brainstorm.

Here is the story context:
${storyContext}

Suggest 3 new scene ideas for ${chapter ? `"${chapter.title}"` : "the next chapter"}. For each scene:
- A punchy title (3-5 words)
- A one-sentence summary of what happens
- Which characters are involved
- What conflict or tension drives the scene

Focus on advancing existing plotlines and character arcs.`;
      break;
    }

    case "character-voice": {
      const character = ctx.characters.find((c) => c.id === extra.characterId);
      prompt = `You are a creative writing assistant helping a novelist develop character voice.

Here is the story context:
${storyContext}

${character ? `Focus on: ${character.name} — ${character.description}` : ""}

Provide a character voice guide:
1. Speech patterns (formal/informal, sentence length, verbal tics)
2. Vocabulary level and favorite expressions
3. How they speak differently under stress vs. at ease
4. 3 example dialogue lines that capture their voice
5. Words or phrases this character would NEVER say

Keep it practical and usable as a quick reference while writing.`;
      break;
    }

    case "pacing-check": {
      prompt = `You are a story structure analyst helping a novelist.

Here is the story context:
${storyContext}

Analyze the pacing of this story:
1. Identify where tension rises and falls across chapters
2. Flag any sections that feel too slow (multiple low-conflict scenes in a row)
3. Flag any sections that feel too rushed (major events crammed together)
4. Suggest specific scenes or beats that could be added/removed to improve flow
5. Note if the story follows a recognizable structure (three-act, hero's journey, etc.)

Be specific — reference actual scene titles and chapters.`;
      break;
    }
  }

  const result = await generateText({
    model,
    prompt,
    maxOutputTokens: 1024,
    temperature: 0.8,
  });

  return result.text;
}

import { beforeEach, expect, it, vi } from "vitest";
vi.mock("ai", () => ({ generateText: vi.fn() }));
vi.mock("@/lib/services/chatgpt", () => ({ runChatGpt: vi.fn() }));
import { generateText } from "ai";
import { runChatGpt } from "./chatgpt";
import { runAiFeature, type StoryContext } from "./ai";
const context: StoryContext = {
  bookTitle: "Synthetic lighthouse",
  chapters: [{ id: "chapter", title: "The first letter", sort_order: 0 }],
  plotlines: [],
  characters: [],
  scenes: [
    {
      id: "scene",
      title: "The letter",
      summary: "A retired lighthouse keeper receives a letter from tomorrow.",
      conflict: "Change the future or obey the letter",
      chapter_id: "chapter",
      plotline_id: "plot",
    },
  ],
};
beforeEach(() => {
  vi.resetAllMocks();
});
it("sends authorized Scene Ideas context to the explicitly selected ChatGPT connection", async () => {
  vi.mocked(runChatGpt).mockResolvedValue("Completed ideas");
  await expect(
    runAiFeature(
      "scene-ideas",
      context,
      { sceneId: "scene" },
      { provider: "chatgpt", userId: "owner", model: "selected-model" },
    ),
  ).resolves.toBe("Completed ideas");
  expect(runChatGpt).toHaveBeenCalledWith(
    "owner",
    "selected-model",
    expect.stringContaining("letter from tomorrow"),
  );
  expect(generateText).not.toHaveBeenCalled();
});
it("never falls back to Google after a ChatGPT failure", async () => {
  vi.mocked(runChatGpt).mockRejectedValue(
    new Error("ChatGPT plan allowance is unavailable"),
  );
  await expect(
    runAiFeature(
      "scene-ideas",
      context,
      {},
      { provider: "chatgpt", userId: "owner", model: "selected" },
    ),
  ).rejects.toThrow(/allowance/);
  expect(generateText).not.toHaveBeenCalled();
});
it("keeps the Google provider implementation available", async () => {
  vi.mocked(generateText).mockResolvedValue({
    text: "Google result",
  } as Awaited<ReturnType<typeof generateText>>);
  await expect(
    runAiFeature(
      "what-if",
      context,
      {},
      { provider: "google", userId: "owner" },
    ),
  ).resolves.toBe("Google result");
  expect(runChatGpt).not.toHaveBeenCalled();
});
it("rejects unsupported ChatGPT features without invoking either provider", async () => {
  await expect(
    runAiFeature(
      "pacing-check",
      context,
      {},
      { provider: "chatgpt", userId: "owner", model: "selected" },
    ),
  ).rejects.toThrow(/Scene Ideas only/);
  expect(runChatGpt).not.toHaveBeenCalled();
  expect(generateText).not.toHaveBeenCalled();
});

// @vitest-environment node
import { beforeEach, expect, it, vi } from "vitest";
vi.mock("@/lib/services/current-user", () => ({ currentUser: vi.fn() }));
vi.mock("@/lib/services/ai", () => ({ runAiFeature: vi.fn() }));
vi.mock("@/lib/services/timeline", () => ({ getTimelineData: vi.fn() }));
vi.mock("@/lib/services/books", () => ({ getBook: vi.fn() }));
vi.mock("@/lib/services/characters", () => ({ getCharacters: vi.fn() }));
vi.mock("@/lib/services/chatgpt", () => ({ checkLocalRequest: vi.fn() }));
import { currentUser } from "@/lib/services/current-user";
import { runAiFeature } from "@/lib/services/ai";
import { getTimelineData } from "@/lib/services/timeline";
import { getBook } from "@/lib/services/books";
import { getCharacters } from "@/lib/services/characters";
import { POST } from "./route";
const bookId = "00000000-0000-4000-8000-000000000001";
function request(body: Record<string, unknown>) {
  return new Request("http://127.0.0.1:3000/api/ai", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      bookId,
      feature: "scene-ideas",
      provider: "chatgpt",
      model: "available",
      ...body,
    }),
  });
}
beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(currentUser).mockResolvedValue({
    id: "user-a",
    email: "synthetic@example.invalid",
    user_metadata: {},
  });
  vi.mocked(getBook).mockResolvedValue({
    id: bookId,
    project_id: "project-a",
    title: "Tomorrow’s lighthouse",
  } as Awaited<ReturnType<typeof getBook>>);
  vi.mocked(getTimelineData).mockResolvedValue({
    chapters: [],
    plotlines: [],
    scenes: [],
  });
  vi.mocked(getCharacters).mockResolvedValue([]);
  vi.mocked(runAiFeature).mockResolvedValue("Three ideas");
});
it("requires a real Plotamour session before reading project context", async () => {
  vi.mocked(currentUser).mockResolvedValue(null);
  expect((await POST(request({}))).status).toBe(401);
  expect(getBook).not.toHaveBeenCalled();
  expect(runAiFeature).not.toHaveBeenCalled();
});
it("never infers when the RLS-backed book lookup denies access", async () => {
  vi.mocked(getBook).mockResolvedValue(null);
  expect((await POST(request({}))).status).toBe(404);
  expect(getCharacters).not.toHaveBeenCalled();
  expect(runAiFeature).not.toHaveBeenCalled();
});
it("binds provider credentials to the signed-in user, ignoring supplied identities", async () => {
  const response = await POST(request({ userId: "victim" }));
  expect(response.status).toBe(200);
  expect(runAiFeature).toHaveBeenCalledWith(
    "scene-ideas",
    expect.objectContaining({ bookTitle: "Tomorrow’s lighthouse" }),
    expect.anything(),
    { provider: "chatgpt", userId: "user-a", model: "available" },
  );
});
it("does not fallback after ChatGPT fails", async () => {
  vi.mocked(runAiFeature).mockRejectedValue(
    new Error("ChatGPT plan allowance is unavailable."),
  );
  expect((await POST(request({}))).status).toBe(503);
  expect(runAiFeature).toHaveBeenCalledTimes(1);
});
it("keeps the explicit Google path available", async () => {
  expect(
    (await POST(request({ provider: "google", feature: "what-if" }))).status,
  ).toBe(200);
  expect(runAiFeature).toHaveBeenCalledWith(
    "what-if",
    expect.anything(),
    expect.anything(),
    expect.objectContaining({ provider: "google" }),
  );
});
it("rejects unknown features, absent providers and cross-book scene IDs", async () => {
  expect((await POST(request({ feature: "anything" }))).status).toBe(400);
  expect((await POST(request({ provider: null }))).status).toBe(400);
  expect(
    (await POST(request({ sceneId: "00000000-0000-4000-8000-000000000002" })))
      .status,
  ).toBe(404);
  expect(runAiFeature).not.toHaveBeenCalled();
});

import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/timeline/route";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock("@/lib/services/timeline", () => ({
  addChapter: vi.fn(),
  updateChapter: vi.fn(),
  deleteChapter: vi.fn(),
  addPlotline: vi.fn(),
  updatePlotline: vi.fn(),
  deletePlotline: vi.fn(),
  reorderChapters: vi.fn(),
  reorderPlotlines: vi.fn(),
}));

vi.mock("@/lib/services/scenes", () => ({
  createScene: vi.fn(),
  updateScene: vi.fn(),
  deleteScene: vi.fn(),
  moveScene: vi.fn(),
}));

vi.mock("@/lib/config/constants", () => ({
  PLOTLINE_COLORS: ["#ef4444", "#f97316", "#eab308", "#22c55e"],
}));

import {
  addChapter,
  updateChapter,
  deleteChapter,
  addPlotline,
  updatePlotline,
  deletePlotline,
  reorderChapters,
  reorderPlotlines,
} from "@/lib/services/timeline";

import {
  createScene,
  updateScene,
  deleteScene,
  moveScene,
} from "@/lib/services/scenes";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeRequest(body: object): Request {
  return new Request("http://localhost/api/timeline", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// POST /api/timeline
// ---------------------------------------------------------------------------

describe("POST /api/timeline", () => {
  // -------------------------------------------------------------------------
  // addChapter
  // -------------------------------------------------------------------------

  it("addChapter — calls addChapter service and returns chapter", async () => {
    const chapter = { id: "ch-1", title: "Chapter 1", position: 0 };
    vi.mocked(addChapter).mockResolvedValue(chapter as any);

    const res = await POST(
      makeRequest({ action: "addChapter", bookId: "book-1", title: "Chapter 1" }),
    );

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(chapter);
    expect(addChapter).toHaveBeenCalledWith("book-1", "Chapter 1");
  });

  // -------------------------------------------------------------------------
  // updateChapter
  // -------------------------------------------------------------------------

  it("updateChapter — calls updateChapter service", async () => {
    const updated = { id: "ch-1", title: "Renamed" };
    vi.mocked(updateChapter).mockResolvedValue(updated as any);

    const res = await POST(
      makeRequest({ action: "updateChapter", id: "ch-1", title: "Renamed" }),
    );

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(updated);
    expect(updateChapter).toHaveBeenCalledWith("ch-1", { title: "Renamed" });
  });

  // -------------------------------------------------------------------------
  // deleteChapter
  // -------------------------------------------------------------------------

  it("deleteChapter — calls deleteChapter service", async () => {
    vi.mocked(deleteChapter).mockResolvedValue(undefined as any);

    const res = await POST(makeRequest({ action: "deleteChapter", id: "ch-1" }));

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    expect(deleteChapter).toHaveBeenCalledWith("ch-1");
  });

  // -------------------------------------------------------------------------
  // addPlotline
  // -------------------------------------------------------------------------

  it("addPlotline — uses PLOTLINE_COLORS for color based on colorIndex", async () => {
    const plotline = { id: "pl-1", title: "Subplot", color: "#f97316" };
    vi.mocked(addPlotline).mockResolvedValue(plotline as any);

    const res = await POST(
      makeRequest({ action: "addPlotline", bookId: "book-1", title: "Subplot", colorIndex: 1 }),
    );

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(plotline);
    expect(addPlotline).toHaveBeenCalledWith("book-1", "Subplot", "#f97316");
  });

  // -------------------------------------------------------------------------
  // addScene
  // -------------------------------------------------------------------------

  it("addScene — calls createScene with correct params", async () => {
    const scene = { id: "sc-1", title: "Opening", chapter_id: "ch-1", plotline_id: "pl-1" };
    vi.mocked(createScene).mockResolvedValue(scene as any);

    const res = await POST(
      makeRequest({
        action: "addScene",
        bookId: "book-1",
        chapterId: "ch-1",
        plotlineId: "pl-1",
        title: "Opening",
      }),
    );

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(scene);
    expect(createScene).toHaveBeenCalledWith({
      bookId: "book-1",
      chapterId: "ch-1",
      plotlineId: "pl-1",
      title: "Opening",
    });
  });

  // -------------------------------------------------------------------------
  // updateScene
  // -------------------------------------------------------------------------

  it("updateScene — calls updateScene with id and data", async () => {
    const updated = { id: "sc-1", title: "Revised Opening" };
    vi.mocked(updateScene).mockResolvedValue(updated as any);

    const res = await POST(
      makeRequest({ action: "updateScene", id: "sc-1", data: { title: "Revised Opening" } }),
    );

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(updated);
    expect(updateScene).toHaveBeenCalledWith("sc-1", { title: "Revised Opening" });
  });

  // -------------------------------------------------------------------------
  // deleteScene
  // -------------------------------------------------------------------------

  it("deleteScene — calls deleteScene service", async () => {
    vi.mocked(deleteScene).mockResolvedValue(undefined as any);

    const res = await POST(makeRequest({ action: "deleteScene", id: "sc-1" }));

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    expect(deleteScene).toHaveBeenCalledWith("sc-1");
  });

  // -------------------------------------------------------------------------
  // moveScene
  // -------------------------------------------------------------------------

  it("moveScene — calls moveScene with position defaulting to 0", async () => {
    vi.mocked(moveScene).mockResolvedValue(undefined as any);

    const res = await POST(
      makeRequest({ action: "moveScene", sceneId: "sc-1", chapterId: "ch-2", plotlineId: "pl-2" }),
    );

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    expect(moveScene).toHaveBeenCalledWith("sc-1", "ch-2", "pl-2", 0);
  });

  // -------------------------------------------------------------------------
  // Unknown action
  // -------------------------------------------------------------------------

  it("returns 400 for unknown action", async () => {
    const res = await POST(makeRequest({ action: "doSomethingWeird" }));

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "Unknown action" });
  });

  // -------------------------------------------------------------------------
  // Error handling
  // -------------------------------------------------------------------------

  it("returns 500 when a service function throws", async () => {
    vi.mocked(addChapter).mockRejectedValue(new Error("DB failure"));

    const res = await POST(
      makeRequest({ action: "addChapter", bookId: "book-1", title: "Boom" }),
    );

    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: "Internal error" });
  });
});

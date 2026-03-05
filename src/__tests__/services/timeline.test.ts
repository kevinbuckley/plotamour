import { describe, it, expect, vi, beforeEach } from "vitest";
import { mockQueryBuilder } from "../mocks/supabase";

// vi.hoisted runs before vi.mock hoisting, making mockClient available in the factory.
// We inline the mock client creation here since require() cannot resolve aliases.
const mockClient = vi.hoisted(() => {
  const mockFn = vi.fn;
  return {
    from: mockFn().mockReturnValue({
      select: mockFn().mockReturnThis(),
      insert: mockFn().mockReturnThis(),
      update: mockFn().mockReturnThis(),
      delete: mockFn().mockReturnThis(),
      upsert: mockFn().mockReturnThis(),
      eq: mockFn().mockReturnThis(),
      neq: mockFn().mockReturnThis(),
      is: mockFn().mockReturnThis(),
      in: mockFn().mockReturnThis(),
      order: mockFn().mockReturnThis(),
      limit: mockFn().mockReturnThis(),
      single: mockFn().mockReturnThis(),
      maybeSingle: mockFn().mockReturnThis(),
      then: (resolve: (v: unknown) => void, reject?: (r: unknown) => void) =>
        Promise.resolve({ data: null, error: null, count: null }).then(resolve, reject),
    }),
    auth: {
      getUser: mockFn().mockResolvedValue({
        data: { user: { id: "test-user-id" } },
        error: null,
      }),
    },
  };
});

vi.mock("@/lib/db/server", () => ({
  createClient: vi.fn().mockResolvedValue(mockClient),
}));

import {
  getTimelineData,
  addChapter,
  updateChapter,
  deleteChapter,
  addPlotline,
  updatePlotline,
  deletePlotline,
  reorderChapters,
  reorderPlotlines,
} from "@/lib/services/timeline";

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const mockChapter = {
  id: "ch-1",
  book_id: "book-1",
  title: "The Beginning",
  description: "",
  sort_order: 0,
  created_at: "2025-01-01T00:00:00Z",
  updated_at: "2025-06-15T12:00:00Z",
};

const mockChapterTwo = {
  ...mockChapter,
  id: "ch-2",
  title: "The Middle",
  sort_order: 1,
};

const mockPlotline = {
  id: "pl-1",
  book_id: "book-1",
  title: "Main Plot",
  color: "#6366f1",
  sort_order: 0,
  created_at: "2025-01-01T00:00:00Z",
  updated_at: "2025-06-15T12:00:00Z",
};

const mockPlotlineTwo = {
  ...mockPlotline,
  id: "pl-2",
  title: "Subplot",
  color: "#ef4444",
  sort_order: 1,
};

const mockGoogleDoc = {
  id: "doc-1",
  scene_id: "scene-1",
  google_doc_id: "gdoc-abc123",
  google_doc_url: "https://docs.google.com/document/d/abc123",
  word_count: 2500,
  last_synced_at: "2025-06-15T10:00:00Z",
  last_modified_at: "2025-06-15T09:30:00Z",
  writing_status: "in_progress" as const,
  created_at: "2025-01-01T00:00:00Z",
  updated_at: "2025-06-15T12:00:00Z",
};

const mockSceneRaw = {
  id: "scene-1",
  book_id: "book-1",
  chapter_id: "ch-1",
  plotline_id: "pl-1",
  title: "Opening Scene",
  summary: "The hero begins the journey",
  conflict: "Internal doubt",
  pov_character_id: null,
  position: 0,
  deleted_at: null,
  created_at: "2025-01-01T00:00:00Z",
  updated_at: "2025-06-15T12:00:00Z",
  scene_google_docs: [mockGoogleDoc],
};

const mockSceneNoDoc = {
  ...mockSceneRaw,
  id: "scene-2",
  title: "Second Scene",
  position: 1,
  scene_google_docs: [],
};

beforeEach(() => {
  vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// getTimelineData
// ---------------------------------------------------------------------------

describe("getTimelineData", () => {
  it("returns chapters, plotlines, and scenes with google_doc mapped", async () => {
    const mockChapters = [mockChapter, mockChapterTwo];
    const mockPlotlines = [mockPlotline, mockPlotlineTwo];
    const mockScenes = [mockSceneRaw, mockSceneNoDoc];

    mockClient.from
      .mockReturnValueOnce(mockQueryBuilder(mockChapters))
      .mockReturnValueOnce(mockQueryBuilder(mockPlotlines))
      .mockReturnValueOnce(mockQueryBuilder(mockScenes));

    const result = await getTimelineData("book-1");

    expect(result.chapters).toEqual(mockChapters);
    expect(result.plotlines).toEqual(mockPlotlines);
    expect(result.scenes).toHaveLength(2);

    // First scene has a google doc
    expect(result.scenes[0].google_doc).toEqual(mockGoogleDoc);
    // Second scene has no google doc
    expect(result.scenes[1].google_doc).toBeNull();

    expect(mockClient.from).toHaveBeenCalledTimes(3);
    expect(mockClient.from).toHaveBeenNthCalledWith(1, "chapters");
    expect(mockClient.from).toHaveBeenNthCalledWith(2, "plotlines");
    expect(mockClient.from).toHaveBeenNthCalledWith(3, "scenes");
  });

  it("handles scene_google_docs as a single object instead of array", async () => {
    const sceneWithObjectDoc = {
      ...mockSceneRaw,
      scene_google_docs: mockGoogleDoc, // single object, not array
    };

    mockClient.from
      .mockReturnValueOnce(mockQueryBuilder([mockChapter]))
      .mockReturnValueOnce(mockQueryBuilder([mockPlotline]))
      .mockReturnValueOnce(mockQueryBuilder([sceneWithObjectDoc]));

    const result = await getTimelineData("book-1");

    expect(result.scenes[0].google_doc).toEqual(mockGoogleDoc);
  });

  it("handles scene_google_docs as null", async () => {
    const sceneWithNullDoc = {
      ...mockSceneRaw,
      scene_google_docs: null,
    };

    mockClient.from
      .mockReturnValueOnce(mockQueryBuilder([mockChapter]))
      .mockReturnValueOnce(mockQueryBuilder([mockPlotline]))
      .mockReturnValueOnce(mockQueryBuilder([sceneWithNullDoc]));

    const result = await getTimelineData("book-1");

    expect(result.scenes[0].google_doc).toBeNull();
  });

  it("returns empty arrays when no data exists", async () => {
    mockClient.from
      .mockReturnValueOnce(mockQueryBuilder(null))
      .mockReturnValueOnce(mockQueryBuilder(null))
      .mockReturnValueOnce(mockQueryBuilder(null));

    const result = await getTimelineData("book-1");

    expect(result.chapters).toEqual([]);
    expect(result.plotlines).toEqual([]);
    expect(result.scenes).toEqual([]);
  });

  it("throws when chapters query fails", async () => {
    const dbError = { message: "Chapters query failed" };
    mockClient.from
      .mockReturnValueOnce(mockQueryBuilder(null, dbError))
      .mockReturnValueOnce(mockQueryBuilder([]))
      .mockReturnValueOnce(mockQueryBuilder([]));

    await expect(getTimelineData("book-1")).rejects.toEqual(dbError);
  });

  it("throws when plotlines query fails", async () => {
    const dbError = { message: "Plotlines query failed" };
    mockClient.from
      .mockReturnValueOnce(mockQueryBuilder([]))
      .mockReturnValueOnce(mockQueryBuilder(null, dbError))
      .mockReturnValueOnce(mockQueryBuilder([]));

    await expect(getTimelineData("book-1")).rejects.toEqual(dbError);
  });

  it("throws when scenes query fails", async () => {
    const dbError = { message: "Scenes query failed" };
    mockClient.from
      .mockReturnValueOnce(mockQueryBuilder([]))
      .mockReturnValueOnce(mockQueryBuilder([]))
      .mockReturnValueOnce(mockQueryBuilder(null, dbError));

    await expect(getTimelineData("book-1")).rejects.toEqual(dbError);
  });
});

// ---------------------------------------------------------------------------
// addChapter
// ---------------------------------------------------------------------------

describe("addChapter", () => {
  it("creates chapter at next sort_order", async () => {
    const existing = [{ sort_order: 2 }];
    const created = { ...mockChapter, sort_order: 3 };
    const insertBuilder = mockQueryBuilder(created);

    mockClient.from
      .mockReturnValueOnce(mockQueryBuilder(existing)) // get max sort_order
      .mockReturnValueOnce(insertBuilder); // insert chapter

    const result = await addChapter("book-1", "New Chapter");

    expect(result).toEqual(created);
    expect(insertBuilder.insert).toHaveBeenCalledWith({
      book_id: "book-1",
      title: "New Chapter",
      sort_order: 3,
    });
  });

  it("uses sort_order 0 when no existing chapters", async () => {
    const insertBuilder = mockQueryBuilder({ ...mockChapter, sort_order: 0 });

    mockClient.from
      .mockReturnValueOnce(mockQueryBuilder([])) // no existing
      .mockReturnValueOnce(insertBuilder);

    await addChapter("book-1", "First Chapter");

    expect(insertBuilder.insert).toHaveBeenCalledWith({
      book_id: "book-1",
      title: "First Chapter",
      sort_order: 0,
    });
  });

  it("uses sort_order 0 when existing data is null", async () => {
    const insertBuilder = mockQueryBuilder({ ...mockChapter, sort_order: 0 });

    mockClient.from
      .mockReturnValueOnce(mockQueryBuilder(null)) // null data
      .mockReturnValueOnce(insertBuilder);

    await addChapter("book-1", "First Chapter");

    expect(insertBuilder.insert).toHaveBeenCalledWith({
      book_id: "book-1",
      title: "First Chapter",
      sort_order: 0,
    });
  });

  it("throws when insert fails", async () => {
    const dbError = { message: "Insert failed" };
    mockClient.from
      .mockReturnValueOnce(mockQueryBuilder([{ sort_order: 0 }]))
      .mockReturnValueOnce(mockQueryBuilder(null, dbError));

    await expect(addChapter("book-1", "Bad Chapter")).rejects.toEqual(dbError);
  });
});

// ---------------------------------------------------------------------------
// updateChapter
// ---------------------------------------------------------------------------

describe("updateChapter", () => {
  it("updates chapter and returns updated data", async () => {
    const updated = { ...mockChapter, title: "Renamed Chapter" };
    mockClient.from.mockReturnValueOnce(mockQueryBuilder(updated));

    const result = await updateChapter("ch-1", { title: "Renamed Chapter" });

    expect(mockClient.from).toHaveBeenCalledWith("chapters");
    expect(result).toEqual(updated);
  });

  it("updates sort_order", async () => {
    const updated = { ...mockChapter, sort_order: 5 };
    const updateBuilder = mockQueryBuilder(updated);
    mockClient.from.mockReturnValueOnce(updateBuilder);

    const result = await updateChapter("ch-1", { sort_order: 5 });

    expect(updateBuilder.update).toHaveBeenCalledWith({ sort_order: 5 });
    expect(result).toEqual(updated);
  });

  it("throws when update fails", async () => {
    const dbError = { message: "Update failed" };
    mockClient.from.mockReturnValueOnce(mockQueryBuilder(null, dbError));

    await expect(updateChapter("ch-1", { title: "Bad" })).rejects.toEqual(dbError);
  });
});

// ---------------------------------------------------------------------------
// deleteChapter
// ---------------------------------------------------------------------------

describe("deleteChapter", () => {
  it("hard-deletes chapter", async () => {
    const deleteBuilder = mockQueryBuilder(null);
    mockClient.from.mockReturnValueOnce(deleteBuilder);

    await expect(deleteChapter("ch-1")).resolves.toBeUndefined();
    expect(mockClient.from).toHaveBeenCalledWith("chapters");
  });

  it("throws when delete fails", async () => {
    const dbError = { message: "Delete failed" };
    mockClient.from.mockReturnValueOnce(mockQueryBuilder(null, dbError));

    await expect(deleteChapter("ch-1")).rejects.toEqual(dbError);
  });
});

// ---------------------------------------------------------------------------
// addPlotline
// ---------------------------------------------------------------------------

describe("addPlotline", () => {
  it("creates plotline at next sort_order", async () => {
    const existing = [{ sort_order: 1 }];
    const created = { ...mockPlotline, id: "pl-new", sort_order: 2 };
    const insertBuilder = mockQueryBuilder(created);

    mockClient.from
      .mockReturnValueOnce(mockQueryBuilder(existing)) // get max sort_order
      .mockReturnValueOnce(insertBuilder); // insert plotline

    const result = await addPlotline("book-1", "Romance Arc", "#ec4899");

    expect(result).toEqual(created);
    expect(insertBuilder.insert).toHaveBeenCalledWith({
      book_id: "book-1",
      title: "Romance Arc",
      color: "#ec4899",
      sort_order: 2,
    });
  });

  it("uses sort_order 0 when no existing plotlines", async () => {
    const insertBuilder = mockQueryBuilder({ ...mockPlotline, sort_order: 0 });

    mockClient.from
      .mockReturnValueOnce(mockQueryBuilder([])) // no existing
      .mockReturnValueOnce(insertBuilder);

    await addPlotline("book-1", "Main Plot", "#6366f1");

    expect(insertBuilder.insert).toHaveBeenCalledWith({
      book_id: "book-1",
      title: "Main Plot",
      color: "#6366f1",
      sort_order: 0,
    });
  });

  it("uses sort_order 0 when existing data is null", async () => {
    const insertBuilder = mockQueryBuilder({ ...mockPlotline, sort_order: 0 });

    mockClient.from
      .mockReturnValueOnce(mockQueryBuilder(null)) // null data
      .mockReturnValueOnce(insertBuilder);

    await addPlotline("book-1", "Main Plot", "#6366f1");

    expect(insertBuilder.insert).toHaveBeenCalledWith({
      book_id: "book-1",
      title: "Main Plot",
      color: "#6366f1",
      sort_order: 0,
    });
  });

  it("throws when insert fails", async () => {
    const dbError = { message: "Insert failed" };
    mockClient.from
      .mockReturnValueOnce(mockQueryBuilder([{ sort_order: 0 }]))
      .mockReturnValueOnce(mockQueryBuilder(null, dbError));

    await expect(addPlotline("book-1", "Bad Plotline", "#000")).rejects.toEqual(dbError);
  });
});

// ---------------------------------------------------------------------------
// updatePlotline
// ---------------------------------------------------------------------------

describe("updatePlotline", () => {
  it("updates plotline and returns updated data", async () => {
    const updated = { ...mockPlotline, title: "Renamed Plotline" };
    mockClient.from.mockReturnValueOnce(mockQueryBuilder(updated));

    const result = await updatePlotline("pl-1", { title: "Renamed Plotline" });

    expect(mockClient.from).toHaveBeenCalledWith("plotlines");
    expect(result).toEqual(updated);
  });

  it("updates color", async () => {
    const updated = { ...mockPlotline, color: "#22c55e" };
    const updateBuilder = mockQueryBuilder(updated);
    mockClient.from.mockReturnValueOnce(updateBuilder);

    const result = await updatePlotline("pl-1", { color: "#22c55e" });

    expect(updateBuilder.update).toHaveBeenCalledWith({ color: "#22c55e" });
    expect(result).toEqual(updated);
  });

  it("throws when update fails", async () => {
    const dbError = { message: "Update failed" };
    mockClient.from.mockReturnValueOnce(mockQueryBuilder(null, dbError));

    await expect(updatePlotline("pl-1", { title: "Bad" })).rejects.toEqual(dbError);
  });
});

// ---------------------------------------------------------------------------
// deletePlotline
// ---------------------------------------------------------------------------

describe("deletePlotline", () => {
  it("hard-deletes plotline", async () => {
    const deleteBuilder = mockQueryBuilder(null);
    mockClient.from.mockReturnValueOnce(deleteBuilder);

    await expect(deletePlotline("pl-1")).resolves.toBeUndefined();
    expect(mockClient.from).toHaveBeenCalledWith("plotlines");
  });

  it("throws when delete fails", async () => {
    const dbError = { message: "Delete failed" };
    mockClient.from.mockReturnValueOnce(mockQueryBuilder(null, dbError));

    await expect(deletePlotline("pl-1")).rejects.toEqual(dbError);
  });
});

// ---------------------------------------------------------------------------
// reorderChapters
// ---------------------------------------------------------------------------

describe("reorderChapters", () => {
  it("updates sort_order for each chapter in order", async () => {
    const chapterIds = ["ch-3", "ch-1", "ch-2"];

    // Each chapter update is a separate from() call
    mockClient.from
      .mockReturnValueOnce(mockQueryBuilder(null))
      .mockReturnValueOnce(mockQueryBuilder(null))
      .mockReturnValueOnce(mockQueryBuilder(null));

    await reorderChapters("book-1", chapterIds);

    expect(mockClient.from).toHaveBeenCalledTimes(3);
    expect(mockClient.from).toHaveBeenNthCalledWith(1, "chapters");
    expect(mockClient.from).toHaveBeenNthCalledWith(2, "chapters");
    expect(mockClient.from).toHaveBeenNthCalledWith(3, "chapters");
  });

  it("handles empty array of chapter ids", async () => {
    await reorderChapters("book-1", []);

    // No from() calls should be made
    expect(mockClient.from).not.toHaveBeenCalled();
  });

  it("handles single chapter reorder", async () => {
    mockClient.from.mockReturnValueOnce(mockQueryBuilder(null));

    await reorderChapters("book-1", ["ch-1"]);

    expect(mockClient.from).toHaveBeenCalledTimes(1);
    expect(mockClient.from).toHaveBeenCalledWith("chapters");
  });
});

// ---------------------------------------------------------------------------
// reorderPlotlines
// ---------------------------------------------------------------------------

describe("reorderPlotlines", () => {
  it("updates sort_order for each plotline in order", async () => {
    const plotlineIds = ["pl-2", "pl-1"];

    mockClient.from
      .mockReturnValueOnce(mockQueryBuilder(null))
      .mockReturnValueOnce(mockQueryBuilder(null));

    await reorderPlotlines("book-1", plotlineIds);

    expect(mockClient.from).toHaveBeenCalledTimes(2);
    expect(mockClient.from).toHaveBeenNthCalledWith(1, "plotlines");
    expect(mockClient.from).toHaveBeenNthCalledWith(2, "plotlines");
  });

  it("handles empty array of plotline ids", async () => {
    await reorderPlotlines("book-1", []);

    expect(mockClient.from).not.toHaveBeenCalled();
  });

  it("handles single plotline reorder", async () => {
    mockClient.from.mockReturnValueOnce(mockQueryBuilder(null));

    await reorderPlotlines("book-1", ["pl-1"]);

    expect(mockClient.from).toHaveBeenCalledTimes(1);
    expect(mockClient.from).toHaveBeenCalledWith("plotlines");
  });
});

import { describe, it, expect, vi, beforeEach } from "vitest";

// vi.hoisted runs before vi.mock hoisting, so mockClient is available
// in the vi.mock factory. We inline the mock client creation to avoid
// ESM require() issues.
const { mockClient, mockQueryBuilder } = vi.hoisted(() => {
  function _mockQueryBuilder(
    data: unknown = null,
    error: unknown = null,
    count: number | null = null
  ) {
    const response = { data, error, count };
    const builder: Record<string, unknown> = {};
    const methods = [
      "select",
      "insert",
      "update",
      "delete",
      "upsert",
      "eq",
      "neq",
      "is",
      "in",
      "order",
      "limit",
      "single",
      "maybeSingle",
    ];
    for (const method of methods) {
      builder[method] = vi.fn().mockReturnValue(builder);
    }
    builder.then = (
      resolve: (value: typeof response) => void,
      reject?: (reason: unknown) => void
    ) => Promise.resolve(response).then(resolve, reject);
    return builder;
  }

  const _mockClient = {
    from: vi.fn().mockReturnValue(_mockQueryBuilder()),
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: "test-user-id" } },
        error: null,
      }),
    },
  };

  return { mockClient: _mockClient, mockQueryBuilder: _mockQueryBuilder };
});

vi.mock("@/lib/db/server", () => ({
  createClient: vi.fn().mockResolvedValue(mockClient),
}));

import {
  createScene,
  getScene,
  updateScene,
  deleteScene,
  moveScene,
} from "@/lib/services/scenes";

const mockScene = {
  id: "scene-1",
  book_id: "book-1",
  chapter_id: "ch-1",
  plotline_id: "pl-1",
  title: "Test Scene",
  summary: "",
  conflict: "",
  pov_character_id: null,
  position: 0,
  deleted_at: null,
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
};

beforeEach(() => {
  vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// createScene
// ---------------------------------------------------------------------------
describe("createScene", () => {
  it("calculates next position from existing scenes", async () => {
    const created = { ...mockScene, position: 3 };

    // First from() -> position query returns highest position = 2
    // Second from() -> insert returns the newly created scene
    mockClient.from
      .mockReturnValueOnce(mockQueryBuilder([{ position: 2 }]))
      .mockReturnValueOnce(mockQueryBuilder(created));

    const result = await createScene({
      bookId: "book-1",
      chapterId: "ch-1",
      plotlineId: "pl-1",
      title: "Test Scene",
    });

    expect(result).toEqual(created);
    expect(mockClient.from).toHaveBeenCalledTimes(2);
    expect(mockClient.from).toHaveBeenNthCalledWith(1, "scenes");
    expect(mockClient.from).toHaveBeenNthCalledWith(2, "scenes");
  });

  it("starts at position 0 when no existing scenes", async () => {
    const created = { ...mockScene, position: 0 };

    // No existing scenes -> empty array
    mockClient.from
      .mockReturnValueOnce(mockQueryBuilder([]))
      .mockReturnValueOnce(mockQueryBuilder(created));

    const result = await createScene({
      bookId: "book-1",
      chapterId: "ch-1",
      plotlineId: "pl-1",
      title: "Test Scene",
    });

    expect(result).toEqual(created);
    expect(result.position).toBe(0);
  });

  it("starts at position 0 when position query returns null data", async () => {
    const created = { ...mockScene, position: 0 };

    // Position query returns null data
    mockClient.from
      .mockReturnValueOnce(mockQueryBuilder(null))
      .mockReturnValueOnce(mockQueryBuilder(created));

    const result = await createScene({
      bookId: "book-1",
      chapterId: "ch-1",
      plotlineId: "pl-1",
      title: "Test Scene",
    });

    expect(result).toEqual(created);
    expect(result.position).toBe(0);
  });

  it("uses default title 'New Scene' when title not provided", async () => {
    const created = { ...mockScene, title: "New Scene", position: 0 };

    mockClient.from
      .mockReturnValueOnce(mockQueryBuilder([]))
      .mockReturnValueOnce(mockQueryBuilder(created));

    const result = await createScene({
      bookId: "book-1",
      chapterId: "ch-1",
      plotlineId: "pl-1",
    });

    expect(result.title).toBe("New Scene");
  });

  it("throws on insert error", async () => {
    const dbError = { message: "Insert failed", code: "23505" };

    mockClient.from
      .mockReturnValueOnce(mockQueryBuilder([]))
      .mockReturnValueOnce(mockQueryBuilder(null, dbError));

    await expect(
      createScene({
        bookId: "book-1",
        chapterId: "ch-1",
        plotlineId: "pl-1",
      })
    ).rejects.toEqual(dbError);
  });
});

// ---------------------------------------------------------------------------
// getScene
// ---------------------------------------------------------------------------
describe("getScene", () => {
  it("returns scene data", async () => {
    mockClient.from.mockReturnValueOnce(mockQueryBuilder(mockScene));

    const result = await getScene("scene-1");

    expect(result).toEqual(mockScene);
    expect(mockClient.from).toHaveBeenCalledWith("scenes");
  });

  it("returns null when not found", async () => {
    mockClient.from.mockReturnValueOnce(
      mockQueryBuilder(null, { message: "Row not found", code: "PGRST116" })
    );

    const result = await getScene("nonexistent");

    expect(result).toBeNull();
  });

  it("returns null on any error", async () => {
    mockClient.from.mockReturnValueOnce(
      mockQueryBuilder(null, { message: "Something went wrong" })
    );

    const result = await getScene("scene-1");

    expect(result).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// updateScene
// ---------------------------------------------------------------------------
describe("updateScene", () => {
  it("updates and returns scene", async () => {
    const updated = { ...mockScene, title: "Updated Title" };
    mockClient.from.mockReturnValueOnce(mockQueryBuilder(updated));

    const result = await updateScene("scene-1", { title: "Updated Title" });

    expect(result).toEqual(updated);
    expect(mockClient.from).toHaveBeenCalledWith("scenes");
  });

  it("updates multiple fields", async () => {
    const updated = {
      ...mockScene,
      title: "New Title",
      summary: "A summary",
      conflict: "A conflict",
      pov_character_id: "char-1",
    };
    mockClient.from.mockReturnValueOnce(mockQueryBuilder(updated));

    const result = await updateScene("scene-1", {
      title: "New Title",
      summary: "A summary",
      conflict: "A conflict",
      pov_character_id: "char-1",
    });

    expect(result).toEqual(updated);
  });

  it("throws on error", async () => {
    const dbError = { message: "Update failed" };
    mockClient.from.mockReturnValueOnce(mockQueryBuilder(null, dbError));

    await expect(
      updateScene("scene-1", { title: "Updated Title" })
    ).rejects.toEqual(dbError);
  });
});

// ---------------------------------------------------------------------------
// deleteScene
// ---------------------------------------------------------------------------
describe("deleteScene", () => {
  it("soft deletes with current timestamp", async () => {
    const now = "2024-06-15T12:00:00.000Z";
    vi.spyOn(Date.prototype, "toISOString").mockReturnValue(now);

    mockClient.from.mockReturnValueOnce(mockQueryBuilder(null));

    await deleteScene("scene-1");

    expect(mockClient.from).toHaveBeenCalledWith("scenes");

    vi.restoreAllMocks();
  });

  it("resolves without returning a value", async () => {
    mockClient.from.mockReturnValueOnce(mockQueryBuilder(null));

    await expect(deleteScene("scene-1")).resolves.toBeUndefined();
  });

  it("throws on error", async () => {
    const dbError = { message: "Delete failed" };
    mockClient.from.mockReturnValueOnce(mockQueryBuilder(null, dbError));

    await expect(deleteScene("scene-1")).rejects.toEqual(dbError);
  });
});

// ---------------------------------------------------------------------------
// moveScene
// ---------------------------------------------------------------------------
describe("moveScene", () => {
  it("updates chapter, plotline, and position", async () => {
    mockClient.from.mockReturnValueOnce(mockQueryBuilder(null));

    await moveScene("scene-1", "ch-2", "pl-2", 5);

    expect(mockClient.from).toHaveBeenCalledWith("scenes");
  });

  it("resolves without returning a value", async () => {
    mockClient.from.mockReturnValueOnce(mockQueryBuilder(null));

    await expect(
      moveScene("scene-1", "ch-2", "pl-2", 5)
    ).resolves.toBeUndefined();
  });

  it("throws on error", async () => {
    const dbError = { message: "Move failed" };
    mockClient.from.mockReturnValueOnce(mockQueryBuilder(null, dbError));

    await expect(moveScene("scene-1", "ch-2", "pl-2", 5)).rejects.toEqual(
      dbError
    );
  });
});

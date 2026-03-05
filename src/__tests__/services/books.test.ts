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
  getBooks,
  getBook,
  createBook,
  updateBook,
  deleteBook,
  getBookStats,
} from "@/lib/services/books";

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const mockBook = {
  id: "book-1",
  project_id: "proj-1",
  title: "The Fellowship",
  description: "First volume",
  cover_image_url: null,
  sort_order: 0,
  deleted_at: null,
  created_at: "2025-01-01T00:00:00Z",
  updated_at: "2025-06-15T12:00:00Z",
};

const mockBookTwo = {
  ...mockBook,
  id: "book-2",
  title: "The Two Towers",
  sort_order: 1,
};

beforeEach(() => {
  vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// getBooks
// ---------------------------------------------------------------------------

describe("getBooks", () => {
  it("returns all non-deleted books for a project ordered by sort_order", async () => {
    const books = [mockBook, mockBookTwo];
    mockClient.from.mockReturnValueOnce(mockQueryBuilder(books));

    const result = await getBooks("proj-1");

    expect(mockClient.from).toHaveBeenCalledWith("books");
    expect(result).toEqual(books);
  });

  it("returns empty array when data is null", async () => {
    mockClient.from.mockReturnValueOnce(mockQueryBuilder(null));

    const result = await getBooks("proj-1");

    expect(result).toEqual([]);
  });

  it("throws when supabase returns an error", async () => {
    const dbError = { message: "Connection lost", code: "PGRST000" };
    mockClient.from.mockReturnValueOnce(mockQueryBuilder(null, dbError));

    await expect(getBooks("proj-1")).rejects.toEqual(dbError);
  });
});

// ---------------------------------------------------------------------------
// getBook
// ---------------------------------------------------------------------------

describe("getBook", () => {
  it("returns a single book by id", async () => {
    mockClient.from.mockReturnValueOnce(mockQueryBuilder(mockBook));

    const result = await getBook("book-1");

    expect(mockClient.from).toHaveBeenCalledWith("books");
    expect(result).toEqual(mockBook);
  });

  it("returns null when book is not found", async () => {
    mockClient.from.mockReturnValueOnce(
      mockQueryBuilder(null, { message: "Row not found", code: "PGRST116" })
    );

    const result = await getBook("nonexistent");

    expect(result).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// createBook
// ---------------------------------------------------------------------------

describe("createBook", () => {
  it("creates book with default chapters and plotline at next sort order", async () => {
    const existingBooks = [{ sort_order: 1 }];
    const createdBook = { ...mockBook, sort_order: 2 };
    const sortOrderBuilder = mockQueryBuilder(existingBooks);
    const bookInsertBuilder = mockQueryBuilder(createdBook);

    mockClient.from
      .mockReturnValueOnce(sortOrderBuilder) // get max sort_order
      .mockReturnValueOnce(bookInsertBuilder) // insert book
      .mockReturnValueOnce(mockQueryBuilder(null)) // insert chapters
      .mockReturnValueOnce(mockQueryBuilder(null)); // insert plotline

    const result = await createBook("proj-1", { title: "The Fellowship" });

    expect(result).toEqual(createdBook);

    // Verify all 4 from() calls
    expect(mockClient.from).toHaveBeenCalledTimes(4);
    expect(mockClient.from).toHaveBeenNthCalledWith(1, "books"); // sort_order query
    expect(mockClient.from).toHaveBeenNthCalledWith(2, "books"); // insert book
    expect(mockClient.from).toHaveBeenNthCalledWith(3, "chapters"); // insert chapters
    expect(mockClient.from).toHaveBeenNthCalledWith(4, "plotlines"); // insert plotline
  });

  it("uses sort_order 0 when no existing books", async () => {
    const bookInsertBuilder = mockQueryBuilder({ ...mockBook, sort_order: 0 });
    mockClient.from
      .mockReturnValueOnce(mockQueryBuilder([])) // no existing books
      .mockReturnValueOnce(bookInsertBuilder) // insert book
      .mockReturnValueOnce(mockQueryBuilder(null)) // insert chapters
      .mockReturnValueOnce(mockQueryBuilder(null)); // insert plotline

    await createBook("proj-1", { title: "First Book" });

    expect(bookInsertBuilder.insert).toHaveBeenCalledWith({
      project_id: "proj-1",
      title: "First Book",
      description: "",
      sort_order: 0,
    });
  });

  it("uses sort_order 0 when existing data is null", async () => {
    const bookInsertBuilder = mockQueryBuilder({ ...mockBook, sort_order: 0 });
    mockClient.from
      .mockReturnValueOnce(mockQueryBuilder(null)) // null data
      .mockReturnValueOnce(bookInsertBuilder) // insert book
      .mockReturnValueOnce(mockQueryBuilder(null)) // insert chapters
      .mockReturnValueOnce(mockQueryBuilder(null)); // insert plotline

    await createBook("proj-1", { title: "First Book" });

    expect(bookInsertBuilder.insert).toHaveBeenCalledWith({
      project_id: "proj-1",
      title: "First Book",
      description: "",
      sort_order: 0,
    });
  });

  it("throws when book insert fails", async () => {
    const bookError = { message: "Insert failed" };
    mockClient.from
      .mockReturnValueOnce(mockQueryBuilder([{ sort_order: 0 }]))
      .mockReturnValueOnce(mockQueryBuilder(null, bookError));

    await expect(createBook("proj-1", { title: "Bad Book" })).rejects.toEqual(bookError);
  });

  it("throws when chapters insert fails", async () => {
    const chaptersError = { message: "Chapters insert failed" };
    mockClient.from
      .mockReturnValueOnce(mockQueryBuilder([{ sort_order: 0 }]))
      .mockReturnValueOnce(mockQueryBuilder(mockBook))
      .mockReturnValueOnce(mockQueryBuilder(null, chaptersError));

    await expect(createBook("proj-1", { title: "Bad Book" })).rejects.toEqual(chaptersError);
  });

  it("throws when plotline insert fails", async () => {
    const plotlineError = { message: "Plotline insert failed" };
    mockClient.from
      .mockReturnValueOnce(mockQueryBuilder([{ sort_order: 0 }]))
      .mockReturnValueOnce(mockQueryBuilder(mockBook))
      .mockReturnValueOnce(mockQueryBuilder(null))
      .mockReturnValueOnce(mockQueryBuilder(null, plotlineError));

    await expect(createBook("proj-1", { title: "Bad Book" })).rejects.toEqual(plotlineError);
  });

  it("passes optional description when provided", async () => {
    const bookInsertBuilder = mockQueryBuilder(mockBook);
    mockClient.from
      .mockReturnValueOnce(mockQueryBuilder([]))
      .mockReturnValueOnce(bookInsertBuilder)
      .mockReturnValueOnce(mockQueryBuilder(null))
      .mockReturnValueOnce(mockQueryBuilder(null));

    await createBook("proj-1", { title: "My Book", description: "Epic tale" });

    expect(bookInsertBuilder.insert).toHaveBeenCalledWith({
      project_id: "proj-1",
      title: "My Book",
      description: "Epic tale",
      sort_order: 0,
    });
  });
});

// ---------------------------------------------------------------------------
// updateBook
// ---------------------------------------------------------------------------

describe("updateBook", () => {
  it("updates book and returns updated data", async () => {
    const updated = { ...mockBook, title: "Renamed Book" };
    mockClient.from.mockReturnValueOnce(mockQueryBuilder(updated));

    const result = await updateBook("book-1", { title: "Renamed Book" });

    expect(mockClient.from).toHaveBeenCalledWith("books");
    expect(result).toEqual(updated);
  });

  it("updates sort_order", async () => {
    const updated = { ...mockBook, sort_order: 5 };
    const updateBuilder = mockQueryBuilder(updated);
    mockClient.from.mockReturnValueOnce(updateBuilder);

    const result = await updateBook("book-1", { sort_order: 5 });

    expect(updateBuilder.update).toHaveBeenCalledWith({ sort_order: 5 });
    expect(result).toEqual(updated);
  });

  it("throws when update fails", async () => {
    const dbError = { message: "Update failed" };
    mockClient.from.mockReturnValueOnce(mockQueryBuilder(null, dbError));

    await expect(updateBook("book-1", { title: "Bad" })).rejects.toEqual(dbError);
  });
});

// ---------------------------------------------------------------------------
// deleteBook
// ---------------------------------------------------------------------------

describe("deleteBook", () => {
  it("soft-deletes book by setting deleted_at", async () => {
    mockClient.from.mockReturnValueOnce(mockQueryBuilder(null));

    await expect(deleteBook("book-1")).resolves.toBeUndefined();
    expect(mockClient.from).toHaveBeenCalledWith("books");
  });

  it("throws when soft delete fails", async () => {
    const dbError = { message: "Delete failed" };
    mockClient.from.mockReturnValueOnce(mockQueryBuilder(null, dbError));

    await expect(deleteBook("book-1")).rejects.toEqual(dbError);
  });
});

// ---------------------------------------------------------------------------
// getBookStats
// ---------------------------------------------------------------------------

describe("getBookStats", () => {
  it("returns chapter count, scene count, and word count", async () => {
    const docsData = [
      { word_count: 1500, scenes: { book_id: "book-1" } },
      { word_count: 2300, scenes: { book_id: "book-1" } },
      { word_count: 800, scenes: { book_id: "book-1" } },
    ];

    mockClient.from
      .mockReturnValueOnce(mockQueryBuilder(null, null, 12)) // chapters count
      .mockReturnValueOnce(mockQueryBuilder(null, null, 35)) // scenes count
      .mockReturnValueOnce(mockQueryBuilder(docsData)); // word count docs

    const result = await getBookStats("book-1");

    expect(result).toEqual({
      chapterCount: 12,
      sceneCount: 35,
      wordCount: 4600,
    });

    expect(mockClient.from).toHaveBeenCalledTimes(3);
    expect(mockClient.from).toHaveBeenNthCalledWith(1, "chapters");
    expect(mockClient.from).toHaveBeenNthCalledWith(2, "scenes");
    expect(mockClient.from).toHaveBeenNthCalledWith(3, "scene_google_docs");
  });

  it("returns zeros when all counts are null", async () => {
    mockClient.from
      .mockReturnValueOnce(mockQueryBuilder(null, null, null)) // chapters
      .mockReturnValueOnce(mockQueryBuilder(null, null, null)) // scenes
      .mockReturnValueOnce(mockQueryBuilder(null)); // docs

    const result = await getBookStats("book-1");

    expect(result).toEqual({
      chapterCount: 0,
      sceneCount: 0,
      wordCount: 0,
    });
  });

  it("handles docs with null word_count values", async () => {
    const docsData = [
      { word_count: 1000, scenes: { book_id: "book-1" } },
      { word_count: null, scenes: { book_id: "book-1" } },
      { word_count: 500, scenes: { book_id: "book-1" } },
    ];

    mockClient.from
      .mockReturnValueOnce(mockQueryBuilder(null, null, 3))
      .mockReturnValueOnce(mockQueryBuilder(null, null, 5))
      .mockReturnValueOnce(mockQueryBuilder(docsData));

    const result = await getBookStats("book-1");

    expect(result).toEqual({
      chapterCount: 3,
      sceneCount: 5,
      wordCount: 1500,
    });
  });

  it("returns zero word count when docs data is empty array", async () => {
    mockClient.from
      .mockReturnValueOnce(mockQueryBuilder(null, null, 2))
      .mockReturnValueOnce(mockQueryBuilder(null, null, 8))
      .mockReturnValueOnce(mockQueryBuilder([]));

    const result = await getBookStats("book-1");

    expect(result).toEqual({
      chapterCount: 2,
      sceneCount: 8,
      wordCount: 0,
    });
  });
});

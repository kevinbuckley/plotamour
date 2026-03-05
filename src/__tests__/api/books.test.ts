import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/books/route";
import {
  getBooks,
  createBook,
  updateBook,
  deleteBook,
  getBookStats,
} from "@/lib/services/books";

vi.mock("@/lib/services/books", () => ({
  getBooks: vi.fn(),
  createBook: vi.fn(),
  updateBook: vi.fn(),
  deleteBook: vi.fn(),
  getBookStats: vi.fn(),
}));

function makeRequest(body: object): Request {
  return new Request("http://localhost/api/books", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("POST /api/books", () => {
  describe("action: list", () => {
    it("returns books for a project", async () => {
      const mockBooks = [
        { id: "b1", title: "Book One" },
        { id: "b2", title: "Book Two" },
      ];
      vi.mocked(getBooks).mockResolvedValue(mockBooks as any);

      const res = await POST(
        makeRequest({ action: "list", projectId: "p1" })
      );
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json).toEqual(mockBooks);
      expect(getBooks).toHaveBeenCalledWith("p1");
    });

    it("returns 400 when projectId is missing", async () => {
      const res = await POST(makeRequest({ action: "list" }));
      const json = await res.json();

      expect(res.status).toBe(400);
      expect(json).toEqual({ error: "projectId required" });
      expect(getBooks).not.toHaveBeenCalled();
    });
  });

  describe("action: create", () => {
    it("creates a book with trimmed title", async () => {
      const mockBook = { id: "b1", title: "My Novel", projectId: "p1" };
      vi.mocked(createBook).mockResolvedValue(mockBook as any);

      const res = await POST(
        makeRequest({
          action: "create",
          projectId: "p1",
          title: "  My Novel  ",
          description: "  A great story  ",
        })
      );
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json).toEqual(mockBook);
      expect(createBook).toHaveBeenCalledWith("p1", {
        title: "My Novel",
        description: "A great story",
      });
    });

    it("returns 400 when projectId is missing", async () => {
      const res = await POST(
        makeRequest({ action: "create", title: "My Novel" })
      );
      const json = await res.json();

      expect(res.status).toBe(400);
      expect(json).toEqual({ error: "projectId and title required" });
      expect(createBook).not.toHaveBeenCalled();
    });

    it("returns 400 when title is missing", async () => {
      const res = await POST(
        makeRequest({ action: "create", projectId: "p1" })
      );
      const json = await res.json();

      expect(res.status).toBe(400);
      expect(json).toEqual({ error: "projectId and title required" });
      expect(createBook).not.toHaveBeenCalled();
    });

    it("returns 400 when title is whitespace only", async () => {
      const res = await POST(
        makeRequest({ action: "create", projectId: "p1", title: "   " })
      );
      const json = await res.json();

      expect(res.status).toBe(400);
      expect(json).toEqual({ error: "projectId and title required" });
      expect(createBook).not.toHaveBeenCalled();
    });
  });

  describe("action: update", () => {
    it("updates a book", async () => {
      const mockUpdated = { id: "b1", title: "Updated Title" };
      vi.mocked(updateBook).mockResolvedValue(mockUpdated as any);

      const res = await POST(
        makeRequest({
          action: "update",
          id: "b1",
          title: "Updated Title",
          description: "New desc",
          sort_order: 2,
        })
      );
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json).toEqual(mockUpdated);
      expect(updateBook).toHaveBeenCalledWith("b1", {
        title: "Updated Title",
        description: "New desc",
        sort_order: 2,
      });
    });

    it("returns 400 when id is missing", async () => {
      const res = await POST(
        makeRequest({ action: "update", title: "Updated" })
      );
      const json = await res.json();

      expect(res.status).toBe(400);
      expect(json).toEqual({ error: "id required" });
      expect(updateBook).not.toHaveBeenCalled();
    });
  });

  describe("action: delete", () => {
    it("deletes a book and returns success", async () => {
      vi.mocked(deleteBook).mockResolvedValue(undefined as any);

      const res = await POST(
        makeRequest({ action: "delete", id: "b1" })
      );
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json).toEqual({ success: true });
      expect(deleteBook).toHaveBeenCalledWith("b1");
    });

    it("returns 400 when id is missing", async () => {
      const res = await POST(makeRequest({ action: "delete" }));
      const json = await res.json();

      expect(res.status).toBe(400);
      expect(json).toEqual({ error: "id required" });
      expect(deleteBook).not.toHaveBeenCalled();
    });
  });

  describe("action: stats", () => {
    it("returns stats for a book", async () => {
      const mockStats = { scenes: 10, words: 5000 };
      vi.mocked(getBookStats).mockResolvedValue(mockStats as any);

      const res = await POST(
        makeRequest({ action: "stats", bookId: "b1" })
      );
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json).toEqual(mockStats);
      expect(getBookStats).toHaveBeenCalledWith("b1");
    });

    it("returns 400 when bookId is missing", async () => {
      const res = await POST(makeRequest({ action: "stats" }));
      const json = await res.json();

      expect(res.status).toBe(400);
      expect(json).toEqual({ error: "bookId required" });
      expect(getBookStats).not.toHaveBeenCalled();
    });
  });

  describe("unknown action", () => {
    it("returns 400 for an unknown action", async () => {
      const res = await POST(
        makeRequest({ action: "doesNotExist" })
      );
      const json = await res.json();

      expect(res.status).toBe(400);
      expect(json).toEqual({ error: "Unknown action" });
    });
  });

  describe("error handling", () => {
    it("returns 500 when a service throws", async () => {
      vi.mocked(getBooks).mockRejectedValue(new Error("DB down"));

      const res = await POST(
        makeRequest({ action: "list", projectId: "p1" })
      );
      const json = await res.json();

      expect(res.status).toBe(500);
      expect(json).toEqual({ error: "Internal server error" });
    });
  });
});

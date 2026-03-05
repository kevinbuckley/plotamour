import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/notes/route";
import {
  getNotes,
  createNote,
  updateNote,
  deleteNote,
  getNoteCategories,
} from "@/lib/services/notes";

vi.mock("@/lib/services/notes", () => ({
  getNotes: vi.fn(),
  createNote: vi.fn(),
  updateNote: vi.fn(),
  deleteNote: vi.fn(),
  getNoteCategories: vi.fn(),
}));

function makeRequest(body: object): Request {
  return new Request("http://localhost/api/notes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("POST /api/notes", () => {
  describe("action: list", () => {
    it("returns notes for a project", async () => {
      const mockNotes = [
        { id: "n1", title: "Note One" },
        { id: "n2", title: "Note Two" },
      ];
      vi.mocked(getNotes).mockResolvedValue(mockNotes as any);

      const res = await POST(
        makeRequest({ action: "list", projectId: "p1" })
      );
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json).toEqual(mockNotes);
      expect(getNotes).toHaveBeenCalledWith("p1");
    });
  });

  describe("action: create", () => {
    it("creates a note", async () => {
      const mockNote = {
        id: "n1",
        title: "Research",
        category: "worldbuilding",
        projectId: "p1",
      };
      vi.mocked(createNote).mockResolvedValue(mockNote as any);

      const res = await POST(
        makeRequest({
          action: "create",
          projectId: "p1",
          title: "Research",
          category: "worldbuilding",
        })
      );
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json).toEqual(mockNote);
      expect(createNote).toHaveBeenCalledWith({
        projectId: "p1",
        title: "Research",
        category: "worldbuilding",
      });
    });
  });

  describe("action: update", () => {
    it("updates a note", async () => {
      const mockUpdated = { id: "n1", title: "Updated Research" };
      vi.mocked(updateNote).mockResolvedValue(mockUpdated as any);

      const data = { title: "Updated Research" };
      const res = await POST(
        makeRequest({ action: "update", id: "n1", data })
      );
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json).toEqual(mockUpdated);
      expect(updateNote).toHaveBeenCalledWith("n1", data);
    });
  });

  describe("action: delete", () => {
    it("deletes a note and returns ok", async () => {
      vi.mocked(deleteNote).mockResolvedValue(undefined as any);

      const res = await POST(
        makeRequest({ action: "delete", id: "n1" })
      );
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json).toEqual({ ok: true });
      expect(deleteNote).toHaveBeenCalledWith("n1");
    });
  });

  describe("action: categories", () => {
    it("returns note categories for a project", async () => {
      const mockCategories = ["worldbuilding", "character", "plot"];
      vi.mocked(getNoteCategories).mockResolvedValue(mockCategories as any);

      const res = await POST(
        makeRequest({ action: "categories", projectId: "p1" })
      );
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json).toEqual(mockCategories);
      expect(getNoteCategories).toHaveBeenCalledWith("p1");
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
      vi.mocked(getNotes).mockRejectedValue(new Error("DB down"));

      const res = await POST(
        makeRequest({ action: "list", projectId: "p1" })
      );
      const json = await res.json();

      expect(res.status).toBe(500);
      expect(json).toEqual({ error: "Internal error" });
    });
  });
});

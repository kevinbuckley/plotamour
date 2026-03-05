import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/google-docs/route";
import {
  createDocForScene,
  getDocForScene,
  syncDocMetadata,
} from "@/lib/services/google-docs";
import { getScene } from "@/lib/services/scenes";

const { mockFrom } = vi.hoisted(() => {
  return { mockFrom: vi.fn() };
});

vi.mock("@/lib/services/google-docs", () => ({
  createDocForScene: vi.fn(),
  getDocForScene: vi.fn(),
  syncDocMetadata: vi.fn(),
}));

vi.mock("@/lib/services/scenes", () => ({
  getScene: vi.fn(),
}));

vi.mock("@/lib/db/server", () => ({
  createClient: vi.fn().mockResolvedValue({ from: mockFrom }),
}));

function makeRequest(body: object): Request {
  return new Request("http://localhost/api/google-docs", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("POST /api/google-docs", () => {
  describe("action: createDoc", () => {
    const mockScene = {
      id: "scene-1",
      title: "Opening Scene",
      book_id: "book-1",
      chapter_id: "ch-2",
      summary: "The story begins",
    };

    function setupSupabaseMocks() {
      // Mock books query: .from("books").select("title").eq("id", ...).single()
      const bookChain = {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { title: "My Novel" },
            }),
          }),
        }),
      };

      // Mock chapters query: .from("chapters").select("id, sort_order").eq("book_id", ...).order(...)
      const chaptersChain = {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: [
                { id: "ch-1", sort_order: 0 },
                { id: "ch-2", sort_order: 1 },
                { id: "ch-3", sort_order: 2 },
              ],
            }),
          }),
        }),
      };

      mockFrom.mockImplementation((table: string) => {
        if (table === "books") return bookChain;
        if (table === "chapters") return chaptersChain;
        return {};
      });
    }

    it("creates a Google Doc for a scene", async () => {
      vi.mocked(getScene).mockResolvedValue(mockScene as any);
      setupSupabaseMocks();

      const mockDoc = {
        id: "doc-1",
        scene_id: "scene-1",
        google_doc_url: "https://docs.google.com/document/d/abc123",
      };
      vi.mocked(createDocForScene).mockResolvedValue(mockDoc as any);

      const res = await POST(
        makeRequest({ action: "createDoc", sceneId: "scene-1" })
      );
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json).toEqual({
        url: "https://docs.google.com/document/d/abc123",
        doc: mockDoc,
      });
      expect(getScene).toHaveBeenCalledWith("scene-1");
      expect(createDocForScene).toHaveBeenCalledWith({
        sceneId: "scene-1",
        bookTitle: "My Novel",
        chapterNumber: 2,
        sceneTitle: "Opening Scene",
        summary: "The story begins",
      });
    });

    it("returns 404 when scene is not found", async () => {
      vi.mocked(getScene).mockResolvedValue(null);

      const res = await POST(
        makeRequest({ action: "createDoc", sceneId: "nonexistent" })
      );
      const json = await res.json();

      expect(res.status).toBe(404);
      expect(json).toEqual({ error: "Scene not found" });
      expect(createDocForScene).not.toHaveBeenCalled();
    });

    it("returns 400 when createDocForScene returns null", async () => {
      vi.mocked(getScene).mockResolvedValue(mockScene as any);
      setupSupabaseMocks();
      vi.mocked(createDocForScene).mockResolvedValue(null);

      const res = await POST(
        makeRequest({ action: "createDoc", sceneId: "scene-1" })
      );
      const json = await res.json();

      expect(res.status).toBe(400);
      expect(json).toEqual({
        error: "Failed to create Google Doc. Make sure Google Docs access is authorized.",
      });
    });

    it("uses 'Untitled' when book title is not available", async () => {
      vi.mocked(getScene).mockResolvedValue(mockScene as any);

      // Book query returns null data
      const bookChain = {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null }),
          }),
        }),
      };
      const chaptersChain = {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: [{ id: "ch-2", sort_order: 0 }],
            }),
          }),
        }),
      };
      mockFrom.mockImplementation((table: string) => {
        if (table === "books") return bookChain;
        if (table === "chapters") return chaptersChain;
        return {};
      });

      vi.mocked(createDocForScene).mockResolvedValue({
        id: "doc-1",
        google_doc_url: "https://docs.google.com/document/d/abc",
      } as any);

      const res = await POST(
        makeRequest({ action: "createDoc", sceneId: "scene-1" })
      );

      expect(res.status).toBe(200);
      expect(createDocForScene).toHaveBeenCalledWith(
        expect.objectContaining({ bookTitle: "Untitled" })
      );
    });

    it("passes undefined summary when scene has no summary", async () => {
      const sceneNoSummary = { ...mockScene, summary: "" };
      vi.mocked(getScene).mockResolvedValue(sceneNoSummary as any);
      setupSupabaseMocks();

      vi.mocked(createDocForScene).mockResolvedValue({
        id: "doc-1",
        google_doc_url: "https://docs.google.com/document/d/abc",
      } as any);

      await POST(makeRequest({ action: "createDoc", sceneId: "scene-1" }));

      expect(createDocForScene).toHaveBeenCalledWith(
        expect.objectContaining({ summary: undefined })
      );
    });
  });

  describe("action: syncDoc", () => {
    it("syncs document metadata", async () => {
      const mockDoc = { id: "doc-1", scene_id: "scene-1", word_count: 1500 };
      vi.mocked(syncDocMetadata).mockResolvedValue(mockDoc as any);

      const res = await POST(
        makeRequest({ action: "syncDoc", sceneId: "scene-1" })
      );
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json).toEqual({ doc: mockDoc });
      expect(syncDocMetadata).toHaveBeenCalledWith("scene-1");
    });
  });

  describe("action: getDoc", () => {
    it("returns a document for a scene", async () => {
      const mockDoc = {
        id: "doc-1",
        scene_id: "scene-1",
        google_doc_url: "https://docs.google.com/document/d/abc",
      };
      vi.mocked(getDocForScene).mockResolvedValue(mockDoc as any);

      const res = await POST(
        makeRequest({ action: "getDoc", sceneId: "scene-1" })
      );
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json).toEqual({ doc: mockDoc });
      expect(getDocForScene).toHaveBeenCalledWith("scene-1");
    });

    it("returns null doc when no document exists", async () => {
      vi.mocked(getDocForScene).mockResolvedValue(null);

      const res = await POST(
        makeRequest({ action: "getDoc", sceneId: "scene-1" })
      );
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json).toEqual({ doc: null });
    });
  });

  describe("unknown action", () => {
    it("returns 400 for an unknown action", async () => {
      const res = await POST(makeRequest({ action: "doesNotExist" }));
      const json = await res.json();

      expect(res.status).toBe(400);
      expect(json).toEqual({ error: "Unknown action" });
    });
  });

  describe("error handling", () => {
    it("returns 500 when a service throws", async () => {
      vi.mocked(getScene).mockRejectedValue(new Error("Network error"));

      const res = await POST(
        makeRequest({ action: "createDoc", sceneId: "scene-1" })
      );
      const json = await res.json();

      expect(res.status).toBe(500);
      expect(json).toEqual({ error: "Internal error" });
    });
  });
});

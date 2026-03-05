import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/templates/route";
import {
  applyTemplate,
  listTemplates,
  saveBookAsTemplate,
} from "@/lib/services/templates";
import { getTemplateById } from "@/lib/data/templates";

vi.mock("@/lib/services/templates", () => ({
  applyTemplate: vi.fn(),
  listTemplates: vi.fn(),
  saveBookAsTemplate: vi.fn(),
}));

vi.mock("@/lib/data/templates", () => ({
  getTemplateById: vi.fn(),
}));

function makeRequest(body: object): Request {
  return new Request("http://localhost/api/templates", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("POST /api/templates", () => {
  describe("action: list", () => {
    it("returns all templates", async () => {
      const mockTemplates = [
        { id: "three-act", name: "Three-Act Structure" },
        { id: "heros-journey", name: "Hero's Journey" },
      ];
      vi.mocked(listTemplates).mockReturnValue(mockTemplates as any);

      const res = await POST(makeRequest({ action: "list" }));
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json).toEqual(mockTemplates);
      expect(listTemplates).toHaveBeenCalledOnce();
    });
  });

  describe("action: get", () => {
    it("returns a template by id", async () => {
      const mockTemplate = { id: "three-act", name: "Three-Act Structure" };
      vi.mocked(getTemplateById).mockReturnValue(mockTemplate as any);

      const res = await POST(
        makeRequest({ action: "get", templateId: "three-act" })
      );
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json).toEqual(mockTemplate);
      expect(getTemplateById).toHaveBeenCalledWith("three-act");
    });

    it("returns 404 when template is not found", async () => {
      vi.mocked(getTemplateById).mockReturnValue(undefined);

      const res = await POST(
        makeRequest({ action: "get", templateId: "nonexistent" })
      );
      const json = await res.json();

      expect(res.status).toBe(404);
      expect(json).toEqual({ error: "Template not found" });
    });
  });

  describe("action: apply", () => {
    it("applies a template to a book", async () => {
      const mockResult = {
        chapters: [{ id: "ch1", title: "Act I" }],
        plotlines: [{ id: "pl1", title: "Main Plot" }],
      };
      vi.mocked(applyTemplate).mockResolvedValue(mockResult as any);

      const res = await POST(
        makeRequest({ action: "apply", bookId: "b1", templateId: "three-act" })
      );
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json).toEqual(mockResult);
      expect(applyTemplate).toHaveBeenCalledWith("b1", "three-act");
    });

    it("returns 400 when bookId is missing", async () => {
      const res = await POST(
        makeRequest({ action: "apply", templateId: "three-act" })
      );
      const json = await res.json();

      expect(res.status).toBe(400);
      expect(json).toEqual({ error: "bookId and templateId required" });
      expect(applyTemplate).not.toHaveBeenCalled();
    });

    it("returns 400 when templateId is missing", async () => {
      const res = await POST(
        makeRequest({ action: "apply", bookId: "b1" })
      );
      const json = await res.json();

      expect(res.status).toBe(400);
      expect(json).toEqual({ error: "bookId and templateId required" });
      expect(applyTemplate).not.toHaveBeenCalled();
    });
  });

  describe("action: saveFromBook", () => {
    it("saves a book as a template", async () => {
      const mockTemplate = { id: "custom-1", name: "My Template" };
      vi.mocked(saveBookAsTemplate).mockResolvedValue(mockTemplate as any);

      const res = await POST(
        makeRequest({ action: "saveFromBook", bookId: "b1", name: "My Template" })
      );
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json).toEqual(mockTemplate);
      expect(saveBookAsTemplate).toHaveBeenCalledWith("b1", "My Template");
    });

    it("returns 400 when bookId is missing", async () => {
      const res = await POST(
        makeRequest({ action: "saveFromBook", name: "My Template" })
      );
      const json = await res.json();

      expect(res.status).toBe(400);
      expect(json).toEqual({ error: "bookId and name required" });
      expect(saveBookAsTemplate).not.toHaveBeenCalled();
    });

    it("returns 400 when name is missing", async () => {
      const res = await POST(
        makeRequest({ action: "saveFromBook", bookId: "b1" })
      );
      const json = await res.json();

      expect(res.status).toBe(400);
      expect(json).toEqual({ error: "bookId and name required" });
      expect(saveBookAsTemplate).not.toHaveBeenCalled();
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
      vi.mocked(listTemplates).mockImplementation(() => {
        throw new Error("Unexpected error");
      });

      const res = await POST(makeRequest({ action: "list" }));
      const json = await res.json();

      expect(res.status).toBe(500);
      expect(json).toEqual({ error: "Internal server error" });
    });
  });
});

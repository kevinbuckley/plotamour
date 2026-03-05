import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/export/route";
import {
  getExportData,
  generateTextOutline,
  generateHtmlOutline,
} from "@/lib/services/export";

vi.mock("@/lib/services/export", () => ({
  getExportData: vi.fn(),
  generateTextOutline: vi.fn(),
  generateHtmlOutline: vi.fn(),
}));

function makeRequest(body: object): Request {
  return new Request("http://localhost/api/export", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("POST /api/export", () => {
  const mockExportData = {
    projectTitle: "My Project",
    bookTitle: "My Book",
    chapters: [],
    plotlines: [],
    characters: [],
    places: [],
  };

  describe("missing bookId", () => {
    it("returns 400 when bookId is not provided", async () => {
      const res = await POST(makeRequest({ format: "json" }));
      const json = await res.json();

      expect(res.status).toBe(400);
      expect(json).toEqual({ error: "bookId required" });
      expect(getExportData).not.toHaveBeenCalled();
    });
  });

  describe('format: "text"', () => {
    it("returns a plain text response with correct headers", async () => {
      vi.mocked(getExportData).mockResolvedValue(mockExportData as any);
      vi.mocked(generateTextOutline).mockReturnValue("Outline text content");

      const res = await POST(
        makeRequest({ bookId: "b1", format: "text" })
      );
      const text = await res.text();

      expect(res.status).toBe(200);
      expect(text).toBe("Outline text content");
      expect(res.headers.get("Content-Type")).toBe("text/plain; charset=utf-8");
      expect(res.headers.get("Content-Disposition")).toContain("attachment");
      expect(res.headers.get("Content-Disposition")).toContain(".txt");
      expect(getExportData).toHaveBeenCalledWith("b1");
      expect(generateTextOutline).toHaveBeenCalledWith(mockExportData);
    });

    it("sanitizes the filename from the project title", async () => {
      const dataWithSpecialChars = {
        ...mockExportData,
        projectTitle: "My Project! @#$",
      };
      vi.mocked(getExportData).mockResolvedValue(dataWithSpecialChars as any);
      vi.mocked(generateTextOutline).mockReturnValue("text");

      const res = await POST(
        makeRequest({ bookId: "b1", format: "text" })
      );

      const disposition = res.headers.get("Content-Disposition") ?? "";
      expect(disposition).not.toContain("!");
      expect(disposition).not.toContain("@");
      expect(disposition).toContain("My-Project");
    });
  });

  describe('format: "html"', () => {
    it("returns an HTML response with correct headers", async () => {
      vi.mocked(getExportData).mockResolvedValue(mockExportData as any);
      vi.mocked(generateHtmlOutline).mockReturnValue("<html>outline</html>");

      const res = await POST(
        makeRequest({ bookId: "b1", format: "html" })
      );
      const html = await res.text();

      expect(res.status).toBe(200);
      expect(html).toBe("<html>outline</html>");
      expect(res.headers.get("Content-Type")).toBe("text/html; charset=utf-8");
      expect(res.headers.get("Content-Disposition")).toContain("attachment");
      expect(res.headers.get("Content-Disposition")).toContain(".html");
      expect(getExportData).toHaveBeenCalledWith("b1");
      expect(generateHtmlOutline).toHaveBeenCalledWith(mockExportData);
    });
  });

  describe('format: "json"', () => {
    it("returns JSON export data", async () => {
      vi.mocked(getExportData).mockResolvedValue(mockExportData as any);

      const res = await POST(
        makeRequest({ bookId: "b1", format: "json" })
      );
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json).toEqual(mockExportData);
      expect(getExportData).toHaveBeenCalledWith("b1");
      expect(generateTextOutline).not.toHaveBeenCalled();
      expect(generateHtmlOutline).not.toHaveBeenCalled();
    });
  });

  describe("default format", () => {
    it("returns JSON when no format is specified", async () => {
      vi.mocked(getExportData).mockResolvedValue(mockExportData as any);

      const res = await POST(makeRequest({ bookId: "b1" }));
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json).toEqual(mockExportData);
      expect(getExportData).toHaveBeenCalledWith("b1");
    });
  });

  describe("error handling", () => {
    it("returns 500 when export fails", async () => {
      vi.mocked(getExportData).mockRejectedValue(new Error("DB failure"));

      const res = await POST(
        makeRequest({ bookId: "b1", format: "json" })
      );
      const json = await res.json();

      expect(res.status).toBe(500);
      expect(json).toEqual({ error: "Export failed" });
    });
  });
});

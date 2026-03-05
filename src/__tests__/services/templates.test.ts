import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockClient, mockQueryBuilder } from "../mocks/supabase";

let mockClient: ReturnType<typeof createMockClient>;

vi.mock("@/lib/db/server", () => ({
  createClient: vi.fn().mockImplementation(() => Promise.resolve(mockClient)),
}));

import {
  BUILT_IN_TEMPLATES,
  getTemplateById,
} from "@/lib/data/templates";
import type { TemplateDefinition } from "@/lib/data/templates";
import {
  listTemplates,
  applyTemplate,
  saveBookAsTemplate,
} from "@/lib/services/templates";

beforeEach(() => {
  vi.clearAllMocks();
  mockClient = createMockClient();
});

// ===========================================================================
// Pure data tests (no mocks needed)
// ===========================================================================
describe("BUILT_IN_TEMPLATES", () => {
  it("has exactly 10 templates", () => {
    expect(BUILT_IN_TEMPLATES).toHaveLength(10);
  });

  it.each(BUILT_IN_TEMPLATES)(
    "template '$name' has required fields and non-empty chapters/plotlines",
    (template) => {
      expect(template.id).toBeTruthy();
      expect(typeof template.id).toBe("string");
      expect(template.name).toBeTruthy();
      expect(typeof template.name).toBe("string");
      expect(template.author).toBeTruthy();
      expect(typeof template.author).toBe("string");
      expect(template.description).toBeTruthy();
      expect(typeof template.description).toBe("string");

      // Chapters
      expect(template.chapters.length).toBeGreaterThan(0);
      for (const ch of template.chapters) {
        expect(ch.title).toBeTruthy();
        expect(typeof ch.description).toBe("string");
      }

      // Plotlines
      expect(template.plotlines.length).toBeGreaterThan(0);
      for (const pl of template.plotlines) {
        expect(pl.title).toBeTruthy();
        expect(pl.color).toMatch(/^#[0-9a-f]{6}$/i);
      }
    }
  );

  it("has unique IDs across all templates", () => {
    const ids = BUILT_IN_TEMPLATES.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("getTemplateById", () => {
  it("returns the three-act template by id", () => {
    const template = getTemplateById("three-act");

    expect(template).toBeDefined();
    expect(template!.id).toBe("three-act");
    expect(template!.name).toBe("Three-Act Structure");
    expect(template!.author).toBe("Classic");
    expect(template!.chapters.length).toBe(9);
    expect(template!.plotlines).toHaveLength(1);
  });

  it("returns undefined for a nonexistent template id", () => {
    const template = getTemplateById("nonexistent");

    expect(template).toBeUndefined();
  });

  it("finds every built-in template by its id", () => {
    for (const t of BUILT_IN_TEMPLATES) {
      expect(getTemplateById(t.id)).toBe(t);
    }
  });
});

// ===========================================================================
// listTemplates (pure function, no DB)
// ===========================================================================
describe("listTemplates", () => {
  it("returns the BUILT_IN_TEMPLATES array", () => {
    const result = listTemplates();

    expect(result).toBe(BUILT_IN_TEMPLATES);
    expect(result).toHaveLength(10);
  });
});

// ===========================================================================
// applyTemplate (needs Supabase mocks)
// ===========================================================================
describe("applyTemplate", () => {
  const bookId = "book-1";

  const threeActTemplate = BUILT_IN_TEMPLATES.find(
    (t) => t.id === "three-act"
  )!;

  // Build what the DB would return after inserting plotlines
  const insertedPlotlines = threeActTemplate.plotlines.map((p, i) => ({
    id: `pl-new-${i}`,
    book_id: bookId,
    title: p.title,
    color: p.color,
    sort_order: i,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  }));

  // Build what the DB would return after inserting chapters
  const insertedChapters = threeActTemplate.chapters.map((ch, i) => ({
    id: `ch-new-${i}`,
    book_id: bookId,
    title: ch.title,
    description: ch.description,
    sort_order: i,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  }));

  function setupApplyMocks() {
    // 1. delete scenes
    mockClient.from.mockReturnValueOnce(mockQueryBuilder(null));
    // 2. delete chapters
    mockClient.from.mockReturnValueOnce(mockQueryBuilder(null));
    // 3. delete plotlines
    mockClient.from.mockReturnValueOnce(mockQueryBuilder(null));
    // 4. insert plotlines
    mockClient.from.mockReturnValueOnce(mockQueryBuilder(insertedPlotlines));
    // 5. insert chapters
    mockClient.from.mockReturnValueOnce(mockQueryBuilder(insertedChapters));
    // 6. insert scenes
    mockClient.from.mockReturnValueOnce(mockQueryBuilder(null));
  }

  it("deletes existing data and creates new plotlines, chapters, and scenes", async () => {
    setupApplyMocks();

    const result = await applyTemplate(bookId, "three-act");

    expect(result.plotlines).toEqual(insertedPlotlines);
    expect(result.chapters).toEqual(insertedChapters);

    // Verify deletion calls (scenes, chapters, plotlines)
    expect(mockClient.from).toHaveBeenNthCalledWith(1, "scenes");
    expect(mockClient.from).toHaveBeenNthCalledWith(2, "chapters");
    expect(mockClient.from).toHaveBeenNthCalledWith(3, "plotlines");

    // Verify insertion calls (plotlines, chapters, scenes)
    expect(mockClient.from).toHaveBeenNthCalledWith(4, "plotlines");
    expect(mockClient.from).toHaveBeenNthCalledWith(5, "chapters");
    expect(mockClient.from).toHaveBeenNthCalledWith(6, "scenes");

    // Total of 6 from() calls
    expect(mockClient.from).toHaveBeenCalledTimes(6);
  });

  it("throws for an unknown template id", async () => {
    await expect(applyTemplate(bookId, "does-not-exist")).rejects.toThrow(
      "Template not found: does-not-exist"
    );

    // Should not have made any DB calls
    expect(mockClient.from).not.toHaveBeenCalled();
  });

  it("throws when plotline insert fails", async () => {
    // delete scenes, chapters, plotlines succeed
    mockClient.from.mockReturnValueOnce(mockQueryBuilder(null));
    mockClient.from.mockReturnValueOnce(mockQueryBuilder(null));
    mockClient.from.mockReturnValueOnce(mockQueryBuilder(null));
    // plotline insert fails
    const dbError = { message: "Insert failed", code: "23505" };
    mockClient.from.mockReturnValueOnce(mockQueryBuilder(null, dbError));

    await expect(applyTemplate(bookId, "three-act")).rejects.toEqual(dbError);
  });

  it("throws when chapter insert fails", async () => {
    // delete scenes, chapters, plotlines succeed
    mockClient.from.mockReturnValueOnce(mockQueryBuilder(null));
    mockClient.from.mockReturnValueOnce(mockQueryBuilder(null));
    mockClient.from.mockReturnValueOnce(mockQueryBuilder(null));
    // plotline insert succeeds
    mockClient.from.mockReturnValueOnce(mockQueryBuilder(insertedPlotlines));
    // chapter insert fails
    const dbError = { message: "Insert failed", code: "23505" };
    mockClient.from.mockReturnValueOnce(mockQueryBuilder(null, dbError));

    await expect(applyTemplate(bookId, "three-act")).rejects.toEqual(dbError);
  });

  it("throws when scene insert fails", async () => {
    // delete scenes, chapters, plotlines succeed
    mockClient.from.mockReturnValueOnce(mockQueryBuilder(null));
    mockClient.from.mockReturnValueOnce(mockQueryBuilder(null));
    mockClient.from.mockReturnValueOnce(mockQueryBuilder(null));
    // plotline and chapter inserts succeed
    mockClient.from.mockReturnValueOnce(mockQueryBuilder(insertedPlotlines));
    mockClient.from.mockReturnValueOnce(mockQueryBuilder(insertedChapters));
    // scene insert fails
    const dbError = { message: "Insert failed", code: "23505" };
    mockClient.from.mockReturnValueOnce(mockQueryBuilder(null, dbError));

    await expect(applyTemplate(bookId, "three-act")).rejects.toEqual(dbError);
  });

  it("works with a multi-plotline template (romancing-the-beat)", async () => {
    const romanceTemplate = BUILT_IN_TEMPLATES.find(
      (t) => t.id === "romancing-the-beat"
    )!;

    const romancePlotlines = romanceTemplate.plotlines.map((p, i) => ({
      id: `pl-romance-${i}`,
      book_id: bookId,
      title: p.title,
      color: p.color,
      sort_order: i,
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-01T00:00:00Z",
    }));

    const romanceChapters = romanceTemplate.chapters.map((ch, i) => ({
      id: `ch-romance-${i}`,
      book_id: bookId,
      title: ch.title,
      description: ch.description,
      sort_order: i,
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-01T00:00:00Z",
    }));

    // 3 deletes + 3 inserts
    mockClient.from.mockReturnValueOnce(mockQueryBuilder(null));
    mockClient.from.mockReturnValueOnce(mockQueryBuilder(null));
    mockClient.from.mockReturnValueOnce(mockQueryBuilder(null));
    mockClient.from.mockReturnValueOnce(mockQueryBuilder(romancePlotlines));
    mockClient.from.mockReturnValueOnce(mockQueryBuilder(romanceChapters));
    mockClient.from.mockReturnValueOnce(mockQueryBuilder(null));

    const result = await applyTemplate(bookId, "romancing-the-beat");

    expect(result.plotlines).toHaveLength(2);
    expect(result.plotlines[0].title).toBe("Romance Arc");
    expect(result.plotlines[1].title).toBe("External Plot");
    expect(result.chapters).toHaveLength(8);
  });
});

// ===========================================================================
// saveBookAsTemplate (needs Supabase mocks)
// ===========================================================================
describe("saveBookAsTemplate", () => {
  const bookId = "book-1";

  const existingChapters = [
    {
      id: "ch-1",
      book_id: bookId,
      title: "Beginning",
      description: "The start",
      sort_order: 0,
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-01T00:00:00Z",
    },
    {
      id: "ch-2",
      book_id: bookId,
      title: "Middle",
      description: "The middle part",
      sort_order: 1,
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-01T00:00:00Z",
    },
    {
      id: "ch-3",
      book_id: bookId,
      title: "End",
      description: "",
      sort_order: 2,
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-01T00:00:00Z",
    },
  ];

  const existingPlotlines = [
    {
      id: "pl-1",
      book_id: bookId,
      title: "Main Arc",
      color: "#6366f1",
      sort_order: 0,
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-01T00:00:00Z",
    },
    {
      id: "pl-2",
      book_id: bookId,
      title: "Side Quest",
      color: "#22c55e",
      sort_order: 1,
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-01T00:00:00Z",
    },
  ];

  it("builds a template definition from existing book structure", async () => {
    // saveBookAsTemplate does a Promise.all of chapters + plotlines
    mockClient.from
      .mockReturnValueOnce(mockQueryBuilder(existingChapters))
      .mockReturnValueOnce(mockQueryBuilder(existingPlotlines));

    const result = await saveBookAsTemplate(bookId, "My Custom Template");

    expect(result.name).toBe("My Custom Template");
    expect(result.author).toBe("Custom");
    expect(result.id).toMatch(/^custom-\d+$/);
    expect(result.description).toContain("3 chapters");
    expect(result.description).toContain("2 plotlines");

    // Chapters
    expect(result.chapters).toHaveLength(3);
    expect(result.chapters[0]).toEqual({
      title: "Beginning",
      description: "The start",
    });
    expect(result.chapters[1]).toEqual({
      title: "Middle",
      description: "The middle part",
    });
    expect(result.chapters[2]).toEqual({ title: "End", description: "" });

    // Plotlines
    expect(result.plotlines).toHaveLength(2);
    expect(result.plotlines[0]).toEqual({
      title: "Main Arc",
      color: "#6366f1",
    });
    expect(result.plotlines[1]).toEqual({
      title: "Side Quest",
      color: "#22c55e",
    });
  });

  it("handles a book with no chapters or plotlines", async () => {
    mockClient.from
      .mockReturnValueOnce(mockQueryBuilder([]))
      .mockReturnValueOnce(mockQueryBuilder([]));

    const result = await saveBookAsTemplate(bookId, "Empty Book Template");

    expect(result.name).toBe("Empty Book Template");
    expect(result.chapters).toEqual([]);
    expect(result.plotlines).toEqual([]);
    expect(result.description).toContain("0 chapters");
    expect(result.description).toContain("0 plotlines");
  });

  it("uses empty string for chapter description when null", async () => {
    const chaptersWithNull = [
      {
        ...existingChapters[0],
        description: null as unknown as string,
      },
    ];
    mockClient.from
      .mockReturnValueOnce(mockQueryBuilder(chaptersWithNull))
      .mockReturnValueOnce(mockQueryBuilder(existingPlotlines));

    const result = await saveBookAsTemplate(bookId, "Null Desc Template");

    expect(result.chapters[0].description).toBe("");
  });

  it("throws when the chapters query errors", async () => {
    const dbError = { message: "Query failed", code: "42P01" };
    mockClient.from
      .mockReturnValueOnce(mockQueryBuilder(null, dbError))
      .mockReturnValueOnce(mockQueryBuilder(existingPlotlines));

    await expect(saveBookAsTemplate(bookId, "Fail")).rejects.toEqual(dbError);
  });

  it("throws when the plotlines query errors", async () => {
    const dbError = { message: "Query failed", code: "42P01" };
    mockClient.from
      .mockReturnValueOnce(mockQueryBuilder(existingChapters))
      .mockReturnValueOnce(mockQueryBuilder(null, dbError));

    await expect(saveBookAsTemplate(bookId, "Fail")).rejects.toEqual(dbError);
  });

  it("conforms to the TemplateDefinition shape", async () => {
    mockClient.from
      .mockReturnValueOnce(mockQueryBuilder(existingChapters))
      .mockReturnValueOnce(mockQueryBuilder(existingPlotlines));

    const result = await saveBookAsTemplate(bookId, "Shape Check");

    // Verify it satisfies the interface
    const template: TemplateDefinition = result;
    expect(template.id).toBeDefined();
    expect(template.name).toBeDefined();
    expect(template.author).toBeDefined();
    expect(template.description).toBeDefined();
    expect(template.chapters).toBeDefined();
    expect(template.plotlines).toBeDefined();
  });
});

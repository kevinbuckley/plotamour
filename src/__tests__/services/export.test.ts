import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockClient, mockQueryBuilder } from "../mocks/supabase";

let mockClient: ReturnType<typeof createMockClient>;

vi.mock("@/lib/db/server", () => ({
  createClient: vi.fn().mockImplementation(() => Promise.resolve(mockClient)),
}));

import {
  getExportData,
  generateTextOutline,
  generateHtmlOutline,
} from "@/lib/services/export";
import type { ExportData } from "@/lib/services/export";

// ---------------------------------------------------------------------------
// Shared test data
// ---------------------------------------------------------------------------

const ts = "2024-01-01T00:00:00Z";

const mockPlotlines = [
  {
    id: "pl-1",
    book_id: "book-1",
    title: "Main Plot",
    color: "#6366f1",
    sort_order: 0,
    created_at: ts,
    updated_at: ts,
  },
  {
    id: "pl-2",
    book_id: "book-1",
    title: "Subplot",
    color: "#ec4899",
    sort_order: 1,
    created_at: ts,
    updated_at: ts,
  },
];

const mockCharacters = [
  {
    id: "char-1",
    project_id: "proj-1",
    name: "Alice",
    description: "The protagonist",
    avatar_url: null,
    custom_attributes: {},
    sort_order: 0,
    deleted_at: null,
    created_at: ts,
    updated_at: ts,
  },
  {
    id: "char-2",
    project_id: "proj-1",
    name: "Bob",
    description: "The sidekick",
    avatar_url: null,
    custom_attributes: {},
    sort_order: 1,
    deleted_at: null,
    created_at: ts,
    updated_at: ts,
  },
];

const mockPlaces = [
  {
    id: "place-1",
    project_id: "proj-1",
    name: "Castle",
    description: "A grand castle on the hill",
    image_url: null,
    custom_attributes: {},
    sort_order: 0,
    deleted_at: null,
    created_at: ts,
    updated_at: ts,
  },
];

const mockChapters = [
  {
    id: "ch-1",
    book_id: "book-1",
    title: "Chapter 1",
    description: "The beginning",
    sort_order: 0,
    created_at: ts,
    updated_at: ts,
  },
  {
    id: "ch-2",
    book_id: "book-1",
    title: "Chapter 2",
    description: "",
    sort_order: 1,
    created_at: ts,
    updated_at: ts,
  },
];

const mockScenes = [
  {
    id: "scene-1",
    book_id: "book-1",
    chapter_id: "ch-1",
    plotline_id: "pl-1",
    title: "Opening",
    summary: "The story opens",
    conflict: "Hidden danger",
    pov_character_id: "char-1",
    position: 0,
    deleted_at: null,
    created_at: ts,
    updated_at: ts,
  },
  {
    id: "scene-2",
    book_id: "book-1",
    chapter_id: "ch-1",
    plotline_id: "pl-2",
    title: "Subplot Intro",
    summary: "The subplot begins",
    conflict: "",
    pov_character_id: null,
    position: 1,
    deleted_at: null,
    created_at: ts,
    updated_at: ts,
  },
  {
    id: "scene-3",
    book_id: "book-1",
    chapter_id: "ch-2",
    plotline_id: "pl-1",
    title: "Escalation",
    summary: "",
    conflict: "Major confrontation",
    pov_character_id: "char-2",
    position: 0,
    deleted_at: null,
    created_at: ts,
    updated_at: ts,
  },
];

/** Helper to build a full ExportData object. */
function buildExportData(overrides: Partial<ExportData> = {}): ExportData {
  return {
    projectTitle: "My Series",
    bookTitle: "Book One",
    plotlines: mockPlotlines as ExportData["plotlines"],
    characters: mockCharacters as ExportData["characters"],
    places: mockPlaces as ExportData["places"],
    chapters: [
      {
        ...mockChapters[0],
        scenes: [
          {
            ...mockScenes[0],
            plotlineTitle: "Main Plot",
            plotlineColor: "#6366f1",
            characters: ["Alice", "Bob"],
            places: ["Castle"],
          },
          {
            ...mockScenes[1],
            plotlineTitle: "Subplot",
            plotlineColor: "#ec4899",
            characters: [],
            places: [],
          },
        ],
      },
      {
        ...mockChapters[1],
        scenes: [
          {
            ...mockScenes[2],
            plotlineTitle: "Main Plot",
            plotlineColor: "#6366f1",
            characters: ["Bob"],
            places: [],
          },
        ],
      },
    ] as ExportData["chapters"],
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mockClient = createMockClient();
});

// ===========================================================================
// generateTextOutline
// ===========================================================================
describe("generateTextOutline", () => {
  it("includes project title, book title (when different), plotlines, chapters, and scenes", () => {
    const data = buildExportData();
    const text = generateTextOutline(data);

    // Project and book title
    expect(text).toContain("# My Series");
    expect(text).toContain("## Book One");

    // Plotlines
    expect(text).toContain("## Plotlines");
    expect(text).toContain("- Main Plot");
    expect(text).toContain("- Subplot");

    // Chapters
    expect(text).toContain("## Chapter 1");
    expect(text).toContain("The beginning");
    expect(text).toContain("## Chapter 2");

    // Scenes with metadata
    expect(text).toContain("### Opening [Main Plot]");
    expect(text).toContain("The story opens");
    expect(text).toContain("**Conflict:** Hidden danger");
    expect(text).toContain("**Characters:** Alice, Bob");
    expect(text).toContain("**Places:** Castle");

    // Characters section
    expect(text).toContain("## Characters");
    expect(text).toContain("### Alice");
    expect(text).toContain("The protagonist");

    // Places section
    expect(text).toContain("## Places");
    expect(text).toContain("### Castle");
    expect(text).toContain("A grand castle on the hill");
  });

  it("omits book title when it matches project title", () => {
    const data = buildExportData({
      projectTitle: "Same Title",
      bookTitle: "Same Title",
    });
    const text = generateTextOutline(data);
    const lines = text.split("\n");

    // Should have # Same Title but NOT ## Same Title
    expect(lines).toContain("# Same Title");
    expect(lines).not.toContain("## Same Title");
  });

  it("handles empty arrays gracefully", () => {
    const data = buildExportData({
      chapters: [],
      plotlines: [],
      characters: [],
      places: [],
    });
    const text = generateTextOutline(data);

    expect(text).toContain("# My Series");
    expect(text).toContain("## Plotlines");
    // Should not contain Characters or Places sections
    expect(text).not.toContain("## Characters");
    expect(text).not.toContain("## Places");
  });

  it("omits characters section when characters array is empty", () => {
    const data = buildExportData({ characters: [] });
    const text = generateTextOutline(data);

    expect(text).not.toContain("## Characters");
  });

  it("omits places section when places array is empty", () => {
    const data = buildExportData({ places: [] });
    const text = generateTextOutline(data);

    expect(text).not.toContain("## Places");
  });

  it("omits scene conflict line when conflict is empty", () => {
    const data = buildExportData();
    const text = generateTextOutline(data);

    // scene-2 (Subplot Intro) has empty conflict — should not produce a conflict line
    const lines = text.split("\n");
    const subplotIdx = lines.findIndex((l) =>
      l.includes("### Subplot Intro [Subplot]")
    );
    expect(subplotIdx).toBeGreaterThan(-1);

    // The line after the summary should NOT be a conflict line
    // (next non-empty should be another scene or chapter)
    const nextLines = lines.slice(subplotIdx + 1, subplotIdx + 4);
    expect(nextLines.join("\n")).not.toContain("**Conflict:**");
  });

  it("omits scene characters line when scene has no characters", () => {
    const data = buildExportData();
    const text = generateTextOutline(data);

    // scene-2 (Subplot Intro) has empty characters
    const lines = text.split("\n");
    const subplotIdx = lines.findIndex((l) =>
      l.includes("### Subplot Intro [Subplot]")
    );
    const nextLines = lines.slice(subplotIdx + 1, subplotIdx + 4);
    expect(nextLines.join("\n")).not.toContain("**Characters:**");
  });

  it("omits scene places line when scene has no places", () => {
    const data = buildExportData();
    const text = generateTextOutline(data);

    // scene-3 (Escalation) has no places
    const lines = text.split("\n");
    const escIdx = lines.findIndex((l) =>
      l.includes("### Escalation [Main Plot]")
    );
    const nextLines = lines.slice(escIdx + 1, escIdx + 5);
    expect(nextLines.join("\n")).not.toContain("**Places:**");
  });
});

// ===========================================================================
// generateHtmlOutline
// ===========================================================================
describe("generateHtmlOutline", () => {
  it("produces valid HTML with doctype, head, and body", () => {
    const data = buildExportData();
    const html = generateHtmlOutline(data);

    expect(html).toMatch(/^<!DOCTYPE html>/);
    expect(html).toContain("<html>");
    expect(html).toContain("<head>");
    expect(html).toContain('<meta charset="utf-8">');
    expect(html).toContain("<title>");
    expect(html).toContain("</head>");
    expect(html).toContain("<body>");
    expect(html).toContain("</body>");
    expect(html).toContain("</html>");
  });

  it("escapes HTML entities in text content", () => {
    const data = buildExportData({
      projectTitle: 'Rock & Roll <"Live">',
      bookTitle: "Book <One>",
      characters: [
        {
          ...mockCharacters[0],
          name: "Tom & Jerry",
          description: 'Uses "quotes" & <tags>',
        },
      ] as ExportData["characters"],
    });
    const html = generateHtmlOutline(data);

    // Ampersand
    expect(html).toContain("Rock &amp; Roll");
    // Angle brackets
    expect(html).toContain("&lt;&quot;Live&quot;&gt;");
    // Title should also be escaped
    expect(html).toContain("Book &lt;One&gt;");
    // Character name and description
    expect(html).toContain("Tom &amp; Jerry");
    expect(html).toContain("Uses &quot;quotes&quot; &amp; &lt;tags&gt;");
  });

  it("includes plotline color dots", () => {
    const data = buildExportData();
    const html = generateHtmlOutline(data);

    // Color dot for Main Plot
    expect(html).toContain("background:#6366f1");
    expect(html).toContain("border-radius:50%");
    // Color dot for Subplot
    expect(html).toContain("background:#ec4899");
  });

  it("includes scene card styling with plotline border color", () => {
    const data = buildExportData();
    const html = generateHtmlOutline(data);

    // Scene cards should have border-left with plotline color
    expect(html).toContain("border-left:3px solid #6366f1");
    expect(html).toContain("border-left:3px solid #ec4899");
    // General card styling
    expect(html).toContain("border-radius:4px");
    expect(html).toContain("padding:12px");
  });

  it("omits book title when it matches project title", () => {
    const data = buildExportData({
      projectTitle: "Same Title",
      bookTitle: "Same Title",
    });
    const html = generateHtmlOutline(data);

    // Should have h1 but not h2 for the same title
    expect(html).toContain("<h1>Same Title</h1>");
    // The first h2 should be for Plotlines, not for the book title
    const h2Index = html.indexOf("<h2>");
    const plotlinesIndex = html.indexOf("<h2>Plotlines</h2>");
    expect(h2Index).toBe(plotlinesIndex);
  });

  it("includes characters section only when characters exist", () => {
    const withChars = generateHtmlOutline(buildExportData());
    expect(withChars).toContain("<h2>Characters</h2>");
    expect(withChars).toContain("<h3>Alice</h3>");

    const withoutChars = generateHtmlOutline(
      buildExportData({ characters: [] })
    );
    expect(withoutChars).not.toContain("<h2>Characters</h2>");
  });

  it("includes places section only when places exist", () => {
    const withPlaces = generateHtmlOutline(buildExportData());
    expect(withPlaces).toContain("<h2>Places</h2>");
    expect(withPlaces).toContain("<h3>Castle</h3>");

    const withoutPlaces = generateHtmlOutline(buildExportData({ places: [] }));
    expect(withoutPlaces).not.toContain("<h2>Places</h2>");
  });

  it("includes scene summary, conflict, characters, and places in cards", () => {
    const html = generateHtmlOutline(buildExportData());

    // Scene 1 has everything
    expect(html).toContain("<p>The story opens</p>");
    expect(html).toContain(
      "<p><strong>Conflict:</strong> Hidden danger</p>"
    );
    expect(html).toContain(
      "<p><strong>Characters:</strong> Alice, Bob</p>"
    );
    expect(html).toContain("<p><strong>Places:</strong> Castle</p>");
  });

  it("escapes characters in scene character and place names", () => {
    const data = buildExportData({
      chapters: [
        {
          ...mockChapters[0],
          scenes: [
            {
              ...mockScenes[0],
              plotlineTitle: "Main Plot",
              plotlineColor: "#6366f1",
              characters: ["Tom & Jerry"],
              places: ['The "Grand" Hall'],
            },
          ],
        },
      ] as ExportData["chapters"],
    });
    const html = generateHtmlOutline(data);

    expect(html).toContain("Tom &amp; Jerry");
    expect(html).toContain("The &quot;Grand&quot; Hall");
  });
});

// ===========================================================================
// getExportData (with Supabase mocks)
// ===========================================================================
describe("getExportData", () => {
  it("aggregates book, chapters, plotlines, scenes, characters, places, and links", async () => {
    // 1. book query (with projects join)
    const bookData = {
      id: "book-1",
      project_id: "proj-1",
      title: "Book One",
      projects: { title: "My Series" },
    };
    mockClient.from.mockReturnValueOnce(mockQueryBuilder(bookData));

    // 2-6. Parallel fetches: chapters, plotlines, scenes, characters, places
    mockClient.from
      .mockReturnValueOnce(mockQueryBuilder(mockChapters))
      .mockReturnValueOnce(mockQueryBuilder(mockPlotlines))
      .mockReturnValueOnce(mockQueryBuilder(mockScenes))
      .mockReturnValueOnce(mockQueryBuilder(mockCharacters))
      .mockReturnValueOnce(mockQueryBuilder(mockPlaces));

    // 7-8. scene_characters, scene_places
    mockClient.from
      .mockReturnValueOnce(
        mockQueryBuilder([
          { scene_id: "scene-1", character_id: "char-1" },
          { scene_id: "scene-1", character_id: "char-2" },
          { scene_id: "scene-3", character_id: "char-2" },
        ])
      )
      .mockReturnValueOnce(
        mockQueryBuilder([{ scene_id: "scene-1", place_id: "place-1" }])
      );

    const result = await getExportData("book-1");

    expect(result.projectTitle).toBe("My Series");
    expect(result.bookTitle).toBe("Book One");
    expect(result.plotlines).toHaveLength(2);
    expect(result.characters).toHaveLength(2);
    expect(result.places).toHaveLength(1);

    // Chapter structure
    expect(result.chapters).toHaveLength(2);
    expect(result.chapters[0].title).toBe("Chapter 1");
    expect(result.chapters[0].scenes).toHaveLength(2);
    expect(result.chapters[1].scenes).toHaveLength(1);

    // Enriched scene data
    const opening = result.chapters[0].scenes[0];
    expect(opening.plotlineTitle).toBe("Main Plot");
    expect(opening.plotlineColor).toBe("#6366f1");
    expect(opening.characters).toEqual(["Alice", "Bob"]);
    expect(opening.places).toEqual(["Castle"]);

    // Scene with no links
    const subplotIntro = result.chapters[0].scenes[1];
    expect(subplotIntro.characters).toEqual([]);
    expect(subplotIntro.places).toEqual([]);

    // Escalation scene
    const escalation = result.chapters[1].scenes[0];
    expect(escalation.characters).toEqual(["Bob"]);
    expect(escalation.places).toEqual([]);
  });

  it("throws when the book is not found", async () => {
    mockClient.from.mockReturnValueOnce(
      mockQueryBuilder(null, { message: "Not found", code: "PGRST116" })
    );

    await expect(getExportData("nonexistent")).rejects.toThrow(
      "Book not found"
    );
  });

  it("handles empty scenes (skips link queries)", async () => {
    const bookData = {
      id: "book-1",
      project_id: "proj-1",
      title: "Empty Book",
      projects: { title: "My Series" },
    };
    mockClient.from.mockReturnValueOnce(mockQueryBuilder(bookData));

    // chapters, plotlines, scenes (empty), characters, places
    mockClient.from
      .mockReturnValueOnce(mockQueryBuilder(mockChapters))
      .mockReturnValueOnce(mockQueryBuilder(mockPlotlines))
      .mockReturnValueOnce(mockQueryBuilder([]))
      .mockReturnValueOnce(mockQueryBuilder(mockCharacters))
      .mockReturnValueOnce(mockQueryBuilder(mockPlaces));

    // When scenes are empty, the code resolves link promises directly
    // (Promise.resolve({ data: [] })), so no additional from() calls needed.

    const result = await getExportData("book-1");

    expect(result.chapters[0].scenes).toEqual([]);
    expect(result.chapters[1].scenes).toEqual([]);
  });

  it("uses 'Untitled' when project data is null", async () => {
    const bookData = {
      id: "book-1",
      project_id: "proj-1",
      title: "Orphan Book",
      projects: null,
    };
    mockClient.from.mockReturnValueOnce(mockQueryBuilder(bookData));

    mockClient.from
      .mockReturnValueOnce(mockQueryBuilder([]))
      .mockReturnValueOnce(mockQueryBuilder([]))
      .mockReturnValueOnce(mockQueryBuilder([]))
      .mockReturnValueOnce(mockQueryBuilder([]))
      .mockReturnValueOnce(mockQueryBuilder([]));

    const result = await getExportData("book-1");

    expect(result.projectTitle).toBe("Untitled");
  });

  it("uses 'Unknown' plotline title when scene references missing plotline", async () => {
    const bookData = {
      id: "book-1",
      project_id: "proj-1",
      title: "Book One",
      projects: { title: "Series" },
    };
    mockClient.from.mockReturnValueOnce(mockQueryBuilder(bookData));

    const orphanScene = {
      ...mockScenes[0],
      plotline_id: "nonexistent-pl",
      chapter_id: "ch-1",
    };

    mockClient.from
      .mockReturnValueOnce(mockQueryBuilder([mockChapters[0]]))
      .mockReturnValueOnce(mockQueryBuilder([]))
      .mockReturnValueOnce(mockQueryBuilder([orphanScene]))
      .mockReturnValueOnce(mockQueryBuilder([]))
      .mockReturnValueOnce(mockQueryBuilder([]));

    // scene_characters, scene_places
    mockClient.from
      .mockReturnValueOnce(mockQueryBuilder([]))
      .mockReturnValueOnce(mockQueryBuilder([]));

    const result = await getExportData("book-1");

    expect(result.chapters[0].scenes[0].plotlineTitle).toBe("Unknown");
    expect(result.chapters[0].scenes[0].plotlineColor).toBe("#6366f1");
  });
});

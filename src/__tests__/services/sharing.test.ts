import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockClient, mockQueryBuilder } from "../mocks/supabase";

let mockClient: ReturnType<typeof createMockClient>;

vi.mock("@/lib/db/server", () => ({
  createClient: vi.fn().mockImplementation(() => Promise.resolve(mockClient)),
}));

// resolveShareToken / getSharedProjectData use the owner SQL connection
// (Neon Data API has no anonymous role). Mock a queued sql tag: each call
// resolves to the next queued row array.
let sqlQueue: unknown[][];
const mockSql = vi.fn(() => Promise.resolve(sqlQueue.shift() ?? []));

vi.mock("@/lib/db/service", () => ({
  serviceSql: () => mockSql,
}));

import {
  getShare,
  createShare,
  deleteShare,
  resolveShareToken,
  getSharedProjectData,
} from "@/lib/services/sharing";

const ts = "2024-01-01T00:00:00Z";

const mockShare = {
  id: "share-1",
  project_id: "proj-1",
  user_id: "user-1",
  share_token: "abc123def456ghi789jkl0",
  label: "",
  created_at: ts,
  expires_at: null,
};

beforeEach(() => {
  vi.clearAllMocks();
  mockClient = createMockClient();
  sqlQueue = [];
});

// ===========================================================================
// getShare
// ===========================================================================
describe("getShare", () => {
  it("returns the most recent share for a project", async () => {
    mockClient.from.mockReturnValueOnce(mockQueryBuilder(mockShare));

    const result = await getShare("proj-1");

    expect(result).toEqual(mockShare);
    expect(mockClient.from).toHaveBeenCalledWith("project_shares");
  });

  it("returns null when no share exists", async () => {
    mockClient.from.mockReturnValueOnce(mockQueryBuilder(null));

    const result = await getShare("proj-1");

    expect(result).toBeNull();
  });
});

// ===========================================================================
// createShare
// ===========================================================================
describe("createShare", () => {
  it("inserts a new share and returns it", async () => {
    mockClient.from.mockReturnValueOnce(mockQueryBuilder(mockShare));

    const result = await createShare("proj-1");

    expect(result).toEqual(mockShare);
    expect(mockClient.from).toHaveBeenCalledWith("project_shares");

    // Verify insert payload contains the required fields
    const insertCall = mockClient.from.mock.results[0].value.insert.mock.calls[0][0];
    expect(insertCall).toMatchObject({
      project_id: "proj-1",
      user_id: "test-user-id",
      label: "",
    });
    // share_token should be a non-empty URL-safe string
    expect(typeof insertCall.share_token).toBe("string");
    expect(insertCall.share_token.length).toBeGreaterThan(0);
    // URL-safe base64 should not contain +, /, or =
    expect(insertCall.share_token).not.toMatch(/[+/=]/);
  });

  it("passes a custom label when provided", async () => {
    mockClient.from.mockReturnValueOnce(mockQueryBuilder(mockShare));

    await createShare("proj-1", "Beta readers");

    const insertPayload = mockClient.from.mock.results[0].value.insert.mock.calls[0][0];
    expect(insertPayload.label).toBe("Beta readers");
  });

  it("throws when not authenticated", async () => {
    mockClient.auth.getUser.mockResolvedValueOnce({
      data: { user: null },
      error: null,
    });

    await expect(createShare("proj-1")).rejects.toThrow("Not authenticated");
    expect(mockClient.from).not.toHaveBeenCalled();
  });

  it("throws when the database insert fails", async () => {
    mockClient.from.mockReturnValueOnce(
      mockQueryBuilder(null, { message: "unique constraint violation" })
    );

    await expect(createShare("proj-1")).rejects.toThrow(
      "unique constraint violation"
    );
  });

  it("generates a unique token each call", async () => {
    mockClient.from
      .mockReturnValueOnce(mockQueryBuilder(mockShare))
      .mockReturnValueOnce(mockQueryBuilder(mockShare));

    await createShare("proj-1");
    await createShare("proj-1");

    const token1 =
      mockClient.from.mock.results[0].value.insert.mock.calls[0][0].share_token;
    const token2 =
      mockClient.from.mock.results[1].value.insert.mock.calls[0][0].share_token;

    expect(token1).not.toBe(token2);
  });
});

// ===========================================================================
// deleteShare
// ===========================================================================
describe("deleteShare", () => {
  it("deletes the share by id", async () => {
    mockClient.from.mockReturnValueOnce(mockQueryBuilder(null));

    await deleteShare("share-1");

    expect(mockClient.from).toHaveBeenCalledWith("project_shares");
    const builder = mockClient.from.mock.results[0].value;
    expect(builder.delete).toHaveBeenCalled();
    expect(builder.eq).toHaveBeenCalledWith("id", "share-1");
  });
});

// ===========================================================================
// resolveShareToken
// ===========================================================================
describe("resolveShareToken", () => {
  it("returns projectId and label when token is valid and not expired", async () => {
    sqlQueue.push([
      { project_id: "proj-1", label: "Beta readers", expires_at: null },
    ]);

    const result = await resolveShareToken("abc123");

    expect(result).toEqual({ projectId: "proj-1", label: "Beta readers" });
  });

  it("returns null when token is not found", async () => {
    sqlQueue.push([]);

    const result = await resolveShareToken("nonexistent");

    expect(result).toBeNull();
  });

  it("returns null when token is expired", async () => {
    const pastDate = new Date(Date.now() - 1000).toISOString();
    sqlQueue.push([
      { project_id: "proj-1", label: "", expires_at: pastDate },
    ]);

    const result = await resolveShareToken("expired-token");

    expect(result).toBeNull();
  });

  it("returns projectId when token has a future expiry", async () => {
    const futureDate = new Date(Date.now() + 86_400_000).toISOString(); // +1 day
    sqlQueue.push([
      { project_id: "proj-1", label: "", expires_at: futureDate },
    ]);

    const result = await resolveShareToken("valid-expiry-token");

    expect(result).toEqual({ projectId: "proj-1", label: "" });
  });
});

// ===========================================================================
// getSharedProjectData
// ===========================================================================
describe("getSharedProjectData", () => {
  const mockProject = { id: "proj-1", title: "My Novel", project_type: "standalone" };
  const mockBook = {
    id: "book-1",
    project_id: "proj-1",
    title: "My Novel",
    sort_order: 0,
    deleted_at: null,
    created_at: ts,
    updated_at: ts,
  };
  const mockChapters = [
    { id: "ch-1", book_id: "book-1", title: "Chapter 1", sort_order: 0, created_at: ts, updated_at: ts },
  ];
  const mockPlotlines = [
    { id: "pl-1", book_id: "book-1", title: "Main Plot", color: "#6366f1", sort_order: 0 },
  ];
  const mockScenes = [
    {
      id: "scene-1",
      book_id: "book-1",
      chapter_id: "ch-1",
      plotline_id: "pl-1",
      title: "Opening",
      summary: "Hero wakes up",
      conflict: "A shadow at the door",
      position: 0,
      deleted_at: null,
      archived_at: null,
    },
  ];
  const mockCharacters = [
    { id: "char-1", project_id: "proj-1", name: "Alice", description: "Protagonist", sort_order: 0, deleted_at: null },
  ];
  const mockPlaces = [
    { id: "place-1", project_id: "proj-1", name: "Castle", description: "Big castle", sort_order: 0, deleted_at: null },
  ];

  function setupHappyPath() {
    sqlQueue.push(
      [mockProject], // 1. project
      [mockBook], // 2. books
      mockChapters, // 3-7. chapters, plotlines, scenes, characters, places (parallel)
      mockPlotlines,
      mockScenes,
      mockCharacters,
      mockPlaces,
      [{ scene_id: "scene-1", character_id: "char-1" }], // 8-9. join tables (parallel)
      [{ scene_id: "scene-1", place_id: "place-1" }]
    );
  }

  it("returns enriched project data with scenes, characters, and places", async () => {
    setupHappyPath();

    const result = await getSharedProjectData("proj-1");

    expect(result).not.toBeNull();
    expect(result!.projectTitle).toBe("My Novel");
    expect(result!.bookTitle).toBe("My Novel");
    expect(result!.plotlines).toHaveLength(1);
    expect(result!.characters).toHaveLength(1);
    expect(result!.places).toHaveLength(1);
    expect(result!.chapters).toHaveLength(1);

    const scene = result!.chapters[0].scenes[0];
    expect(scene.title).toBe("Opening");
    expect(scene.plotlineTitle).toBe("Main Plot");
    expect(scene.plotlineColor).toBe("#6366f1");
    expect(scene.characters).toEqual(["Alice"]);
    expect(scene.places).toEqual(["Castle"]);
  });

  it("returns null when project is not found", async () => {
    sqlQueue.push([]);

    const result = await getSharedProjectData("missing-proj");

    expect(result).toBeNull();
  });

  it("returns null when no books exist", async () => {
    sqlQueue.push([mockProject], []);

    const result = await getSharedProjectData("proj-1");

    expect(result).toBeNull();
  });

  it("uses first book when multiple books exist (standalone)", async () => {
    const secondBook = { ...mockBook, id: "book-2", title: "Sequel" };
    sqlQueue.push([mockProject], [mockBook, secondBook], [], [], [], [], []);

    const result = await getSharedProjectData("proj-1");

    // Should use the first book
    expect(result!.bookTitle).toBe("My Novel");
  });

  it("uses 'Unknown' plotline title for orphaned scenes", async () => {
    const orphanScene = { ...mockScenes[0], plotline_id: "nonexistent-pl" };

    sqlQueue.push(
      [mockProject],
      [mockBook],
      mockChapters,
      [], // no plotlines
      [orphanScene],
      [],
      [],
      [],
      []
    );

    const result = await getSharedProjectData("proj-1");

    expect(result!.chapters[0].scenes[0].plotlineTitle).toBe("Unknown");
    expect(result!.chapters[0].scenes[0].plotlineColor).toBe("#6366f1");
  });

  it("skips join-table queries when there are no scenes", async () => {
    sqlQueue.push(
      [mockProject],
      [mockBook],
      mockChapters,
      mockPlotlines,
      [], // no scenes
      [],
      []
    );
    // No additional sql calls should happen for join tables

    const result = await getSharedProjectData("proj-1");

    expect(result!.chapters[0].scenes).toEqual([]);
    // sql was called exactly 7 times (proj + books + 5 parallel)
    expect(mockSql).toHaveBeenCalledTimes(7);
  });
});

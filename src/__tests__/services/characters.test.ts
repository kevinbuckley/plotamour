import { describe, it, expect, vi, beforeEach } from "vitest";

// ---------------------------------------------------------------------------
// Mock helpers — inlined to avoid hoisting issues with the shared mock file
// ---------------------------------------------------------------------------

function mockQueryBuilder(
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

// vi.hoisted ensures the mock client is available when the hoisted vi.mock factory runs
const mockClient = vi.hoisted(() => {
  // Re-create a minimal mockQueryBuilder inside hoisted scope
  function hoistedBuilder() {
    const response = { data: null, error: null, count: null };
    const b: Record<string, unknown> = {};
    const methods = [
      "select", "insert", "update", "delete", "upsert",
      "eq", "neq", "is", "in", "order", "limit", "single", "maybeSingle",
    ];
    for (const m of methods) {
      b[m] = vi.fn().mockReturnValue(b);
    }
    b.then = (
      resolve: (v: typeof response) => void,
      reject?: (r: unknown) => void
    ) => Promise.resolve(response).then(resolve, reject);
    return b;
  }

  return {
    from: vi.fn().mockReturnValue(hoistedBuilder()),
    auth: {
      getUser: vi.fn().mockResolvedValue({
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
  getCharacters,
  getCharacter,
  createCharacter,
  updateCharacter,
  deleteCharacter,
  getCharacterSceneIds,
  getSceneCharacterIds,
  linkCharacterToScene,
  unlinkCharacterFromScene,
} from "@/lib/services/characters";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const mockCharacter = {
  id: "char-1",
  project_id: "proj-1",
  name: "Jane Doe",
  description: "A test character",
  avatar_url: null,
  custom_attributes: {},
  sort_order: 0,
  deleted_at: null,
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
};

const mockCharacter2 = {
  id: "char-2",
  project_id: "proj-1",
  name: "John Smith",
  description: "Another character",
  avatar_url: "https://example.com/avatar.png",
  custom_attributes: { role: "antagonist" },
  sort_order: 1,
  deleted_at: null,
  created_at: "2024-01-02T00:00:00Z",
  updated_at: "2024-01-02T00:00:00Z",
};

beforeEach(() => {
  vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// getCharacters
// ---------------------------------------------------------------------------
describe("getCharacters", () => {
  it("returns a list of characters for the project", async () => {
    mockClient.from.mockReturnValueOnce(
      mockQueryBuilder([mockCharacter, mockCharacter2])
    );

    const result = await getCharacters("proj-1");

    expect(result).toEqual([mockCharacter, mockCharacter2]);
    expect(mockClient.from).toHaveBeenCalledWith("characters");
  });

  it("returns an empty array when no characters exist", async () => {
    mockClient.from.mockReturnValueOnce(mockQueryBuilder([]));

    const result = await getCharacters("proj-1");

    expect(result).toEqual([]);
  });

  it("returns an empty array when data is null", async () => {
    mockClient.from.mockReturnValueOnce(mockQueryBuilder(null));

    const result = await getCharacters("proj-1");

    expect(result).toEqual([]);
  });

  it("throws when the query errors", async () => {
    const dbError = { message: "Database error", code: "42P01" };
    mockClient.from.mockReturnValueOnce(mockQueryBuilder(null, dbError));

    await expect(getCharacters("proj-1")).rejects.toEqual(dbError);
  });
});

// ---------------------------------------------------------------------------
// getCharacter
// ---------------------------------------------------------------------------
describe("getCharacter", () => {
  it("returns a single character by id", async () => {
    mockClient.from.mockReturnValueOnce(mockQueryBuilder(mockCharacter));

    const result = await getCharacter("char-1");

    expect(result).toEqual(mockCharacter);
    expect(mockClient.from).toHaveBeenCalledWith("characters");
  });

  it("returns null when the query errors", async () => {
    const dbError = { message: "Not found", code: "PGRST116" };
    mockClient.from.mockReturnValueOnce(mockQueryBuilder(null, dbError));

    const result = await getCharacter("nonexistent");

    expect(result).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// createCharacter
// ---------------------------------------------------------------------------
describe("createCharacter", () => {
  it("calculates sort_order from existing characters and inserts", async () => {
    const created = { ...mockCharacter, sort_order: 3 };

    mockClient.from
      .mockReturnValueOnce(mockQueryBuilder([{ sort_order: 2 }]))
      .mockReturnValueOnce(mockQueryBuilder(created));

    const result = await createCharacter({
      projectId: "proj-1",
      name: "Jane Doe",
      description: "A test character",
    });

    expect(result).toEqual(created);
    expect(mockClient.from).toHaveBeenCalledTimes(2);
    expect(mockClient.from).toHaveBeenNthCalledWith(1, "characters");
    expect(mockClient.from).toHaveBeenNthCalledWith(2, "characters");
  });

  it("defaults sort_order to 0 when no existing characters", async () => {
    const created = { ...mockCharacter, sort_order: 0 };

    mockClient.from
      .mockReturnValueOnce(mockQueryBuilder([]))
      .mockReturnValueOnce(mockQueryBuilder(created));

    const result = await createCharacter({
      projectId: "proj-1",
      name: "Jane Doe",
    });

    expect(result).toEqual(created);
  });

  it("uses empty string as default description when not provided", async () => {
    const created = { ...mockCharacter, description: "" };

    mockClient.from
      .mockReturnValueOnce(mockQueryBuilder([]))
      .mockReturnValueOnce(mockQueryBuilder(created));

    const result = await createCharacter({
      projectId: "proj-1",
      name: "Jane Doe",
    });

    expect(result.description).toBe("");
  });

  it("throws when the insert errors", async () => {
    const dbError = { message: "Insert failed", code: "23505" };

    mockClient.from
      .mockReturnValueOnce(mockQueryBuilder([{ sort_order: 0 }]))
      .mockReturnValueOnce(mockQueryBuilder(null, dbError));

    await expect(
      createCharacter({ projectId: "proj-1", name: "Jane Doe" })
    ).rejects.toEqual(dbError);
  });
});

// ---------------------------------------------------------------------------
// updateCharacter
// ---------------------------------------------------------------------------
describe("updateCharacter", () => {
  it("updates character fields and returns updated character", async () => {
    const updated = { ...mockCharacter, name: "Updated Name" };
    mockClient.from.mockReturnValueOnce(mockQueryBuilder(updated));

    const result = await updateCharacter("char-1", { name: "Updated Name" });

    expect(result).toEqual(updated);
    expect(mockClient.from).toHaveBeenCalledWith("characters");
  });

  it("can update multiple fields at once", async () => {
    const updated = {
      ...mockCharacter,
      name: "New Name",
      description: "New description",
      avatar_url: "https://example.com/new.png",
      custom_attributes: { role: "protagonist" },
    };
    mockClient.from.mockReturnValueOnce(mockQueryBuilder(updated));

    const result = await updateCharacter("char-1", {
      name: "New Name",
      description: "New description",
      avatar_url: "https://example.com/new.png",
      custom_attributes: { role: "protagonist" },
    });

    expect(result).toEqual(updated);
  });

  it("throws when the update errors", async () => {
    const dbError = { message: "Update failed", code: "42501" };
    mockClient.from.mockReturnValueOnce(mockQueryBuilder(null, dbError));

    await expect(
      updateCharacter("char-1", { name: "Fail" })
    ).rejects.toEqual(dbError);
  });
});

// ---------------------------------------------------------------------------
// deleteCharacter
// ---------------------------------------------------------------------------
describe("deleteCharacter", () => {
  it("soft deletes by setting deleted_at", async () => {
    mockClient.from.mockReturnValueOnce(mockQueryBuilder(null));

    await expect(deleteCharacter("char-1")).resolves.toBeUndefined();
    expect(mockClient.from).toHaveBeenCalledWith("characters");
  });

  it("throws when the delete errors", async () => {
    const dbError = { message: "Delete failed", code: "42501" };
    mockClient.from.mockReturnValueOnce(mockQueryBuilder(null, dbError));

    await expect(deleteCharacter("char-1")).rejects.toEqual(dbError);
  });
});

// ---------------------------------------------------------------------------
// getCharacterSceneIds
// ---------------------------------------------------------------------------
describe("getCharacterSceneIds", () => {
  it("returns scene IDs linked to the character", async () => {
    mockClient.from.mockReturnValueOnce(
      mockQueryBuilder([
        { scene_id: "scene-1" },
        { scene_id: "scene-2" },
        { scene_id: "scene-3" },
      ])
    );

    const result = await getCharacterSceneIds("char-1");

    expect(result).toEqual(["scene-1", "scene-2", "scene-3"]);
    expect(mockClient.from).toHaveBeenCalledWith("scene_characters");
  });

  it("returns an empty array when no scenes are linked", async () => {
    mockClient.from.mockReturnValueOnce(mockQueryBuilder([]));

    const result = await getCharacterSceneIds("char-1");

    expect(result).toEqual([]);
  });

  it("returns an empty array when data is null", async () => {
    mockClient.from.mockReturnValueOnce(mockQueryBuilder(null));

    const result = await getCharacterSceneIds("char-1");

    expect(result).toEqual([]);
  });

  it("throws when the query errors", async () => {
    const dbError = { message: "Query failed", code: "42P01" };
    mockClient.from.mockReturnValueOnce(mockQueryBuilder(null, dbError));

    await expect(getCharacterSceneIds("char-1")).rejects.toEqual(dbError);
  });
});

// ---------------------------------------------------------------------------
// getSceneCharacterIds
// ---------------------------------------------------------------------------
describe("getSceneCharacterIds", () => {
  it("returns character IDs linked to the scene", async () => {
    mockClient.from.mockReturnValueOnce(
      mockQueryBuilder([
        { character_id: "char-1" },
        { character_id: "char-2" },
      ])
    );

    const result = await getSceneCharacterIds("scene-1");

    expect(result).toEqual(["char-1", "char-2"]);
    expect(mockClient.from).toHaveBeenCalledWith("scene_characters");
  });

  it("returns an empty array when no characters are linked", async () => {
    mockClient.from.mockReturnValueOnce(mockQueryBuilder([]));

    const result = await getSceneCharacterIds("scene-1");

    expect(result).toEqual([]);
  });

  it("returns an empty array when data is null", async () => {
    mockClient.from.mockReturnValueOnce(mockQueryBuilder(null));

    const result = await getSceneCharacterIds("scene-1");

    expect(result).toEqual([]);
  });

  it("throws when the query errors", async () => {
    const dbError = { message: "Query failed", code: "42P01" };
    mockClient.from.mockReturnValueOnce(mockQueryBuilder(null, dbError));

    await expect(getSceneCharacterIds("scene-1")).rejects.toEqual(dbError);
  });
});

// ---------------------------------------------------------------------------
// linkCharacterToScene
// ---------------------------------------------------------------------------
describe("linkCharacterToScene", () => {
  it("upserts a scene-character link successfully", async () => {
    mockClient.from.mockReturnValueOnce(mockQueryBuilder(null));

    await expect(
      linkCharacterToScene("scene-1", "char-1")
    ).resolves.toBeUndefined();
    expect(mockClient.from).toHaveBeenCalledWith("scene_characters");
  });

  it("throws when the upsert errors", async () => {
    const dbError = { message: "Upsert failed", code: "23503" };
    mockClient.from.mockReturnValueOnce(mockQueryBuilder(null, dbError));

    await expect(
      linkCharacterToScene("scene-1", "char-1")
    ).rejects.toEqual(dbError);
  });
});

// ---------------------------------------------------------------------------
// unlinkCharacterFromScene
// ---------------------------------------------------------------------------
describe("unlinkCharacterFromScene", () => {
  it("deletes a scene-character link successfully", async () => {
    mockClient.from.mockReturnValueOnce(mockQueryBuilder(null));

    await expect(
      unlinkCharacterFromScene("scene-1", "char-1")
    ).resolves.toBeUndefined();
    expect(mockClient.from).toHaveBeenCalledWith("scene_characters");
  });

  it("throws when the delete errors", async () => {
    const dbError = { message: "Delete failed", code: "42501" };
    mockClient.from.mockReturnValueOnce(mockQueryBuilder(null, dbError));

    await expect(
      unlinkCharacterFromScene("scene-1", "char-1")
    ).rejects.toEqual(dbError);
  });
});

import { describe, it, expect, vi, beforeEach } from "vitest";
import { mockQueryBuilder } from "../mocks/supabase";

const { mockClient } = vi.hoisted(() => {
  return {
    mockClient: {
      from: vi.fn(),
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "test-user-id" } },
          error: null,
        }),
      },
    },
  };
});

vi.mock("@/lib/db/server", () => ({
  createClient: vi.fn().mockResolvedValue(mockClient),
}));

import {
  getTags,
  createTag,
  updateTag,
  deleteTag,
  getSceneTagIds,
  addTagToScene,
  removeTagFromScene,
  getCharacterTagIds,
  addTagToCharacter,
  removeTagFromCharacter,
  getPlaceTagIds,
  addTagToPlace,
  removeTagFromPlace,
} from "@/lib/services/tags";

beforeEach(() => {
  vi.clearAllMocks();
});

const mockTag = {
  id: "tag-1",
  project_id: "proj-1",
  name: "Romance",
  color: "#6366f1",
  category: "Genre",
  created_at: "2025-01-01T00:00:00Z",
  updated_at: "2025-01-01T00:00:00Z",
};

const mockTag2 = {
  ...mockTag,
  id: "tag-2",
  name: "Gothic",
  color: "#ef4444",
  category: "Genre",
};

const mockTag3 = {
  ...mockTag,
  id: "tag-3",
  name: "First Draft",
  color: "#22c55e",
  category: "Status",
};

describe("getTags", () => {
  it("returns tags ordered by category then name", async () => {
    mockClient.from.mockReturnValueOnce(
      mockQueryBuilder([mockTag2, mockTag, mockTag3])
    );

    const result = await getTags("proj-1");

    expect(mockClient.from).toHaveBeenCalledWith("tags");
    expect(result).toEqual([mockTag2, mockTag, mockTag3]);
  });

  it("returns an empty array when no tags exist", async () => {
    mockClient.from.mockReturnValueOnce(mockQueryBuilder([]));

    const result = await getTags("proj-1");
    expect(result).toEqual([]);
  });

  it("throws when the query errors", async () => {
    mockClient.from.mockReturnValueOnce(
      mockQueryBuilder(null, { message: "DB error" })
    );

    await expect(getTags("proj-1")).rejects.toEqual({
      message: "DB error",
    });
  });
});

describe("createTag", () => {
  it("creates a tag with default color and category", async () => {
    const createdTag = {
      ...mockTag,
      color: "#6366f1",
      category: "",
    };
    mockClient.from.mockReturnValueOnce(mockQueryBuilder(createdTag));

    const result = await createTag({
      projectId: "proj-1",
      name: "Romance",
    });

    expect(mockClient.from).toHaveBeenCalledWith("tags");
    expect(result).toEqual(createdTag);
  });

  it("creates a tag with custom color and category", async () => {
    mockClient.from.mockReturnValueOnce(mockQueryBuilder(mockTag2));

    const result = await createTag({
      projectId: "proj-1",
      name: "Gothic",
      color: "#ef4444",
      category: "Genre",
    });

    expect(result.color).toBe("#ef4444");
    expect(result.category).toBe("Genre");
  });

  it("throws when the insert errors", async () => {
    mockClient.from.mockReturnValueOnce(
      mockQueryBuilder(null, { message: "Insert failed" })
    );

    await expect(
      createTag({ projectId: "proj-1", name: "Romance" })
    ).rejects.toEqual({ message: "Insert failed" });
  });
});

describe("updateTag", () => {
  it("updates a tag and returns the updated record", async () => {
    const updated = { ...mockTag, name: "Dark Romance" };
    mockClient.from.mockReturnValueOnce(mockQueryBuilder(updated));

    const result = await updateTag("tag-1", { name: "Dark Romance" });

    expect(mockClient.from).toHaveBeenCalledWith("tags");
    expect(result).toEqual(updated);
  });

  it("throws when the update errors", async () => {
    mockClient.from.mockReturnValueOnce(
      mockQueryBuilder(null, { message: "Update failed" })
    );

    await expect(
      updateTag("tag-1", { name: "Dark Romance" })
    ).rejects.toEqual({ message: "Update failed" });
  });
});

describe("deleteTag", () => {
  it("hard-deletes a tag", async () => {
    mockClient.from.mockReturnValueOnce(mockQueryBuilder(null));

    await expect(deleteTag("tag-1")).resolves.toBeUndefined();
    expect(mockClient.from).toHaveBeenCalledWith("tags");
  });

  it("throws when the delete errors", async () => {
    mockClient.from.mockReturnValueOnce(
      mockQueryBuilder(null, { message: "Delete failed" })
    );

    await expect(deleteTag("tag-1")).rejects.toEqual({
      message: "Delete failed",
    });
  });
});

describe("scene tag linking", () => {
  it("getSceneTagIds returns tag IDs for a scene", async () => {
    mockClient.from.mockReturnValueOnce(
      mockQueryBuilder([{ tag_id: "tag-1" }, { tag_id: "tag-2" }])
    );

    const result = await getSceneTagIds("scene-1");
    expect(mockClient.from).toHaveBeenCalledWith("scene_tags");
    expect(result).toEqual(["tag-1", "tag-2"]);
  });

  it("addTagToScene upserts into scene_tags", async () => {
    mockClient.from.mockReturnValueOnce(mockQueryBuilder(null));

    await expect(addTagToScene("scene-1", "tag-1")).resolves.toBeUndefined();
    expect(mockClient.from).toHaveBeenCalledWith("scene_tags");
  });

  it("removeTagFromScene deletes from scene_tags", async () => {
    mockClient.from.mockReturnValueOnce(mockQueryBuilder(null));

    await expect(
      removeTagFromScene("scene-1", "tag-1")
    ).resolves.toBeUndefined();
    expect(mockClient.from).toHaveBeenCalledWith("scene_tags");
  });
});

describe("character tag linking", () => {
  it("getCharacterTagIds returns tag IDs for a character", async () => {
    mockClient.from.mockReturnValueOnce(
      mockQueryBuilder([{ tag_id: "tag-1" }, { tag_id: "tag-3" }])
    );

    const result = await getCharacterTagIds("char-1");
    expect(mockClient.from).toHaveBeenCalledWith("character_tags");
    expect(result).toEqual(["tag-1", "tag-3"]);
  });

  it("addTagToCharacter upserts into character_tags", async () => {
    mockClient.from.mockReturnValueOnce(mockQueryBuilder(null));

    await expect(
      addTagToCharacter("char-1", "tag-1")
    ).resolves.toBeUndefined();
    expect(mockClient.from).toHaveBeenCalledWith("character_tags");
  });

  it("removeTagFromCharacter deletes from character_tags", async () => {
    mockClient.from.mockReturnValueOnce(mockQueryBuilder(null));

    await expect(
      removeTagFromCharacter("char-1", "tag-1")
    ).resolves.toBeUndefined();
    expect(mockClient.from).toHaveBeenCalledWith("character_tags");
  });
});

describe("place tag linking", () => {
  it("getPlaceTagIds returns tag IDs for a place", async () => {
    mockClient.from.mockReturnValueOnce(
      mockQueryBuilder([{ tag_id: "tag-2" }])
    );

    const result = await getPlaceTagIds("place-1");
    expect(mockClient.from).toHaveBeenCalledWith("place_tags");
    expect(result).toEqual(["tag-2"]);
  });

  it("addTagToPlace upserts into place_tags", async () => {
    mockClient.from.mockReturnValueOnce(mockQueryBuilder(null));

    await expect(addTagToPlace("place-1", "tag-2")).resolves.toBeUndefined();
    expect(mockClient.from).toHaveBeenCalledWith("place_tags");
  });

  it("removeTagFromPlace deletes from place_tags", async () => {
    mockClient.from.mockReturnValueOnce(mockQueryBuilder(null));

    await expect(
      removeTagFromPlace("place-1", "tag-2")
    ).resolves.toBeUndefined();
    expect(mockClient.from).toHaveBeenCalledWith("place_tags");
  });

  it("addTagToPlace throws when the upsert errors", async () => {
    mockClient.from.mockReturnValueOnce(
      mockQueryBuilder(null, { message: "Upsert failed" })
    );

    await expect(addTagToPlace("place-1", "tag-2")).rejects.toEqual({
      message: "Upsert failed",
    });
  });
});

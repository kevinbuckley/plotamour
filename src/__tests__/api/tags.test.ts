import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/tags/route";
import {
  getTags,
  createTag,
  updateTag,
  deleteTag,
  addTagToScene,
  removeTagFromScene,
  getSceneTagIds,
  addTagToCharacter,
  removeTagFromCharacter,
  getCharacterTagIds,
  addTagToPlace,
  removeTagFromPlace,
  getPlaceTagIds,
} from "@/lib/services/tags";

vi.mock("@/lib/services/tags", () => ({
  getTags: vi.fn(),
  createTag: vi.fn(),
  updateTag: vi.fn(),
  deleteTag: vi.fn(),
  addTagToScene: vi.fn(),
  removeTagFromScene: vi.fn(),
  getSceneTagIds: vi.fn(),
  addTagToCharacter: vi.fn(),
  removeTagFromCharacter: vi.fn(),
  getCharacterTagIds: vi.fn(),
  addTagToPlace: vi.fn(),
  removeTagFromPlace: vi.fn(),
  getPlaceTagIds: vi.fn(),
}));

function makeRequest(body: object): Request {
  return new Request("http://localhost/api/tags", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("POST /api/tags", () => {
  describe("action: list", () => {
    it("returns tags for a project", async () => {
      const mockTags = [
        { id: "t1", name: "Romance" },
        { id: "t2", name: "Action" },
      ];
      vi.mocked(getTags).mockResolvedValue(mockTags as any);

      const res = await POST(makeRequest({ action: "list", projectId: "p1" }));
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json).toEqual(mockTags);
      expect(getTags).toHaveBeenCalledWith("p1");
    });
  });

  describe("action: create", () => {
    it("creates a tag with all fields", async () => {
      const mockTag = {
        id: "t1",
        name: "Romance",
        color: "#ff0000",
        category: "genre",
        projectId: "p1",
      };
      vi.mocked(createTag).mockResolvedValue(mockTag as any);

      const res = await POST(
        makeRequest({
          action: "create",
          projectId: "p1",
          name: "Romance",
          color: "#ff0000",
          category: "genre",
        })
      );
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json).toEqual(mockTag);
      expect(createTag).toHaveBeenCalledWith({
        projectId: "p1",
        name: "Romance",
        color: "#ff0000",
        category: "genre",
      });
    });
  });

  describe("action: update", () => {
    it("updates a tag", async () => {
      const mockUpdated = { id: "t1", name: "Updated Tag" };
      vi.mocked(updateTag).mockResolvedValue(mockUpdated as any);

      const data = { name: "Updated Tag" };
      const res = await POST(
        makeRequest({ action: "update", id: "t1", data })
      );
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json).toEqual(mockUpdated);
      expect(updateTag).toHaveBeenCalledWith("t1", data);
    });
  });

  describe("action: delete", () => {
    it("deletes a tag and returns ok", async () => {
      vi.mocked(deleteTag).mockResolvedValue(undefined as any);

      const res = await POST(makeRequest({ action: "delete", id: "t1" }));
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json).toEqual({ ok: true });
      expect(deleteTag).toHaveBeenCalledWith("t1");
    });
  });

  // Scene tags
  describe("action: addToScene", () => {
    it("adds a tag to a scene", async () => {
      vi.mocked(addTagToScene).mockResolvedValue(undefined as any);

      const res = await POST(
        makeRequest({
          action: "addToScene",
          sceneId: "s1",
          tagId: "t1",
        })
      );
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json).toEqual({ ok: true });
      expect(addTagToScene).toHaveBeenCalledWith("s1", "t1");
    });
  });

  describe("action: removeFromScene", () => {
    it("removes a tag from a scene", async () => {
      vi.mocked(removeTagFromScene).mockResolvedValue(undefined as any);

      const res = await POST(
        makeRequest({
          action: "removeFromScene",
          sceneId: "s1",
          tagId: "t1",
        })
      );
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json).toEqual({ ok: true });
      expect(removeTagFromScene).toHaveBeenCalledWith("s1", "t1");
    });
  });

  describe("action: getSceneTags", () => {
    it("returns tag IDs for a scene", async () => {
      const mockIds = ["t1", "t2", "t3"];
      vi.mocked(getSceneTagIds).mockResolvedValue(mockIds as any);

      const res = await POST(
        makeRequest({ action: "getSceneTags", sceneId: "s1" })
      );
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json).toEqual(mockIds);
      expect(getSceneTagIds).toHaveBeenCalledWith("s1");
    });
  });

  // Character tags
  describe("action: addToCharacter", () => {
    it("adds a tag to a character", async () => {
      vi.mocked(addTagToCharacter).mockResolvedValue(undefined as any);

      const res = await POST(
        makeRequest({
          action: "addToCharacter",
          characterId: "c1",
          tagId: "t1",
        })
      );
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json).toEqual({ ok: true });
      expect(addTagToCharacter).toHaveBeenCalledWith("c1", "t1");
    });
  });

  describe("action: removeFromCharacter", () => {
    it("removes a tag from a character", async () => {
      vi.mocked(removeTagFromCharacter).mockResolvedValue(undefined as any);

      const res = await POST(
        makeRequest({
          action: "removeFromCharacter",
          characterId: "c1",
          tagId: "t1",
        })
      );
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json).toEqual({ ok: true });
      expect(removeTagFromCharacter).toHaveBeenCalledWith("c1", "t1");
    });
  });

  describe("action: getCharacterTags", () => {
    it("returns tag IDs for a character", async () => {
      const mockIds = ["t1", "t2"];
      vi.mocked(getCharacterTagIds).mockResolvedValue(mockIds as any);

      const res = await POST(
        makeRequest({ action: "getCharacterTags", characterId: "c1" })
      );
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json).toEqual(mockIds);
      expect(getCharacterTagIds).toHaveBeenCalledWith("c1");
    });
  });

  // Place tags
  describe("action: addToPlace", () => {
    it("adds a tag to a place", async () => {
      vi.mocked(addTagToPlace).mockResolvedValue(undefined as any);

      const res = await POST(
        makeRequest({
          action: "addToPlace",
          placeId: "pl1",
          tagId: "t1",
        })
      );
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json).toEqual({ ok: true });
      expect(addTagToPlace).toHaveBeenCalledWith("pl1", "t1");
    });
  });

  describe("action: removeFromPlace", () => {
    it("removes a tag from a place", async () => {
      vi.mocked(removeTagFromPlace).mockResolvedValue(undefined as any);

      const res = await POST(
        makeRequest({
          action: "removeFromPlace",
          placeId: "pl1",
          tagId: "t1",
        })
      );
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json).toEqual({ ok: true });
      expect(removeTagFromPlace).toHaveBeenCalledWith("pl1", "t1");
    });
  });

  describe("action: getPlaceTags", () => {
    it("returns tag IDs for a place", async () => {
      const mockIds = ["t1", "t3"];
      vi.mocked(getPlaceTagIds).mockResolvedValue(mockIds as any);

      const res = await POST(
        makeRequest({ action: "getPlaceTags", placeId: "pl1" })
      );
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json).toEqual(mockIds);
      expect(getPlaceTagIds).toHaveBeenCalledWith("pl1");
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
      vi.mocked(getTags).mockRejectedValue(new Error("DB down"));

      const res = await POST(
        makeRequest({ action: "list", projectId: "p1" })
      );
      const json = await res.json();

      expect(res.status).toBe(500);
      expect(json).toEqual({ error: "Internal error" });
    });
  });
});

import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/characters/route";
import {
  getCharacters,
  createCharacter,
  updateCharacter,
  deleteCharacter,
  linkCharacterToScene,
  unlinkCharacterFromScene,
  getSceneCharacterIds,
  getCharacterSceneIds,
} from "@/lib/services/characters";

vi.mock("@/lib/services/characters", () => ({
  getCharacters: vi.fn(),
  createCharacter: vi.fn(),
  updateCharacter: vi.fn(),
  deleteCharacter: vi.fn(),
  linkCharacterToScene: vi.fn(),
  unlinkCharacterFromScene: vi.fn(),
  getSceneCharacterIds: vi.fn(),
  getCharacterSceneIds: vi.fn(),
}));

function makeRequest(body: object): Request {
  return new Request("http://localhost/api/characters", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("POST /api/characters", () => {
  describe("action: list", () => {
    it("returns characters for a project", async () => {
      const mockCharacters = [
        { id: "c1", name: "Alice" },
        { id: "c2", name: "Bob" },
      ];
      vi.mocked(getCharacters).mockResolvedValue(mockCharacters as any);

      const res = await POST(makeRequest({ action: "list", projectId: "p1" }));
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json).toEqual(mockCharacters);
      expect(getCharacters).toHaveBeenCalledWith("p1");
    });
  });

  describe("action: create", () => {
    it("creates a character with provided name", async () => {
      const mockCharacter = { id: "c1", name: "Hero", projectId: "p1" };
      vi.mocked(createCharacter).mockResolvedValue(mockCharacter as any);

      const res = await POST(
        makeRequest({
          action: "create",
          projectId: "p1",
          name: "Hero",
          description: "The protagonist",
        })
      );
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json).toEqual(mockCharacter);
      expect(createCharacter).toHaveBeenCalledWith({
        projectId: "p1",
        name: "Hero",
        description: "The protagonist",
      });
    });

    it("defaults name to 'New Character' when not provided", async () => {
      const mockCharacter = {
        id: "c2",
        name: "New Character",
        projectId: "p1",
      };
      vi.mocked(createCharacter).mockResolvedValue(mockCharacter as any);

      const res = await POST(
        makeRequest({ action: "create", projectId: "p1" })
      );
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json).toEqual(mockCharacter);
      expect(createCharacter).toHaveBeenCalledWith({
        projectId: "p1",
        name: "New Character",
        description: undefined,
      });
    });
  });

  describe("action: update", () => {
    it("updates a character", async () => {
      const mockUpdated = { id: "c1", name: "Updated Hero" };
      vi.mocked(updateCharacter).mockResolvedValue(mockUpdated as any);

      const data = { name: "Updated Hero" };
      const res = await POST(
        makeRequest({ action: "update", id: "c1", data })
      );
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json).toEqual(mockUpdated);
      expect(updateCharacter).toHaveBeenCalledWith("c1", data);
    });
  });

  describe("action: delete", () => {
    it("deletes a character and returns ok", async () => {
      vi.mocked(deleteCharacter).mockResolvedValue(undefined as any);

      const res = await POST(
        makeRequest({ action: "delete", id: "c1" })
      );
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json).toEqual({ ok: true });
      expect(deleteCharacter).toHaveBeenCalledWith("c1");
    });
  });

  describe("action: linkToScene", () => {
    it("links a character to a scene", async () => {
      vi.mocked(linkCharacterToScene).mockResolvedValue(undefined as any);

      const res = await POST(
        makeRequest({
          action: "linkToScene",
          sceneId: "s1",
          characterId: "c1",
        })
      );
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json).toEqual({ ok: true });
      expect(linkCharacterToScene).toHaveBeenCalledWith("s1", "c1");
    });
  });

  describe("action: unlinkFromScene", () => {
    it("unlinks a character from a scene", async () => {
      vi.mocked(unlinkCharacterFromScene).mockResolvedValue(undefined as any);

      const res = await POST(
        makeRequest({
          action: "unlinkFromScene",
          sceneId: "s1",
          characterId: "c1",
        })
      );
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json).toEqual({ ok: true });
      expect(unlinkCharacterFromScene).toHaveBeenCalledWith("s1", "c1");
    });
  });

  describe("action: getSceneCharacters", () => {
    it("returns character IDs for a scene", async () => {
      const mockIds = ["c1", "c2", "c3"];
      vi.mocked(getSceneCharacterIds).mockResolvedValue(mockIds as any);

      const res = await POST(
        makeRequest({ action: "getSceneCharacters", sceneId: "s1" })
      );
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json).toEqual(mockIds);
      expect(getSceneCharacterIds).toHaveBeenCalledWith("s1");
    });
  });

  describe("action: getCharacterScenes", () => {
    it("returns scene IDs for a character", async () => {
      const mockIds = ["s1", "s2"];
      vi.mocked(getCharacterSceneIds).mockResolvedValue(mockIds as any);

      const res = await POST(
        makeRequest({ action: "getCharacterScenes", characterId: "c1" })
      );
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json).toEqual(mockIds);
      expect(getCharacterSceneIds).toHaveBeenCalledWith("c1");
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
      vi.mocked(getCharacters).mockRejectedValue(new Error("DB down"));

      const res = await POST(
        makeRequest({ action: "list", projectId: "p1" })
      );
      const json = await res.json();

      expect(res.status).toBe(500);
      expect(json).toEqual({ error: "Internal error" });
    });
  });
});

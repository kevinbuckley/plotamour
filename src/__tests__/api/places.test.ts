import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/places/route";
import {
  getPlaces,
  createPlace,
  updatePlace,
  deletePlace,
  linkPlaceToScene,
  unlinkPlaceFromScene,
  getScenePlaceIds,
  getPlaceSceneIds,
} from "@/lib/services/places";

vi.mock("@/lib/services/places", () => ({
  getPlaces: vi.fn(),
  createPlace: vi.fn(),
  updatePlace: vi.fn(),
  deletePlace: vi.fn(),
  linkPlaceToScene: vi.fn(),
  unlinkPlaceFromScene: vi.fn(),
  getScenePlaceIds: vi.fn(),
  getPlaceSceneIds: vi.fn(),
}));

function makeRequest(body: object): Request {
  return new Request("http://localhost/api/places", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("POST /api/places", () => {
  describe("action: list", () => {
    it("returns places for a project", async () => {
      const mockPlaces = [
        { id: "pl1", name: "Castle" },
        { id: "pl2", name: "Forest" },
      ];
      vi.mocked(getPlaces).mockResolvedValue(mockPlaces as any);

      const res = await POST(makeRequest({ action: "list", projectId: "p1" }));
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json).toEqual(mockPlaces);
      expect(getPlaces).toHaveBeenCalledWith("p1");
    });
  });

  describe("action: create", () => {
    it("creates a place with provided name", async () => {
      const mockPlace = { id: "pl1", name: "Castle", projectId: "p1" };
      vi.mocked(createPlace).mockResolvedValue(mockPlace as any);

      const res = await POST(
        makeRequest({
          action: "create",
          projectId: "p1",
          name: "Castle",
          description: "A grand castle",
        })
      );
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json).toEqual(mockPlace);
      expect(createPlace).toHaveBeenCalledWith({
        projectId: "p1",
        name: "Castle",
        description: "A grand castle",
      });
    });

    it("defaults name to 'New Place' when not provided", async () => {
      const mockPlace = { id: "pl2", name: "New Place", projectId: "p1" };
      vi.mocked(createPlace).mockResolvedValue(mockPlace as any);

      const res = await POST(
        makeRequest({ action: "create", projectId: "p1" })
      );
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json).toEqual(mockPlace);
      expect(createPlace).toHaveBeenCalledWith({
        projectId: "p1",
        name: "New Place",
        description: undefined,
      });
    });
  });

  describe("action: update", () => {
    it("updates a place", async () => {
      const mockUpdated = { id: "pl1", name: "Updated Castle" };
      vi.mocked(updatePlace).mockResolvedValue(mockUpdated as any);

      const data = { name: "Updated Castle" };
      const res = await POST(
        makeRequest({ action: "update", id: "pl1", data })
      );
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json).toEqual(mockUpdated);
      expect(updatePlace).toHaveBeenCalledWith("pl1", data);
    });
  });

  describe("action: delete", () => {
    it("deletes a place and returns ok", async () => {
      vi.mocked(deletePlace).mockResolvedValue(undefined as any);

      const res = await POST(makeRequest({ action: "delete", id: "pl1" }));
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json).toEqual({ ok: true });
      expect(deletePlace).toHaveBeenCalledWith("pl1");
    });
  });

  describe("action: linkToScene", () => {
    it("links a place to a scene", async () => {
      vi.mocked(linkPlaceToScene).mockResolvedValue(undefined as any);

      const res = await POST(
        makeRequest({
          action: "linkToScene",
          sceneId: "s1",
          placeId: "pl1",
        })
      );
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json).toEqual({ ok: true });
      expect(linkPlaceToScene).toHaveBeenCalledWith("s1", "pl1");
    });
  });

  describe("action: unlinkFromScene", () => {
    it("unlinks a place from a scene", async () => {
      vi.mocked(unlinkPlaceFromScene).mockResolvedValue(undefined as any);

      const res = await POST(
        makeRequest({
          action: "unlinkFromScene",
          sceneId: "s1",
          placeId: "pl1",
        })
      );
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json).toEqual({ ok: true });
      expect(unlinkPlaceFromScene).toHaveBeenCalledWith("s1", "pl1");
    });
  });

  describe("action: getScenePlaces", () => {
    it("returns place IDs for a scene", async () => {
      const mockIds = ["pl1", "pl2", "pl3"];
      vi.mocked(getScenePlaceIds).mockResolvedValue(mockIds as any);

      const res = await POST(
        makeRequest({ action: "getScenePlaces", sceneId: "s1" })
      );
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json).toEqual(mockIds);
      expect(getScenePlaceIds).toHaveBeenCalledWith("s1");
    });
  });

  describe("action: getPlaceScenes", () => {
    it("returns scene IDs for a place", async () => {
      const mockIds = ["s1", "s2"];
      vi.mocked(getPlaceSceneIds).mockResolvedValue(mockIds as any);

      const res = await POST(
        makeRequest({ action: "getPlaceScenes", placeId: "pl1" })
      );
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json).toEqual(mockIds);
      expect(getPlaceSceneIds).toHaveBeenCalledWith("pl1");
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
      vi.mocked(getPlaces).mockRejectedValue(new Error("DB down"));

      const res = await POST(
        makeRequest({ action: "list", projectId: "p1" })
      );
      const json = await res.json();

      expect(res.status).toBe(500);
      expect(json).toEqual({ error: "Internal error" });
    });
  });
});

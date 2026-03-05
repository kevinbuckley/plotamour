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
  getPlaces,
  getPlace,
  createPlace,
  updatePlace,
  deletePlace,
  getPlaceSceneIds,
  getScenePlaceIds,
  linkPlaceToScene,
  unlinkPlaceFromScene,
} from "@/lib/services/places";

beforeEach(() => {
  vi.clearAllMocks();
});

const mockPlace = {
  id: "place-1",
  project_id: "proj-1",
  name: "Thornfield Hall",
  description: "A grand manor on the Yorkshire moors",
  image_url: null,
  custom_attributes: {},
  sort_order: 0,
  deleted_at: null,
  created_at: "2025-01-01T00:00:00Z",
  updated_at: "2025-01-01T00:00:00Z",
};

const mockPlace2 = {
  ...mockPlace,
  id: "place-2",
  name: "The Red Room",
  description: "A crimson chamber on the second floor",
  sort_order: 1,
};

describe("getPlaces", () => {
  it("returns a list of places for a project", async () => {
    mockClient.from.mockReturnValueOnce(
      mockQueryBuilder([mockPlace, mockPlace2])
    );

    const result = await getPlaces("proj-1");

    expect(mockClient.from).toHaveBeenCalledWith("places");
    expect(result).toEqual([mockPlace, mockPlace2]);
  });

  it("returns an empty array when no places exist", async () => {
    mockClient.from.mockReturnValueOnce(mockQueryBuilder([]));

    const result = await getPlaces("proj-1");
    expect(result).toEqual([]);
  });

  it("throws when the query errors", async () => {
    mockClient.from.mockReturnValueOnce(
      mockQueryBuilder(null, { message: "DB error" })
    );

    await expect(getPlaces("proj-1")).rejects.toEqual({
      message: "DB error",
    });
  });
});

describe("getPlace", () => {
  it("returns a single place by id", async () => {
    mockClient.from.mockReturnValueOnce(mockQueryBuilder(mockPlace));

    const result = await getPlace("place-1");
    expect(result).toEqual(mockPlace);
  });

  it("returns null when the query errors", async () => {
    mockClient.from.mockReturnValueOnce(
      mockQueryBuilder(null, { message: "Not found" })
    );

    const result = await getPlace("nonexistent");
    expect(result).toBeNull();
  });
});

describe("createPlace", () => {
  it("creates a place with the next sort_order", async () => {
    const createdPlace = { ...mockPlace, sort_order: 3 };
    mockClient.from
      .mockReturnValueOnce(mockQueryBuilder([{ sort_order: 2 }]))
      .mockReturnValueOnce(mockQueryBuilder(createdPlace));

    const result = await createPlace({
      projectId: "proj-1",
      name: "Thornfield Hall",
      description: "A grand manor on the Yorkshire moors",
    });

    expect(mockClient.from).toHaveBeenCalledTimes(2);
    expect(result).toEqual(createdPlace);
  });

  it("starts at sort_order 0 when no places exist", async () => {
    const createdPlace = { ...mockPlace, sort_order: 0 };
    mockClient.from
      .mockReturnValueOnce(mockQueryBuilder([]))
      .mockReturnValueOnce(mockQueryBuilder(createdPlace));

    const result = await createPlace({
      projectId: "proj-1",
      name: "Thornfield Hall",
    });

    expect(result.sort_order).toBe(0);
  });

  it("throws when the insert errors", async () => {
    mockClient.from
      .mockReturnValueOnce(mockQueryBuilder([]))
      .mockReturnValueOnce(
        mockQueryBuilder(null, { message: "Insert failed" })
      );

    await expect(
      createPlace({ projectId: "proj-1", name: "Thornfield Hall" })
    ).rejects.toEqual({ message: "Insert failed" });
  });
});

describe("updatePlace", () => {
  it("updates a place and returns the updated record", async () => {
    const updated = { ...mockPlace, name: "Ferndean Manor" };
    mockClient.from.mockReturnValueOnce(mockQueryBuilder(updated));

    const result = await updatePlace("place-1", { name: "Ferndean Manor" });

    expect(mockClient.from).toHaveBeenCalledWith("places");
    expect(result).toEqual(updated);
  });

  it("throws when the update errors", async () => {
    mockClient.from.mockReturnValueOnce(
      mockQueryBuilder(null, { message: "Update failed" })
    );

    await expect(
      updatePlace("place-1", { name: "Ferndean Manor" })
    ).rejects.toEqual({ message: "Update failed" });
  });
});

describe("deletePlace", () => {
  it("soft-deletes a place by setting deleted_at", async () => {
    mockClient.from.mockReturnValueOnce(mockQueryBuilder(null));

    await expect(deletePlace("place-1")).resolves.toBeUndefined();
    expect(mockClient.from).toHaveBeenCalledWith("places");
  });

  it("throws when the soft-delete errors", async () => {
    mockClient.from.mockReturnValueOnce(
      mockQueryBuilder(null, { message: "Delete failed" })
    );

    await expect(deletePlace("place-1")).rejects.toEqual({
      message: "Delete failed",
    });
  });
});

describe("scene-place linking", () => {
  it("getPlaceSceneIds returns scene IDs linked to a place", async () => {
    mockClient.from.mockReturnValueOnce(
      mockQueryBuilder([{ scene_id: "scene-1" }, { scene_id: "scene-2" }])
    );

    const result = await getPlaceSceneIds("place-1");
    expect(mockClient.from).toHaveBeenCalledWith("scene_places");
    expect(result).toEqual(["scene-1", "scene-2"]);
  });

  it("getScenePlaceIds returns place IDs linked to a scene", async () => {
    mockClient.from.mockReturnValueOnce(
      mockQueryBuilder([{ place_id: "place-1" }, { place_id: "place-2" }])
    );

    const result = await getScenePlaceIds("scene-1");
    expect(mockClient.from).toHaveBeenCalledWith("scene_places");
    expect(result).toEqual(["place-1", "place-2"]);
  });

  it("linkPlaceToScene upserts into scene_places", async () => {
    mockClient.from.mockReturnValueOnce(mockQueryBuilder(null));

    await expect(
      linkPlaceToScene("scene-1", "place-1")
    ).resolves.toBeUndefined();
    expect(mockClient.from).toHaveBeenCalledWith("scene_places");
  });

  it("unlinkPlaceFromScene deletes from scene_places", async () => {
    mockClient.from.mockReturnValueOnce(mockQueryBuilder(null));

    await expect(
      unlinkPlaceFromScene("scene-1", "place-1")
    ).resolves.toBeUndefined();
    expect(mockClient.from).toHaveBeenCalledWith("scene_places");
  });

  it("linkPlaceToScene throws when the upsert errors", async () => {
    mockClient.from.mockReturnValueOnce(
      mockQueryBuilder(null, { message: "Upsert failed" })
    );

    await expect(linkPlaceToScene("scene-1", "place-1")).rejects.toEqual({
      message: "Upsert failed",
    });
  });
});

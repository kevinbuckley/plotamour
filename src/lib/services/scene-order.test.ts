import { beforeEach, describe, expect, it, vi } from "vitest";

const { persist, getUser } = vi.hoisted(() => ({ persist: vi.fn(), getUser: vi.fn() }));
vi.mock("@/lib/db/server", () => ({ createClient: async () => ({ auth: { getUser } }) }));
vi.mock("@/lib/db/scene-order", () => ({ persistSceneOrder: persist }));
import { reorderScenes } from "./scene-order";

const id = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const input = { bookId: id(1), chapterId: id(2), plotlineId: id(3), expectedIds: [id(4), id(5)], sceneIds: [id(5), id(4)] };

beforeEach(() => {
  vi.resetAllMocks();
  getUser.mockResolvedValue({ data: { user: { id: id(100) } } });
  persist.mockResolvedValue([]);
});

describe("reorderScenes", () => {
  it("takes the actor from the session, never request data", async () => {
    await reorderScenes({ ...input, actorId: id(999) });
    expect(persist).toHaveBeenCalledWith(id(100), input);
  });

  it("rejects anonymous requests before touching the owner connection", async () => {
    getUser.mockResolvedValue({ data: { user: null } });
    await expect(reorderScenes(input)).rejects.toMatchObject({ status: 401 });
    expect(persist).not.toHaveBeenCalled();
  });

  it.each([
    { ...input, sceneIds: [id(4), id(4)] },
    { ...input, expectedIds: [id(4), id(4)] },
    { ...input, sceneIds: [id(4)] },
    { ...input, sceneIds: [id(4), id(999)] },
    { ...input, bookId: "not-a-uuid" },
    { ...input, sceneIds: [] },
    null,
  ])("rejects malformed and forged membership: %j", async (invalid) => {
    await expect(reorderScenes(invalid)).rejects.toMatchObject({ status: 400 });
    expect(persist).not.toHaveBeenCalled();
  });

  it.each([["42501", 403], ["22023", 400], ["40001", 409], ["40P01", 409], ["55P03", 409]])(
    "maps database error %s to HTTP %i", async (code, status) => {
      persist.mockRejectedValue({ code });
      await expect(reorderScenes(input)).rejects.toMatchObject({ status });
    }
  );

  it("does not conceal unexpected database errors", async () => {
    const error = new Error("database unavailable");
    persist.mockRejectedValue(error);
    await expect(reorderScenes(input)).rejects.toBe(error);
  });
});

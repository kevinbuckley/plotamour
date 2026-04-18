import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/sharing/route";
import { getShare, createShare, deleteShare } from "@/lib/services/sharing";

vi.mock("@/lib/services/sharing", () => ({
  getShare: vi.fn(),
  createShare: vi.fn(),
  deleteShare: vi.fn(),
}));

function makeRequest(body: object): Request {
  return new Request("http://localhost/api/sharing", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

const mockShare = {
  id: "share-1",
  project_id: "proj-1",
  user_id: "user-1",
  share_token: "abc123def456ghi789jkl0",
  label: "",
  created_at: "2024-01-01T00:00:00Z",
  expires_at: null,
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("POST /api/sharing", () => {
  // ── getShare ──────────────────────────────────────────────────────────────
  describe('action: "getShare"', () => {
    it("returns the share for a project", async () => {
      vi.mocked(getShare).mockResolvedValue(mockShare);

      const res = await POST(makeRequest({ action: "getShare", projectId: "proj-1" }));
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json).toEqual(mockShare);
      expect(getShare).toHaveBeenCalledWith("proj-1");
    });

    it("returns null when no share exists", async () => {
      vi.mocked(getShare).mockResolvedValue(null);

      const res = await POST(makeRequest({ action: "getShare", projectId: "proj-1" }));
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json).toBeNull();
    });

    it("returns 400 when projectId is missing", async () => {
      const res = await POST(makeRequest({ action: "getShare" }));
      const json = await res.json();

      expect(res.status).toBe(400);
      expect(json).toEqual({ error: "projectId required" });
      expect(getShare).not.toHaveBeenCalled();
    });
  });

  // ── createShare ───────────────────────────────────────────────────────────
  describe('action: "createShare"', () => {
    it("creates and returns a new share", async () => {
      vi.mocked(createShare).mockResolvedValue(mockShare);

      const res = await POST(makeRequest({ action: "createShare", projectId: "proj-1" }));
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json).toEqual(mockShare);
      expect(createShare).toHaveBeenCalledWith("proj-1", "");
    });

    it("forwards a custom label to the service", async () => {
      vi.mocked(createShare).mockResolvedValue(mockShare);

      await POST(makeRequest({ action: "createShare", projectId: "proj-1", label: "Beta" }));

      expect(createShare).toHaveBeenCalledWith("proj-1", "Beta");
    });

    it("returns 400 when projectId is missing", async () => {
      const res = await POST(makeRequest({ action: "createShare" }));
      const json = await res.json();

      expect(res.status).toBe(400);
      expect(json).toEqual({ error: "projectId required" });
      expect(createShare).not.toHaveBeenCalled();
    });

    it("returns 500 when service throws", async () => {
      vi.mocked(createShare).mockRejectedValue(new Error("DB error"));

      const res = await POST(makeRequest({ action: "createShare", projectId: "proj-1" }));
      const json = await res.json();

      expect(res.status).toBe(500);
      expect(json).toEqual({ error: "Internal server error" });
    });
  });

  // ── deleteShare ───────────────────────────────────────────────────────────
  describe('action: "deleteShare"', () => {
    it("deletes a share and returns ok", async () => {
      vi.mocked(deleteShare).mockResolvedValue();

      const res = await POST(makeRequest({ action: "deleteShare", shareId: "share-1" }));
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json).toEqual({ ok: true });
      expect(deleteShare).toHaveBeenCalledWith("share-1");
    });

    it("returns 400 when shareId is missing", async () => {
      const res = await POST(makeRequest({ action: "deleteShare" }));
      const json = await res.json();

      expect(res.status).toBe(400);
      expect(json).toEqual({ error: "shareId required" });
      expect(deleteShare).not.toHaveBeenCalled();
    });
  });

  // ── unknown action ────────────────────────────────────────────────────────
  describe("unknown action", () => {
    it("returns 400 for an unrecognised action", async () => {
      const res = await POST(makeRequest({ action: "doSomethingRandom" }));
      const json = await res.json();

      expect(res.status).toBe(400);
      expect(json).toEqual({ error: "Unknown action" });
    });
  });
});

import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/share/route";
import { resolveShareToken, getSharedProjectData } from "@/lib/services/sharing";

vi.mock("@/lib/services/sharing", () => ({
  resolveShareToken: vi.fn(),
  getSharedProjectData: vi.fn(),
}));

function makeRequest(body: object): Request {
  return new Request("http://localhost/api/share", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

const mockProjectData = {
  projectTitle: "My Novel",
  bookTitle: "My Novel",
  chapters: [],
  plotlines: [],
  characters: [],
  places: [],
  books: [],
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("POST /api/share (public token validation)", () => {
  it("returns project data merged with shareLabel on valid token", async () => {
    vi.mocked(resolveShareToken).mockResolvedValue({
      projectId: "proj-1",
      label: "Beta readers",
    });
    vi.mocked(getSharedProjectData).mockResolvedValue(mockProjectData);

    const res = await POST(makeRequest({ token: "abc123" }));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json).toEqual({ ...mockProjectData, shareLabel: "Beta readers" });
    expect(resolveShareToken).toHaveBeenCalledWith("abc123");
    expect(getSharedProjectData).toHaveBeenCalledWith("proj-1");
  });

  it("returns 400 when token is missing", async () => {
    const res = await POST(makeRequest({}));
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json).toEqual({ error: "token required" });
    expect(resolveShareToken).not.toHaveBeenCalled();
  });

  it("returns 404 when token is invalid or expired", async () => {
    vi.mocked(resolveShareToken).mockResolvedValue(null);

    const res = await POST(makeRequest({ token: "badtoken" }));
    const json = await res.json();

    expect(res.status).toBe(404);
    expect(json).toEqual({ error: "Invalid or expired share link" });
    expect(getSharedProjectData).not.toHaveBeenCalled();
  });

  it("returns 404 when project data is not found", async () => {
    vi.mocked(resolveShareToken).mockResolvedValue({
      projectId: "deleted-proj",
      label: "",
    });
    vi.mocked(getSharedProjectData).mockResolvedValue(null);

    const res = await POST(makeRequest({ token: "validtoken" }));
    const json = await res.json();

    expect(res.status).toBe(404);
    expect(json).toEqual({ error: "Project not found" });
  });

  it("returns 500 on unexpected errors", async () => {
    vi.mocked(resolveShareToken).mockRejectedValue(new Error("DB exploded"));

    const res = await POST(makeRequest({ token: "abc123" }));
    const json = await res.json();

    expect(res.status).toBe(500);
    expect(json).toEqual({ error: "Internal server error" });
  });

  it("includes an empty shareLabel when label is empty string", async () => {
    vi.mocked(resolveShareToken).mockResolvedValue({
      projectId: "proj-1",
      label: "",
    });
    vi.mocked(getSharedProjectData).mockResolvedValue(mockProjectData);

    const res = await POST(makeRequest({ token: "abc123" }));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.shareLabel).toBe("");
  });
});

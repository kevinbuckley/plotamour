import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/projects/route";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock("@/lib/services/projects", () => ({
  createProject: vi.fn(),
}));

import { createProject } from "@/lib/services/projects";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeRequest(body: object): Request {
  return new Request("http://localhost/api/projects", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// POST /api/projects
// ---------------------------------------------------------------------------

describe("POST /api/projects", () => {
  it("returns 400 when title is missing", async () => {
    const res = await POST(makeRequest({ description: "A desc" }));

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "Title is required" });
    expect(createProject).not.toHaveBeenCalled();
  });

  it("returns 400 when title is empty string", async () => {
    const res = await POST(makeRequest({ title: "   " }));

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "Title is required" });
    expect(createProject).not.toHaveBeenCalled();
  });

  it("creates project successfully and returns projectId + bookId", async () => {
    vi.mocked(createProject).mockResolvedValue({
      project: { id: "proj-1" } as any,
      bookId: "book-1",
    });

    const res = await POST(
      makeRequest({ title: "My Novel", description: "Epic tale", projectType: "novel" }),
    );

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ projectId: "proj-1", bookId: "book-1" });
    expect(createProject).toHaveBeenCalledWith({
      title: "My Novel",
      description: "Epic tale",
      projectType: "novel",
    });
  });

  it("trims title and description before creating", async () => {
    vi.mocked(createProject).mockResolvedValue({
      project: { id: "proj-2" } as any,
      bookId: "book-2",
    });

    const res = await POST(
      makeRequest({ title: "  Spaced Title  ", description: "  Spaced Desc  " }),
    );

    expect(res.status).toBe(200);
    expect(createProject).toHaveBeenCalledWith({
      title: "Spaced Title",
      description: "Spaced Desc",
      projectType: undefined,
    });
  });

  it("returns 500 when createProject throws", async () => {
    vi.mocked(createProject).mockRejectedValue(new Error("DB down"));

    const res = await POST(makeRequest({ title: "My Novel" }));

    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: "Failed to create project" });
  });
});

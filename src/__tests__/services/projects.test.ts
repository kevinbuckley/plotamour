import { describe, it, expect, vi, beforeEach } from "vitest";
import { mockQueryBuilder } from "../mocks/supabase";

// vi.hoisted runs before vi.mock hoisting, making mockClient available in the factory.
// We inline the mock client creation here since require() cannot resolve aliases.
const mockClient = vi.hoisted(() => {
  const mockFn = vi.fn;
  return {
    from: mockFn().mockReturnValue({
      select: mockFn().mockReturnThis(),
      insert: mockFn().mockReturnThis(),
      update: mockFn().mockReturnThis(),
      delete: mockFn().mockReturnThis(),
      upsert: mockFn().mockReturnThis(),
      eq: mockFn().mockReturnThis(),
      neq: mockFn().mockReturnThis(),
      is: mockFn().mockReturnThis(),
      in: mockFn().mockReturnThis(),
      order: mockFn().mockReturnThis(),
      limit: mockFn().mockReturnThis(),
      single: mockFn().mockReturnThis(),
      maybeSingle: mockFn().mockReturnThis(),
      then: (resolve: (v: unknown) => void, reject?: (r: unknown) => void) =>
        Promise.resolve({ data: null, error: null, count: null }).then(resolve, reject),
    }),
    auth: {
      getUser: mockFn().mockResolvedValue({
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
  getProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
  getFirstBookId,
} from "@/lib/services/projects";

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const mockProject = {
  id: "proj-1",
  user_id: "test-user-id",
  title: "My Novel",
  description: "A great story",
  project_type: "standalone" as const,
  attribute_templates: {},
  deleted_at: null,
  created_at: "2025-01-01T00:00:00Z",
  updated_at: "2025-06-15T12:00:00Z",
};

const mockBook = {
  id: "book-1",
  project_id: "proj-1",
  title: "My Novel",
  description: "",
  cover_image_url: null,
  sort_order: 0,
  deleted_at: null,
  created_at: "2025-01-01T00:00:00Z",
  updated_at: "2025-06-15T12:00:00Z",
};

beforeEach(() => {
  vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// getProjects
// ---------------------------------------------------------------------------

describe("getProjects", () => {
  it("returns all non-deleted projects ordered by updated_at desc", async () => {
    const projects = [mockProject, { ...mockProject, id: "proj-2", title: "Second Novel" }];
    mockClient.from.mockReturnValueOnce(mockQueryBuilder(projects));

    const result = await getProjects();

    expect(mockClient.from).toHaveBeenCalledWith("projects");
    expect(result).toEqual(projects);
  });

  it("returns empty array when data is null", async () => {
    mockClient.from.mockReturnValueOnce(mockQueryBuilder(null));

    const result = await getProjects();

    expect(result).toEqual([]);
  });

  it("throws when supabase returns an error", async () => {
    const dbError = { message: "Connection failed", code: "PGRST000" };
    mockClient.from.mockReturnValueOnce(mockQueryBuilder(null, dbError));

    await expect(getProjects()).rejects.toEqual(dbError);
  });
});

// ---------------------------------------------------------------------------
// getProject
// ---------------------------------------------------------------------------

describe("getProject", () => {
  it("returns a single project by id", async () => {
    mockClient.from.mockReturnValueOnce(mockQueryBuilder(mockProject));

    const result = await getProject("proj-1");

    expect(mockClient.from).toHaveBeenCalledWith("projects");
    expect(result).toEqual(mockProject);
  });

  it("returns null when project is not found", async () => {
    mockClient.from.mockReturnValueOnce(
      mockQueryBuilder(null, { message: "Row not found", code: "PGRST116" })
    );

    const result = await getProject("nonexistent");

    expect(result).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// createProject
// ---------------------------------------------------------------------------

describe("createProject", () => {
  it("creates project with default book, chapters, and plotline", async () => {
    mockClient.auth.getUser.mockResolvedValue({
      data: { user: { id: "test-user-id" } },
      error: null,
    });
    mockClient.from
      .mockReturnValueOnce(mockQueryBuilder(mockProject)) // insert project
      .mockReturnValueOnce(mockQueryBuilder(mockBook)) // insert book
      .mockReturnValueOnce(mockQueryBuilder(null)) // insert chapters
      .mockReturnValueOnce(mockQueryBuilder(null)); // insert plotline

    const result = await createProject({ title: "My Novel", description: "A great story" });

    expect(result).toEqual({ project: mockProject, bookId: "book-1" });

    // Verify all 4 from() calls
    expect(mockClient.from).toHaveBeenCalledTimes(4);
    expect(mockClient.from).toHaveBeenNthCalledWith(1, "projects");
    expect(mockClient.from).toHaveBeenNthCalledWith(2, "books");
    expect(mockClient.from).toHaveBeenNthCalledWith(3, "chapters");
    expect(mockClient.from).toHaveBeenNthCalledWith(4, "plotlines");
  });

  it("uses default values for optional fields", async () => {
    mockClient.auth.getUser.mockResolvedValue({
      data: { user: { id: "test-user-id" } },
      error: null,
    });
    const projectInsertBuilder = mockQueryBuilder(mockProject);
    mockClient.from
      .mockReturnValueOnce(projectInsertBuilder)
      .mockReturnValueOnce(mockQueryBuilder(mockBook))
      .mockReturnValueOnce(mockQueryBuilder(null))
      .mockReturnValueOnce(mockQueryBuilder(null));

    await createProject({ title: "My Novel" });

    // The insert call should include defaults
    expect(projectInsertBuilder.insert).toHaveBeenCalledWith({
      user_id: "test-user-id",
      title: "My Novel",
      description: "",
      project_type: "standalone",
    });
  });

  it("throws when user is not authenticated", async () => {
    mockClient.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: null,
    });

    await expect(createProject({ title: "My Novel" })).rejects.toThrow("Not authenticated");
  });

  it("throws when project insert fails", async () => {
    mockClient.auth.getUser.mockResolvedValue({
      data: { user: { id: "test-user-id" } },
      error: null,
    });
    const dbError = { message: "Insert failed", code: "23505" };
    mockClient.from.mockReturnValueOnce(mockQueryBuilder(null, dbError));

    await expect(createProject({ title: "My Novel" })).rejects.toEqual(dbError);
  });

  it("throws when book insert fails", async () => {
    mockClient.auth.getUser.mockResolvedValue({
      data: { user: { id: "test-user-id" } },
      error: null,
    });
    const bookError = { message: "Book insert failed" };
    mockClient.from
      .mockReturnValueOnce(mockQueryBuilder(mockProject))
      .mockReturnValueOnce(mockQueryBuilder(null, bookError));

    await expect(createProject({ title: "My Novel" })).rejects.toEqual(bookError);
  });

  it("throws when chapters insert fails", async () => {
    mockClient.auth.getUser.mockResolvedValue({
      data: { user: { id: "test-user-id" } },
      error: null,
    });
    const chaptersError = { message: "Chapters insert failed" };
    mockClient.from
      .mockReturnValueOnce(mockQueryBuilder(mockProject))
      .mockReturnValueOnce(mockQueryBuilder(mockBook))
      .mockReturnValueOnce(mockQueryBuilder(null, chaptersError));

    await expect(createProject({ title: "My Novel" })).rejects.toEqual(chaptersError);
  });

  it("throws when plotline insert fails", async () => {
    mockClient.auth.getUser.mockResolvedValue({
      data: { user: { id: "test-user-id" } },
      error: null,
    });
    const plotlineError = { message: "Plotline insert failed" };
    mockClient.from
      .mockReturnValueOnce(mockQueryBuilder(mockProject))
      .mockReturnValueOnce(mockQueryBuilder(mockBook))
      .mockReturnValueOnce(mockQueryBuilder(null))
      .mockReturnValueOnce(mockQueryBuilder(null, plotlineError));

    await expect(createProject({ title: "My Novel" })).rejects.toEqual(plotlineError);
  });

  it("passes custom projectType when provided", async () => {
    mockClient.auth.getUser.mockResolvedValue({
      data: { user: { id: "test-user-id" } },
      error: null,
    });
    const seriesProject = { ...mockProject, project_type: "series" as const };
    const projectInsertBuilder = mockQueryBuilder(seriesProject);
    mockClient.from
      .mockReturnValueOnce(projectInsertBuilder)
      .mockReturnValueOnce(mockQueryBuilder(mockBook))
      .mockReturnValueOnce(mockQueryBuilder(null))
      .mockReturnValueOnce(mockQueryBuilder(null));

    await createProject({
      title: "My Series",
      description: "Epic saga",
      projectType: "series",
    });

    expect(projectInsertBuilder.insert).toHaveBeenCalledWith({
      user_id: "test-user-id",
      title: "My Series",
      description: "Epic saga",
      project_type: "series",
    });
  });
});

// ---------------------------------------------------------------------------
// updateProject
// ---------------------------------------------------------------------------

describe("updateProject", () => {
  it("updates project and returns updated data", async () => {
    const updated = { ...mockProject, title: "Renamed Novel" };
    mockClient.from.mockReturnValueOnce(mockQueryBuilder(updated));

    const result = await updateProject("proj-1", { title: "Renamed Novel" });

    expect(mockClient.from).toHaveBeenCalledWith("projects");
    expect(result).toEqual(updated);
  });

  it("throws when update fails", async () => {
    const dbError = { message: "Update failed" };
    mockClient.from.mockReturnValueOnce(mockQueryBuilder(null, dbError));

    await expect(updateProject("proj-1", { title: "Bad" })).rejects.toEqual(dbError);
  });
});

// ---------------------------------------------------------------------------
// deleteProject
// ---------------------------------------------------------------------------

describe("deleteProject", () => {
  it("soft-deletes project by setting deleted_at", async () => {
    mockClient.from.mockReturnValueOnce(mockQueryBuilder(null));

    await expect(deleteProject("proj-1")).resolves.toBeUndefined();
    expect(mockClient.from).toHaveBeenCalledWith("projects");
  });

  it("throws when soft delete fails", async () => {
    const dbError = { message: "Delete failed" };
    mockClient.from.mockReturnValueOnce(mockQueryBuilder(null, dbError));

    await expect(deleteProject("proj-1")).rejects.toEqual(dbError);
  });
});

// ---------------------------------------------------------------------------
// getFirstBookId
// ---------------------------------------------------------------------------

describe("getFirstBookId", () => {
  it("returns the id of the first book by sort_order", async () => {
    mockClient.from.mockReturnValueOnce(mockQueryBuilder({ id: "book-1" }));

    const result = await getFirstBookId("proj-1");

    expect(mockClient.from).toHaveBeenCalledWith("books");
    expect(result).toBe("book-1");
  });

  it("returns null when no books found", async () => {
    mockClient.from.mockReturnValueOnce(
      mockQueryBuilder(null, { message: "No rows", code: "PGRST116" })
    );

    const result = await getFirstBookId("proj-1");

    expect(result).toBeNull();
  });
});

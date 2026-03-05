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
  getNotes,
  getNote,
  createNote,
  updateNote,
  deleteNote,
  getNoteCategories,
} from "@/lib/services/notes";

beforeEach(() => {
  vi.clearAllMocks();
});

const mockNote = {
  id: "note-1",
  project_id: "proj-1",
  title: "Character Backstory Ideas",
  content: "Rochester was blinded in the fire at Thornfield.",
  category: "Characters",
  sort_order: 0,
  deleted_at: null,
  created_at: "2025-01-01T00:00:00Z",
  updated_at: "2025-01-02T00:00:00Z",
};

const mockNote2 = {
  ...mockNote,
  id: "note-2",
  title: "Plot Outline",
  content: "Act 1: arrival at Thornfield",
  category: "Plot",
  sort_order: 1,
  updated_at: "2025-01-03T00:00:00Z",
};

describe("getNotes", () => {
  it("returns notes for a project ordered by updated_at desc", async () => {
    mockClient.from.mockReturnValueOnce(
      mockQueryBuilder([mockNote2, mockNote])
    );

    const result = await getNotes("proj-1");

    expect(mockClient.from).toHaveBeenCalledWith("notes");
    expect(result).toEqual([mockNote2, mockNote]);
  });

  it("returns an empty array when no notes exist", async () => {
    mockClient.from.mockReturnValueOnce(mockQueryBuilder([]));

    const result = await getNotes("proj-1");
    expect(result).toEqual([]);
  });

  it("throws when the query errors", async () => {
    mockClient.from.mockReturnValueOnce(
      mockQueryBuilder(null, { message: "DB error" })
    );

    await expect(getNotes("proj-1")).rejects.toEqual({
      message: "DB error",
    });
  });
});

describe("getNote", () => {
  it("returns a single note by id", async () => {
    mockClient.from.mockReturnValueOnce(mockQueryBuilder(mockNote));

    const result = await getNote("note-1");
    expect(result).toEqual(mockNote);
  });

  it("returns null when the query errors", async () => {
    mockClient.from.mockReturnValueOnce(
      mockQueryBuilder(null, { message: "Not found" })
    );

    const result = await getNote("nonexistent");
    expect(result).toBeNull();
  });
});

describe("createNote", () => {
  it("creates a note with the next sort_order and default title", async () => {
    const createdNote = {
      ...mockNote,
      title: "Untitled Note",
      category: "",
      sort_order: 5,
    };
    mockClient.from
      .mockReturnValueOnce(mockQueryBuilder([{ sort_order: 4 }]))
      .mockReturnValueOnce(mockQueryBuilder(createdNote));

    const result = await createNote({ projectId: "proj-1" });

    expect(mockClient.from).toHaveBeenCalledTimes(2);
    expect(result).toEqual(createdNote);
  });

  it("creates a note with a custom title and category", async () => {
    const createdNote = {
      ...mockNote,
      sort_order: 0,
    };
    mockClient.from
      .mockReturnValueOnce(mockQueryBuilder([]))
      .mockReturnValueOnce(mockQueryBuilder(createdNote));

    const result = await createNote({
      projectId: "proj-1",
      title: "Character Backstory Ideas",
      category: "Characters",
    });

    expect(result.title).toBe("Character Backstory Ideas");
    expect(result.category).toBe("Characters");
  });

  it("starts at sort_order 0 when no notes exist", async () => {
    const createdNote = { ...mockNote, sort_order: 0 };
    mockClient.from
      .mockReturnValueOnce(mockQueryBuilder([]))
      .mockReturnValueOnce(mockQueryBuilder(createdNote));

    const result = await createNote({ projectId: "proj-1" });

    expect(result.sort_order).toBe(0);
  });

  it("throws when the insert errors", async () => {
    mockClient.from
      .mockReturnValueOnce(mockQueryBuilder([]))
      .mockReturnValueOnce(
        mockQueryBuilder(null, { message: "Insert failed" })
      );

    await expect(createNote({ projectId: "proj-1" })).rejects.toEqual({
      message: "Insert failed",
    });
  });
});

describe("updateNote", () => {
  it("updates a note and returns the updated record", async () => {
    const updated = { ...mockNote, title: "Revised Backstory" };
    mockClient.from.mockReturnValueOnce(mockQueryBuilder(updated));

    const result = await updateNote("note-1", { title: "Revised Backstory" });

    expect(mockClient.from).toHaveBeenCalledWith("notes");
    expect(result).toEqual(updated);
  });

  it("updates note content", async () => {
    const updated = { ...mockNote, content: "New content for the note." };
    mockClient.from.mockReturnValueOnce(mockQueryBuilder(updated));

    const result = await updateNote("note-1", {
      content: "New content for the note.",
    });

    expect(result.content).toBe("New content for the note.");
  });

  it("throws when the update errors", async () => {
    mockClient.from.mockReturnValueOnce(
      mockQueryBuilder(null, { message: "Update failed" })
    );

    await expect(
      updateNote("note-1", { title: "Revised Backstory" })
    ).rejects.toEqual({ message: "Update failed" });
  });
});

describe("deleteNote", () => {
  it("soft-deletes a note by setting deleted_at", async () => {
    mockClient.from.mockReturnValueOnce(mockQueryBuilder(null));

    await expect(deleteNote("note-1")).resolves.toBeUndefined();
    expect(mockClient.from).toHaveBeenCalledWith("notes");
  });

  it("throws when the soft-delete errors", async () => {
    mockClient.from.mockReturnValueOnce(
      mockQueryBuilder(null, { message: "Delete failed" })
    );

    await expect(deleteNote("note-1")).rejects.toEqual({
      message: "Delete failed",
    });
  });
});

describe("getNoteCategories", () => {
  it("returns distinct sorted categories", async () => {
    mockClient.from.mockReturnValueOnce(
      mockQueryBuilder([
        { category: "Plot" },
        { category: "Characters" },
        { category: "Plot" },
        { category: "Worldbuilding" },
      ])
    );

    const result = await getNoteCategories("proj-1");

    expect(mockClient.from).toHaveBeenCalledWith("notes");
    expect(result).toEqual(["Characters", "Plot", "Worldbuilding"]);
  });

  it("returns an empty array when no categories exist", async () => {
    mockClient.from.mockReturnValueOnce(mockQueryBuilder([]));

    const result = await getNoteCategories("proj-1");
    expect(result).toEqual([]);
  });

  it("throws when the query errors", async () => {
    mockClient.from.mockReturnValueOnce(
      mockQueryBuilder(null, { message: "Query failed" })
    );

    await expect(getNoteCategories("proj-1")).rejects.toEqual({
      message: "Query failed",
    });
  });
});

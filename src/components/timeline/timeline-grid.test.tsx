import React from "react";
import { act, fireEvent, render, screen, waitFor, within, cleanup } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Chapter, Plotline, Scene } from "@/lib/types/database";

const { drag } = vi.hoisted(() => ({ drag: { end: null as null | ((event: unknown) => void), cancel: null as null | (() => void) } }));
// Component tests isolate the mutation behavior; browser validation covers sensors.
vi.mock("@dnd-kit/core", async (original) => ({
  ...await original<typeof import("@dnd-kit/core")>(),
  DndContext: ({ children, onDragEnd, onDragCancel }: { children: React.ReactNode; onDragEnd: (event: unknown) => void; onDragCancel: () => void }) => {
    drag.end = onDragEnd;
    drag.cancel = onDragCancel;
    return <>{children}</>;
  },
  DragOverlay: () => null,
}));
vi.mock("./scene-detail-panel", () => ({ SceneDetailPanel: ({ onClose }: { onClose: () => void }) => <button onClick={onClose}>Close details</button> }));
vi.mock("@/lib/hooks/use-recent-scenes", () => ({ useRecentScenes: () => ({ trackScene: vi.fn() }) }));
import { TimelineGrid } from "./timeline-grid";

const scenes = ["A", "B", "C"].map((title, index) => ({ id: title, title, book_id: "book", chapter_id: "chapter", plotline_id: "plot", position: index,
  summary: "", conflict: "", pov_character_id: null, archived_at: null, deleted_at: null, created_at: "", updated_at: "" } satisfies Scene));
const chapter = { id: "chapter", title: "Chapter 1", book_id: "book", sort_order: 0 } as Chapter;
const plotline = { id: "plot", title: "Plot", color: "#123456", book_id: "book", sort_order: 0 } as Plotline;
let requests: Record<string, unknown>[];
let save: (body: Record<string, unknown>) => Promise<Response>;
let refreshFails = false;
let serverScenes: Scene[];
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

beforeEach(() => {
  requests = [];
  refreshFails = false;
  serverScenes = scenes;
  save = async (body) => json((body.sceneIds as string[]).map((id, position) => ({ ...scenes.find((scene) => scene.id === id), position })));
  vi.stubGlobal("fetch", vi.fn(async (_url: string, options: RequestInit) => {
    const body = JSON.parse(options.body as string);
    requests.push(body);
    if (body.action === "reorderScenes") return save(body);
    if (body.action === "getSceneOrder") return refreshFails ? json({}, 500) : json(serverScenes);
    return json([]);
  }));
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

function mount(initialScenes = scenes) {
  const result = render(<TimelineGrid bookId="book" projectId="project" chapters={[chapter]} plotlines={[plotline]} scenes={initialScenes} characters={[]} places={[]} tags={[]} />);
  const mobile = result.container.querySelector(".md\\:hidden") as HTMLElement;
  return { ...result, mobile, up: (name: string) => within(mobile).getByRole("button", { name: `Move ${name} up` }),
    titles: () => within(mobile).getAllByRole("button").filter((button) => ["A", "B", "C"].includes(button.textContent ?? "")).map((button) => button.textContent) };
}

describe("scene ordering", () => {
  it("sorts legacy position ties deterministically", () => {
    const view = mount([...scenes].reverse().map((scene) => ({ ...scene, position: 0 })));
    expect(view.titles()).toEqual(["A", "B", "C"]);
  });

  it("reconciles scenes moved to another cell while a save is rejected", async () => {
    save = async () => json({ error: "Scenes changed" }, 409);
    serverScenes = scenes.map((scene) => scene.id === "C" ? { ...scene, chapter_id: "another-chapter" } : scene);
    const view = mount();
    fireEvent.click(view.up("C"));
    await waitFor(() => expect(view.titles()).toEqual(["A", "B"]));
    expect(screen.getByRole("alert")).toHaveTextContent("Scenes changed");
  });

  it("moves scenes optimistically, persists complete prior membership, and respects boundaries", async () => {
    let finish!: (response: Response) => void;
    save = () => new Promise((resolve) => { finish = resolve; });
    const view = mount();
    expect(view.up("A")).toBeDisabled();
    expect(within(view.mobile).getByRole("button", { name: "Move C down" })).toBeDisabled();
    fireEvent.click(view.up("C"));
    expect(view.titles()).toEqual(["A", "C", "B"]);
    expect(view.up("C")).toBeDisabled();
    expect(requests.find((body) => body.action === "reorderScenes")).toMatchObject({ expectedIds: ["A", "B", "C"], sceneIds: ["A", "C", "B"] });
    await act(async () => finish(json([{ ...scenes[0], position: 0 }, { ...scenes[2], position: 1 }, { ...scenes[1], position: 2 }])));
    expect(view.up("C")).not.toBeDisabled();
    expect(view.up("C")).toHaveFocus();
    expect(screen.getByRole("status")).toHaveTextContent("Moved C to position 2 of 3");
  });

  it("rolls back a rejected save and refreshes the authoritative order", async () => {
    save = async () => json({ error: "Scenes changed while saving" }, 409);
    const view = mount();
    fireEvent.click(view.up("C"));
    await waitFor(() => expect(view.titles()).toEqual(["A", "B", "C"]));
    expect(screen.getByRole("alert")).toHaveTextContent("Scenes changed");
    expect(requests.some((body) => body.action === "getSceneOrder")).toBe(true);
    await waitFor(() => expect(view.up("C")).not.toBeDisabled());
  });

  it("keeps ordering locked if both save and authoritative reload fail", async () => {
    save = async () => { throw new Error("offline"); };
    refreshFails = true;
    const view = mount();
    fireEvent.click(view.up("C"));
    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("Reload the page"));
    expect(view.up("C")).toBeDisabled();
    expect(view.titles()).toEqual(["A", "B", "C"]);
  });

  it("same-cell drops reorder while cancelled and self drops do not write", async () => {
    const view = mount();
    act(() => drag.end?.({ active: { id: "C" }, over: null }));
    act(() => drag.cancel?.());
    act(() => drag.end?.({ active: { id: "C" }, over: { data: { current: { type: "scene", scene: scenes[2] } } } }));
    expect(requests.some((body) => body.action === "reorderScenes")).toBe(false);
    act(() => drag.end?.({ active: { id: "C" }, over: { data: { current: { type: "scene", scene: scenes[0] } } } }));
    await waitFor(() => expect(view.titles()).toEqual(["C", "A", "B"]));
  });

  it("clicking a card still opens details without reordering", async () => {
    const view = mount();
    fireEvent.click(within(view.mobile).getByRole("button", { name: "A" }));
    expect(screen.getByRole("button", { name: "Close details" })).toBeInTheDocument();
    expect(requests.some((body) => body.action === "reorderScenes")).toBe(false);
  });
});

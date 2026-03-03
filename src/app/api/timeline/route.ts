import { addChapter, addPlotline, deleteChapter, deletePlotline, updateChapter, updatePlotline, reorderChapters, reorderPlotlines } from "@/lib/services/timeline";
import { createScene, updateScene, deleteScene, moveScene } from "@/lib/services/scenes";
import { PLOTLINE_COLORS } from "@/lib/config/constants";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case "addChapter": {
        const chapter = await addChapter(body.bookId, body.title ?? `Chapter ${body.index ?? ""}`.trim());
        return NextResponse.json(chapter);
      }
      case "updateChapter": {
        const chapter = await updateChapter(body.id, { title: body.title });
        return NextResponse.json(chapter);
      }
      case "deleteChapter": {
        await deleteChapter(body.id);
        return NextResponse.json({ ok: true });
      }
      case "addPlotline": {
        const color = PLOTLINE_COLORS[body.colorIndex ?? 0] ?? PLOTLINE_COLORS[0];
        const plotline = await addPlotline(body.bookId, body.title ?? "New Plotline", color);
        return NextResponse.json(plotline);
      }
      case "updatePlotline": {
        const plotline = await updatePlotline(body.id, { title: body.title, color: body.color });
        return NextResponse.json(plotline);
      }
      case "deletePlotline": {
        await deletePlotline(body.id);
        return NextResponse.json({ ok: true });
      }
      case "reorderChapters": {
        await reorderChapters(body.bookId, body.chapterIds);
        return NextResponse.json({ ok: true });
      }
      case "reorderPlotlines": {
        await reorderPlotlines(body.bookId, body.plotlineIds);
        return NextResponse.json({ ok: true });
      }
      case "addScene": {
        const scene = await createScene({
          bookId: body.bookId,
          chapterId: body.chapterId,
          plotlineId: body.plotlineId,
          title: body.title,
        });
        return NextResponse.json(scene);
      }
      case "updateScene": {
        const scene = await updateScene(body.id, body.data);
        return NextResponse.json(scene);
      }
      case "deleteScene": {
        await deleteScene(body.id);
        return NextResponse.json({ ok: true });
      }
      case "moveScene": {
        await moveScene(body.sceneId, body.chapterId, body.plotlineId, body.position ?? 0);
        return NextResponse.json({ ok: true });
      }
      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }
  } catch (error) {
    console.error("Timeline API error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

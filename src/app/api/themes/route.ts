import { NextResponse } from "next/server";
import {
  getThemes,
  getThemesWithCounts,
  createTheme,
  updateTheme,
  deleteTheme,
  getSceneThemeIds,
  addThemeToScene,
  removeThemeFromScene,
  getThemeScenes,
} from "@/lib/services/themes";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case "list": {
        const { projectId } = body;
        if (!projectId) return NextResponse.json({ error: "projectId required" }, { status: 400 });
        const themes = await getThemes(projectId);
        return NextResponse.json(themes);
      }

      case "listWithCounts": {
        const { projectId } = body;
        if (!projectId) return NextResponse.json({ error: "projectId required" }, { status: 400 });
        const themes = await getThemesWithCounts(projectId);
        return NextResponse.json(themes);
      }

      case "create": {
        const { projectId, name, color, description } = body;
        if (!projectId || !name) {
          return NextResponse.json({ error: "projectId and name required" }, { status: 400 });
        }
        const theme = await createTheme(projectId, name, color ?? "#6366f1", description ?? "");
        return NextResponse.json(theme);
      }

      case "update": {
        const { id, data } = body;
        if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
        const theme = await updateTheme(id, data);
        return NextResponse.json(theme);
      }

      case "delete": {
        const { id } = body;
        if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
        await deleteTheme(id);
        return NextResponse.json({ ok: true });
      }

      case "getSceneThemes": {
        const { sceneId } = body;
        if (!sceneId) return NextResponse.json({ error: "sceneId required" }, { status: 400 });
        const ids = await getSceneThemeIds(sceneId);
        return NextResponse.json(ids);
      }

      case "addToScene": {
        const { sceneId, themeId } = body;
        if (!sceneId || !themeId) {
          return NextResponse.json({ error: "sceneId and themeId required" }, { status: 400 });
        }
        await addThemeToScene(sceneId, themeId);
        return NextResponse.json({ ok: true });
      }

      case "removeFromScene": {
        const { sceneId, themeId } = body;
        if (!sceneId || !themeId) {
          return NextResponse.json({ error: "sceneId and themeId required" }, { status: 400 });
        }
        await removeThemeFromScene(sceneId, themeId);
        return NextResponse.json({ ok: true });
      }

      case "getThemeScenes": {
        const { themeId } = body;
        if (!themeId) return NextResponse.json({ error: "themeId required" }, { status: 400 });
        const scenes = await getThemeScenes(themeId);
        return NextResponse.json(scenes);
      }

      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }
  } catch (error) {
    console.error("Themes API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

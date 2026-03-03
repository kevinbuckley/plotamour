import {
  getTags,
  createTag,
  updateTag,
  deleteTag,
  addTagToScene,
  removeTagFromScene,
  getSceneTagIds,
  addTagToCharacter,
  removeTagFromCharacter,
  getCharacterTagIds,
  addTagToPlace,
  removeTagFromPlace,
  getPlaceTagIds,
} from "@/lib/services/tags";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case "list": {
        const tags = await getTags(body.projectId);
        return NextResponse.json(tags);
      }
      case "create": {
        const tag = await createTag({
          projectId: body.projectId,
          name: body.name,
          color: body.color,
          category: body.category,
        });
        return NextResponse.json(tag);
      }
      case "update": {
        const tag = await updateTag(body.id, body.data);
        return NextResponse.json(tag);
      }
      case "delete": {
        await deleteTag(body.id);
        return NextResponse.json({ ok: true });
      }
      // Scene tags
      case "addToScene": {
        await addTagToScene(body.sceneId, body.tagId);
        return NextResponse.json({ ok: true });
      }
      case "removeFromScene": {
        await removeTagFromScene(body.sceneId, body.tagId);
        return NextResponse.json({ ok: true });
      }
      case "getSceneTags": {
        const ids = await getSceneTagIds(body.sceneId);
        return NextResponse.json(ids);
      }
      // Character tags
      case "addToCharacter": {
        await addTagToCharacter(body.characterId, body.tagId);
        return NextResponse.json({ ok: true });
      }
      case "removeFromCharacter": {
        await removeTagFromCharacter(body.characterId, body.tagId);
        return NextResponse.json({ ok: true });
      }
      case "getCharacterTags": {
        const ids = await getCharacterTagIds(body.characterId);
        return NextResponse.json(ids);
      }
      // Place tags
      case "addToPlace": {
        await addTagToPlace(body.placeId, body.tagId);
        return NextResponse.json({ ok: true });
      }
      case "removeFromPlace": {
        await removeTagFromPlace(body.placeId, body.tagId);
        return NextResponse.json({ ok: true });
      }
      case "getPlaceTags": {
        const ids = await getPlaceTagIds(body.placeId);
        return NextResponse.json(ids);
      }
      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }
  } catch (error) {
    console.error("Tags API error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

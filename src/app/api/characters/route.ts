import {
  getCharacters,
  createCharacter,
  updateCharacter,
  deleteCharacter,
  linkCharacterToScene,
  unlinkCharacterFromScene,
  getSceneCharacterIds,
  getCharacterSceneIds,
} from "@/lib/services/characters";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case "list": {
        const characters = await getCharacters(body.projectId);
        return NextResponse.json(characters);
      }
      case "create": {
        const character = await createCharacter({
          projectId: body.projectId,
          name: body.name ?? "New Character",
          description: body.description,
        });
        return NextResponse.json(character);
      }
      case "update": {
        const character = await updateCharacter(body.id, body.data);
        return NextResponse.json(character);
      }
      case "delete": {
        await deleteCharacter(body.id);
        return NextResponse.json({ ok: true });
      }
      case "linkToScene": {
        await linkCharacterToScene(body.sceneId, body.characterId);
        return NextResponse.json({ ok: true });
      }
      case "unlinkFromScene": {
        await unlinkCharacterFromScene(body.sceneId, body.characterId);
        return NextResponse.json({ ok: true });
      }
      case "getSceneCharacters": {
        const ids = await getSceneCharacterIds(body.sceneId);
        return NextResponse.json(ids);
      }
      case "getCharacterScenes": {
        const ids = await getCharacterSceneIds(body.characterId);
        return NextResponse.json(ids);
      }
      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }
  } catch (error) {
    console.error("Characters API error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

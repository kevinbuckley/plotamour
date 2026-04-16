import {
  getCharacters,
  createCharacter,
  updateCharacter,
  deleteCharacter,
  linkCharacterToScene,
  unlinkCharacterFromScene,
  getSceneCharacterIds,
  getCharacterSceneIds,
  getCharacterScenesDetailed,
  getCharacterRelations,
  addCharacterRelation,
  updateCharacterRelation,
  deleteCharacterRelation,
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
      case "getCharacterScenesDetailed": {
        const scenes = await getCharacterScenesDetailed(body.characterId);
        return NextResponse.json(scenes);
      }
      case "getRelations": {
        const relations = await getCharacterRelations(body.characterId);
        return NextResponse.json(relations);
      }
      case "addRelation": {
        const relation = await addCharacterRelation({
          fromCharacterId: body.fromCharacterId,
          toCharacterId: body.toCharacterId,
          relationType: body.relationType ?? "",
          description: body.description,
        });
        return NextResponse.json(relation);
      }
      case "updateRelation": {
        const relation = await updateCharacterRelation(body.id, {
          relation_type: body.relationType,
          description: body.description,
        });
        return NextResponse.json(relation);
      }
      case "deleteRelation": {
        await deleteCharacterRelation(body.id);
        return NextResponse.json({ ok: true });
      }
      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }
  } catch (error) {
    console.error("Characters API error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

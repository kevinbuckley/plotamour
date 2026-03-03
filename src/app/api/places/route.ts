import {
  getPlaces,
  createPlace,
  updatePlace,
  deletePlace,
  linkPlaceToScene,
  unlinkPlaceFromScene,
  getScenePlaceIds,
  getPlaceSceneIds,
} from "@/lib/services/places";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case "list": {
        const places = await getPlaces(body.projectId);
        return NextResponse.json(places);
      }
      case "create": {
        const place = await createPlace({
          projectId: body.projectId,
          name: body.name ?? "New Place",
          description: body.description,
        });
        return NextResponse.json(place);
      }
      case "update": {
        const place = await updatePlace(body.id, body.data);
        return NextResponse.json(place);
      }
      case "delete": {
        await deletePlace(body.id);
        return NextResponse.json({ ok: true });
      }
      case "linkToScene": {
        await linkPlaceToScene(body.sceneId, body.placeId);
        return NextResponse.json({ ok: true });
      }
      case "unlinkFromScene": {
        await unlinkPlaceFromScene(body.sceneId, body.placeId);
        return NextResponse.json({ ok: true });
      }
      case "getScenePlaces": {
        const ids = await getScenePlaceIds(body.sceneId);
        return NextResponse.json(ids);
      }
      case "getPlaceScenes": {
        const ids = await getPlaceSceneIds(body.placeId);
        return NextResponse.json(ids);
      }
      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }
  } catch (error) {
    console.error("Places API error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

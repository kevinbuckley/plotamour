import {
  getPromisesForBook,
  getPromisesForScene,
  createPromise,
  updatePromise,
  deletePromise,
} from "@/lib/services/story-promises";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case "getForBook": {
        const promises = await getPromisesForBook(body.bookId);
        return NextResponse.json(promises);
      }
      case "getForScene": {
        const promises = await getPromisesForScene(body.sceneId);
        return NextResponse.json(promises);
      }
      case "create": {
        const promise = await createPromise({
          bookId: body.bookId,
          description: body.description,
          plantSceneId: body.plantSceneId,
        });
        return NextResponse.json(promise);
      }
      case "update": {
        const promise = await updatePromise(body.id, body.data);
        return NextResponse.json(promise);
      }
      case "delete": {
        await deletePromise(body.id);
        return NextResponse.json({ ok: true });
      }
      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }
  } catch (error) {
    console.error("Story promises API error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

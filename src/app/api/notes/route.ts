import {
  getNotes,
  createNote,
  updateNote,
  deleteNote,
  getNoteCategories,
} from "@/lib/services/notes";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case "list": {
        const notes = await getNotes(body.projectId);
        return NextResponse.json(notes);
      }
      case "create": {
        const note = await createNote({
          projectId: body.projectId,
          title: body.title,
          category: body.category,
        });
        return NextResponse.json(note);
      }
      case "update": {
        const note = await updateNote(body.id, body.data);
        return NextResponse.json(note);
      }
      case "delete": {
        await deleteNote(body.id);
        return NextResponse.json({ ok: true });
      }
      case "categories": {
        const categories = await getNoteCategories(body.projectId);
        return NextResponse.json(categories);
      }
      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }
  } catch (error) {
    console.error("Notes API error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

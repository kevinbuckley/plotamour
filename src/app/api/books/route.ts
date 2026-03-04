import { NextResponse } from "next/server";
import { getBooks, createBook, updateBook, deleteBook, getBookStats } from "@/lib/services/books";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case "list": {
        const { projectId } = body;
        if (!projectId) {
          return NextResponse.json({ error: "projectId required" }, { status: 400 });
        }
        const books = await getBooks(projectId);
        return NextResponse.json(books);
      }

      case "create": {
        const { projectId, title, description } = body;
        if (!projectId || !title?.trim()) {
          return NextResponse.json({ error: "projectId and title required" }, { status: 400 });
        }
        const book = await createBook(projectId, {
          title: title.trim(),
          description: description?.trim(),
        });
        return NextResponse.json(book);
      }

      case "update": {
        const { id, title, description, sort_order } = body;
        if (!id) {
          return NextResponse.json({ error: "id required" }, { status: 400 });
        }
        const updated = await updateBook(id, { title, description, sort_order });
        return NextResponse.json(updated);
      }

      case "delete": {
        const { id: deleteId } = body;
        if (!deleteId) {
          return NextResponse.json({ error: "id required" }, { status: 400 });
        }
        await deleteBook(deleteId);
        return NextResponse.json({ success: true });
      }

      case "stats": {
        const { bookId } = body;
        if (!bookId) {
          return NextResponse.json({ error: "bookId required" }, { status: 400 });
        }
        const stats = await getBookStats(bookId);
        return NextResponse.json(stats);
      }

      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }
  } catch (error) {
    console.error("Books API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

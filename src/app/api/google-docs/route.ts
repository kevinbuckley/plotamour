import { createDocForScene, getDocForScene, syncDocMetadata, GoogleAuthError } from "@/lib/services/google-docs";
import { getScene } from "@/lib/services/scenes";
import { createClient } from "@/lib/db/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case "createDoc": {
        const scene = await getScene(body.sceneId);
        if (!scene) return NextResponse.json({ error: "Scene not found" }, { status: 404 });

        const supabase = await createClient();

        // Get book title and chapter info
        const { data: book } = await supabase
          .from("books")
          .select("title")
          .eq("id", scene.book_id)
          .single();

        const { data: chapters } = await supabase
          .from("chapters")
          .select("id, sort_order")
          .eq("book_id", scene.book_id)
          .order("sort_order", { ascending: true });

        const chapterIndex = chapters?.findIndex((c) => c.id === scene.chapter_id) ?? 0;

        try {
          const doc = await createDocForScene({
            sceneId: scene.id,
            bookTitle: book?.title ?? "Untitled",
            chapterNumber: chapterIndex + 1,
            sceneTitle: scene.title,
            summary: scene.summary || undefined,
          });

          if (!doc) {
            return NextResponse.json(
              { error: "Failed to create Google Doc. Please try again." },
              { status: 400 }
            );
          }

          return NextResponse.json({ url: doc.google_doc_url, doc });
        } catch (err) {
          if (err instanceof GoogleAuthError) {
            return NextResponse.json(
              {
                error: "Google Docs access not connected. Please connect your Google account.",
                needsReconnect: true,
              },
              { status: 400 }
            );
          }
          throw err;
        }
      }

      case "syncDoc": {
        const doc = await syncDocMetadata(body.sceneId);
        return NextResponse.json({ doc });
      }

      case "getDoc": {
        const doc = await getDocForScene(body.sceneId);
        return NextResponse.json({ doc });
      }

      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }
  } catch (error) {
    console.error("Google Docs API error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

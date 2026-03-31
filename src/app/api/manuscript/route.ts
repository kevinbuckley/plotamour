import { NextResponse } from "next/server";
import {
  compileManuscript,
  generateHtmlManuscript,
  generateTextManuscript,
} from "@/lib/services/manuscript";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { bookId, format = "html" } = body;

    if (!bookId) {
      return NextResponse.json({ error: "bookId required" }, { status: 400 });
    }

    const data = await compileManuscript(bookId);

    if (data.scenes.length === 0) {
      return NextResponse.json(
        {
          error: "No scenes with Google Docs content found.",
          skippedScenes: data.skippedScenes,
        },
        { status: 400 }
      );
    }

    const filename = sanitizeFilename(data.bookTitle);

    switch (format) {
      case "text": {
        const text = generateTextManuscript(data);
        return new NextResponse(text, {
          headers: {
            "Content-Type": "text/plain; charset=utf-8",
            "Content-Disposition": `attachment; filename="${filename}-manuscript.txt"`,
          },
        });
      }

      case "html":
      default: {
        const html = generateHtmlManuscript(data);
        return new NextResponse(html, {
          headers: {
            "Content-Type": "text/html; charset=utf-8",
            "Content-Disposition": `attachment; filename="${filename}-manuscript.html"`,
          },
        });
      }
    }
  } catch (error) {
    console.error("Manuscript compile error:", error);
    const message = error instanceof Error ? error.message : "Compilation failed";

    if (message.includes("not connected") || message.includes("reconnect")) {
      return NextResponse.json(
        { error: message, needsReconnect: true },
        { status: 401 }
      );
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9-_ ]/g, "").replace(/\s+/g, "-");
}

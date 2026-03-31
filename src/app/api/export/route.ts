import { NextResponse } from "next/server";
import {
  getExportData,
  generateTextOutline,
  generateHtmlOutline,
} from "@/lib/services/export";
import { renderOutlinePdf } from "@/lib/services/pdf";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { bookId, format } = body;

    if (!bookId) {
      return NextResponse.json({ error: "bookId required" }, { status: 400 });
    }

    const data = await getExportData(bookId);

    switch (format) {
      case "pdf": {
        const pdfBytes = await renderOutlinePdf(data);
        return new Response(pdfBytes as unknown as BodyInit, {
          headers: {
            "Content-Type": "application/pdf",
            "Content-Disposition": `attachment; filename="${sanitizeFilename(data.projectTitle)}-outline.pdf"`,
          },
        });
      }

      case "text": {
        const text = generateTextOutline(data);
        return new NextResponse(text, {
          headers: {
            "Content-Type": "text/plain; charset=utf-8",
            "Content-Disposition": `attachment; filename="${sanitizeFilename(data.projectTitle)}-outline.txt"`,
          },
        });
      }

      case "html": {
        const html = generateHtmlOutline(data);
        return new NextResponse(html, {
          headers: {
            "Content-Type": "text/html; charset=utf-8",
            "Content-Disposition": `attachment; filename="${sanitizeFilename(data.projectTitle)}-outline.html"`,
          },
        });
      }

      case "json":
      default: {
        return NextResponse.json(data);
      }
    }
  } catch (error) {
    console.error("Export API error:", error);
    return NextResponse.json(
      { error: "Export failed" },
      { status: 500 }
    );
  }
}

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9-_ ]/g, "").replace(/\s+/g, "-");
}

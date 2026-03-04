import { NextResponse } from "next/server";
import { applyTemplate, listTemplates, saveBookAsTemplate } from "@/lib/services/templates";
import { getTemplateById } from "@/lib/data/templates";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case "list": {
        const templates = listTemplates();
        return NextResponse.json(templates);
      }

      case "get": {
        const { templateId } = body;
        const template = getTemplateById(templateId);
        if (!template) {
          return NextResponse.json({ error: "Template not found" }, { status: 404 });
        }
        return NextResponse.json(template);
      }

      case "apply": {
        const { bookId, templateId } = body;
        if (!bookId || !templateId) {
          return NextResponse.json({ error: "bookId and templateId required" }, { status: 400 });
        }
        const result = await applyTemplate(bookId, templateId);
        return NextResponse.json(result);
      }

      case "saveFromBook": {
        const { bookId: saveBookId, name } = body;
        if (!saveBookId || !name) {
          return NextResponse.json({ error: "bookId and name required" }, { status: 400 });
        }
        const template = await saveBookAsTemplate(saveBookId, name);
        return NextResponse.json(template);
      }

      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }
  } catch (error) {
    console.error("Templates API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

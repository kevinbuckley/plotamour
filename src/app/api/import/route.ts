import { NextResponse } from "next/server";
import { importPlottrFile, previewPlottrFile } from "@/lib/services/plottr-import";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, data } = body;

    if (!data) {
      return NextResponse.json(
        { error: "No file data provided" },
        { status: 400 }
      );
    }

    switch (action) {
      case "preview": {
        const preview = previewPlottrFile(data);
        return NextResponse.json(preview);
      }

      case "import": {
        const result = await importPlottrFile(data);
        return NextResponse.json(result);
      }

      default:
        return NextResponse.json(
          { error: "Unknown action. Use 'preview' or 'import'." },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Import API error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Import failed" },
      { status: 500 }
    );
  }
}

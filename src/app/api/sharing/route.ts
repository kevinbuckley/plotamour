import { NextResponse } from "next/server";
import { getShare, createShare, deleteShare } from "@/lib/services/sharing";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case "getShare": {
        const { projectId } = body;
        if (!projectId) return NextResponse.json({ error: "projectId required" }, { status: 400 });
        const share = await getShare(projectId);
        return NextResponse.json(share);
      }

      case "createShare": {
        const { projectId, label } = body;
        if (!projectId) return NextResponse.json({ error: "projectId required" }, { status: 400 });
        const share = await createShare(projectId, label ?? "");
        return NextResponse.json(share);
      }

      case "deleteShare": {
        const { shareId } = body;
        if (!shareId) return NextResponse.json({ error: "shareId required" }, { status: 400 });
        await deleteShare(shareId);
        return NextResponse.json({ ok: true });
      }

      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }
  } catch (error) {
    console.error("Sharing API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

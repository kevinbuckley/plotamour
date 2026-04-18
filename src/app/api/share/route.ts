import { NextResponse } from "next/server";
import { resolveShareToken, getSharedProjectData } from "@/lib/services/sharing";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const { token } = await request.json();
    if (!token) return NextResponse.json({ error: "token required" }, { status: 400 });

    const resolved = await resolveShareToken(token);
    if (!resolved) {
      return NextResponse.json({ error: "Invalid or expired share link" }, { status: 404 });
    }

    const data = await getSharedProjectData(resolved.projectId);
    if (!data) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    return NextResponse.json({ ...data, shareLabel: resolved.label });
  } catch (error) {
    console.error("Share API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

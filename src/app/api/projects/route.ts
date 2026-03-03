import { createProject } from "@/lib/services/projects";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, description } = body;

    if (!title?.trim()) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const { project, bookId } = await createProject({
      title: title.trim(),
      description: description?.trim(),
    });

    return NextResponse.json({ projectId: project.id, bookId });
  } catch (error) {
    console.error("Failed to create project:", error);
    return NextResponse.json({ error: "Failed to create project" }, { status: 500 });
  }
}

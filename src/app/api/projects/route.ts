import { createProject, updateProject } from "@/lib/services/projects";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, description, projectType } = body;

    if (!title?.trim()) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const { project, bookId } = await createProject({
      title: title.trim(),
      description: description?.trim(),
      projectType,
    });

    return NextResponse.json({ projectId: project.id, bookId });
  } catch (error) {
    console.error("Failed to create project:", error);
    return NextResponse.json({ error: "Failed to create project" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, title, description } = body;

    if (!id) {
      return NextResponse.json({ error: "Project ID is required" }, { status: 400 });
    }

    const updates: { title?: string; description?: string } = {};
    if (title !== undefined) updates.title = title.trim();
    if (description !== undefined) updates.description = description.trim();

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    if (updates.title !== undefined && !updates.title) {
      return NextResponse.json({ error: "Title cannot be empty" }, { status: 400 });
    }

    const project = await updateProject(id, updates);
    return NextResponse.json(project);
  } catch (error) {
    console.error("Failed to update project:", error);
    return NextResponse.json({ error: "Failed to update project" }, { status: 500 });
  }
}

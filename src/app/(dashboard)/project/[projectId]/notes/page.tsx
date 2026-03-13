import { getProject } from "@/lib/services/projects";
import { getNotes } from "@/lib/services/notes";
import { redirect } from "next/navigation";
import { NotesList } from "@/components/notes/notes-list";
import { EditableProjectTitle } from "@/components/shared/editable-project-title";

export default async function NotesPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const project = await getProject(projectId);
  if (!project) redirect("/projects");

  const notes = await getNotes(projectId);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-border px-6 py-3.5">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">Notes</p>
          <EditableProjectTitle projectId={projectId} initialTitle={project.title} />
        </div>
      </div>
      <div className="flex-1 overflow-hidden">
        <NotesList projectId={projectId} initialNotes={notes} />
      </div>
    </div>
  );
}

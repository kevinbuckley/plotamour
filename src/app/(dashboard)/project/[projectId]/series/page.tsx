import { getProject } from "@/lib/services/projects";
import { getBooks } from "@/lib/services/books";
import { redirect } from "next/navigation";
import { SeriesDashboard } from "@/components/series/series-dashboard";
import { EditableProjectTitle } from "@/components/shared/editable-project-title";

export default async function SeriesPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const project = await getProject(projectId);
  if (!project) redirect("/projects");

  // Only series projects have this page
  if (project.project_type !== "series") {
    redirect(`/project/${projectId}/timeline`);
  }

  const books = await getBooks(projectId);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-border px-6 py-3.5">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
            Series Overview
          </p>
          <EditableProjectTitle projectId={projectId} initialTitle={project.title} />
        </div>
      </div>
      <div className="flex-1 overflow-auto p-6">
        <SeriesDashboard project={project} books={books} />
      </div>
    </div>
  );
}

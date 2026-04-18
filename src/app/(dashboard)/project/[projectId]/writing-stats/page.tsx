import { getProject } from "@/lib/services/projects";
import { getWritingStats } from "@/lib/services/writing-stats";
import { redirect } from "next/navigation";
import { EditableProjectTitle } from "@/components/shared/editable-project-title";
import { WritingStatsView } from "@/components/writing-stats/writing-stats-view";

export const dynamic = "force-dynamic";

export default async function WritingStatsPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const project = await getProject(projectId);
  if (!project) redirect("/projects");

  const stats = await getWritingStats(projectId);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 border-b border-border px-4 sm:px-6 py-3.5">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
            Writing Stats
          </p>
          <EditableProjectTitle projectId={projectId} initialTitle={project.title} />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        <WritingStatsView projectId={projectId} initialStats={stats} />
      </div>
    </div>
  );
}

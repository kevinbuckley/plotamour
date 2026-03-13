import { getProject, getFirstBookId } from "@/lib/services/projects";
import { getTimelineData } from "@/lib/services/timeline";
import { OutlineView } from "@/components/outline/outline-view";
import { redirect } from "next/navigation";

export default async function OutlinePage({
  params,
  searchParams,
}: {
  params: Promise<{ projectId: string }>;
  searchParams: Promise<{ bookId?: string }>;
}) {
  const { projectId } = await params;
  const { bookId: bookIdParam } = await searchParams;

  const project = await getProject(projectId);
  if (!project) redirect("/projects");

  const bookId = bookIdParam ?? (await getFirstBookId(projectId));
  if (!bookId) redirect("/projects");

  const timeline = await getTimelineData(bookId);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-border px-6 py-3.5">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">Outline</p>
          <h1 className="mt-0.5 text-[15px] font-semibold tracking-tight">{project.title}</h1>
        </div>
      </div>
      <div className="flex-1 overflow-auto">
        <OutlineView
          projectId={projectId}
          chapters={timeline.chapters}
          plotlines={timeline.plotlines}
          scenes={timeline.scenes}
        />
      </div>
    </div>
  );
}

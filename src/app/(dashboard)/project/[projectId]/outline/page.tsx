import { getProject, getFirstBookId } from "@/lib/services/projects";
import { getTimelineData } from "@/lib/services/timeline";
import { getBook } from "@/lib/services/books";
import { OutlineView } from "@/components/outline/outline-view";
import { ExportMenu } from "@/components/shared/export-menu";
import { EditableProjectTitle } from "@/components/shared/editable-project-title";
import { EditableBookTitle } from "@/components/shared/editable-book-title";
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

  const [timeline, book] = await Promise.all([
    getTimelineData(bookId),
    getBook(bookId),
  ]);

  const isSeries = project.project_type === "series";

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between gap-3 border-b border-border px-4 sm:px-6 py-3.5">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">Outline</p>
          <EditableProjectTitle projectId={projectId} initialTitle={project.title} />
          {isSeries && book && (
            <EditableBookTitle bookId={bookId} initialTitle={book.title} />
          )}
        </div>
        <ExportMenu bookId={bookId} />
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

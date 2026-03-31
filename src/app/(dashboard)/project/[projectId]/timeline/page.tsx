import { getProject, getFirstBookId } from "@/lib/services/projects";
import { getTimelineData } from "@/lib/services/timeline";
import { getCharacters } from "@/lib/services/characters";
import { getPlaces } from "@/lib/services/places";
import { getTags } from "@/lib/services/tags";
import { getBook } from "@/lib/services/books";
import { TimelineGrid } from "@/components/timeline/timeline-grid";
import { ExportMenu } from "@/components/shared/export-menu";
import { EditableProjectTitle } from "@/components/shared/editable-project-title";
import { EditableBookTitle } from "@/components/shared/editable-book-title";
import { ResumeBanner } from "@/components/shared/resume-banner";
import { redirect } from "next/navigation";

export default async function TimelinePage({
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

  const [timeline, characters, places, tags, book] = await Promise.all([
    getTimelineData(bookId),
    getCharacters(projectId),
    getPlaces(projectId),
    getTags(projectId),
    getBook(bookId),
  ]);

  const isSeries = project.project_type === "series";

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 border-b border-border px-4 sm:px-6 py-3.5">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">Timeline</p>
          <div className="flex items-center gap-2">
            <EditableProjectTitle projectId={projectId} initialTitle={project.title} />
            <ExportMenu bookId={bookId} />
          </div>
          {isSeries && book && (
            <EditableBookTitle bookId={bookId} initialTitle={book.title} />
          )}
        </div>
      </div>
      <ResumeBanner projectId={projectId} bookId={bookId} />
      <div className="flex-1 overflow-auto">
        <TimelineGrid
          bookId={bookId}
          projectId={projectId}
          chapters={timeline.chapters}
          plotlines={timeline.plotlines}
          scenes={timeline.scenes}
          characters={characters}
          places={places}
          tags={tags}
        />
      </div>
    </div>
  );
}

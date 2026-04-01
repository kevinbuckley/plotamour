import { getProject, getFirstBookId } from "@/lib/services/projects";
import { getTimelineData } from "@/lib/services/timeline";
import { getCharacters, getCharacterPresenceMatrix } from "@/lib/services/characters";
import { getBook } from "@/lib/services/books";
import { EditableProjectTitle } from "@/components/shared/editable-project-title";
import { EditableBookTitle } from "@/components/shared/editable-book-title";
import { CastMapGrid } from "@/components/cast-map/cast-map-grid";
import { redirect } from "next/navigation";

export default async function CastMapPage({
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

  const [timeline, characters, presence, book] = await Promise.all([
    getTimelineData(bookId),
    getCharacters(projectId),
    getCharacterPresenceMatrix(bookId, projectId),
    getBook(bookId),
  ]);

  const isSeries = project.project_type === "series";

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 border-b border-border px-4 sm:px-6 py-3.5">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">Cast Map</p>
          <EditableProjectTitle projectId={projectId} initialTitle={project.title} />
          {isSeries && book && (
            <EditableBookTitle bookId={bookId} initialTitle={book.title} />
          )}
        </div>
      </div>
      <div className="flex-1 overflow-auto">
        <CastMapGrid
          characters={characters}
          chapters={timeline.chapters}
          plotlines={timeline.plotlines}
          scenes={timeline.scenes}
          presence={presence}
          projectId={projectId}
        />
      </div>
    </div>
  );
}

import { getProject, getFirstBookId } from "@/lib/services/projects";
import { getTimelineData } from "@/lib/services/timeline";
import { getCharacters } from "@/lib/services/characters";
import { getPlaces } from "@/lib/services/places";
import { getTags } from "@/lib/services/tags";
import { TimelineGrid } from "@/components/timeline/timeline-grid";
import { ExportMenu } from "@/components/shared/export-menu";
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

  const [timeline, characters, places, tags] = await Promise.all([
    getTimelineData(bookId),
    getCharacters(projectId),
    getPlaces(projectId),
    getTags(projectId),
  ]);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-border px-6 py-3">
        <div>
          <h1 className="text-lg font-semibold">{project.title}</h1>
          <p className="text-xs text-muted-foreground">Timeline</p>
        </div>
        <ExportMenu bookId={bookId} />
      </div>
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

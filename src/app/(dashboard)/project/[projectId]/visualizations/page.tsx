import { getProject, getFirstBookId } from "@/lib/services/projects";
import { getTimelineData } from "@/lib/services/timeline";
import { getBook } from "@/lib/services/books";
import { EditableProjectTitle } from "@/components/shared/editable-project-title";
import { EditableBookTitle } from "@/components/shared/editable-book-title";
import { PacingHeartbeat } from "@/components/outline/pacing-heartbeat";
import { StoryRiver } from "@/components/visualizations/story-river";
import { TheSpine } from "@/components/visualizations/the-spine";
import { StainedGlass } from "@/components/visualizations/stained-glass";
import { redirect } from "next/navigation";

export default async function VisualizationsPage({
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
  const { chapters, plotlines, scenes } = timeline;

  const hasEnoughData = scenes.length > 0;

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 border-b border-border px-4 sm:px-6 py-3.5">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">Visualizations</p>
          <EditableProjectTitle projectId={projectId} initialTitle={project.title} />
          {isSeries && book && (
            <EditableBookTitle bookId={bookId} initialTitle={book.title} />
          )}
        </div>
      </div>
      <div className="flex-1 overflow-auto">
        {hasEnoughData ? (
          <div className="mx-auto max-w-4xl space-y-8 p-4 sm:p-6">
            {/* Pacing Heartbeat */}
            {scenes.length >= 2 && (
              <PacingHeartbeat chapters={chapters} plotlines={plotlines} scenes={scenes} />
            )}

            {/* Story River */}
            {chapters.length >= 2 && (
              <StoryRiver chapters={chapters} plotlines={plotlines} scenes={scenes} />
            )}

            {/* The Spine */}
            {chapters.length >= 1 && (
              <TheSpine chapters={chapters} plotlines={plotlines} scenes={scenes} />
            )}

            {/* Stained Glass */}
            <StainedGlass chapters={chapters} plotlines={plotlines} scenes={scenes} />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="relative mb-6">
              <div
                className="absolute inset-0 rounded-2xl blur-xl"
                style={{ background: "oklch(0.488 0.183 274.376 / 0.12)" }}
              />
              <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/15 to-primary/8 shadow-lg ring-1 ring-primary/10">
                <svg
                  className="h-10 w-10 text-primary"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941"
                  />
                </svg>
              </div>
            </div>
            <h2 className="text-xl font-bold tracking-tight">No data to visualize yet</h2>
            <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
              Add scenes to your timeline and start writing — the visualizations will come alive as your story grows.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

import { resolveShareToken, getSharedProjectData } from "@/lib/services/sharing";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function SharePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const resolved = await resolveShareToken(token);
  if (!resolved) notFound();

  const data = await getSharedProjectData(resolved.projectId);
  if (!data) notFound();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur px-4 sm:px-8 py-4">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <div>
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary">
                <svg className="h-3.5 w-3.5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 21.593c-5.63-5.539-11-10.297-11-14.402 0-3.791 3.068-5.191 5.281-5.191 1.312 0 4.151.501 5.719 4.457 1.59-3.968 4.464-4.447 5.726-4.447 2.54 0 5.274 1.621 5.274 5.181 0 4.069-5.136 8.625-11 14.402z" />
                </svg>
              </div>
              <span className="text-sm font-bold">plot<span className="text-primary">amour</span></span>
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-full border border-border bg-muted/50 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Read-only
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 sm:px-8 py-8">
        {/* Project title */}
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold tracking-tight">{data.projectTitle}</h1>
          {data.bookTitle !== data.projectTitle && (
            <p className="mt-1 text-lg text-muted-foreground">{data.bookTitle}</p>
          )}
        </div>

        {/* Plotlines legend */}
        {data.plotlines.length > 0 && (
          <div className="mb-8">
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground/60">
              Plotlines
            </h2>
            <div className="flex flex-wrap gap-2">
              {data.plotlines.map((p: { id: string; title: string; color: string }) => (
                <span
                  key={p.id}
                  className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold text-white shadow-sm"
                  style={{ backgroundColor: p.color }}
                >
                  {p.title}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Chapters & Scenes */}
        <div className="space-y-8">
          {data.chapters.map((chapter: {
            id: string;
            title: string;
            description?: string;
            scenes: {
              id: string;
              title: string;
              summary?: string;
              conflict?: string;
              plotlineTitle: string;
              plotlineColor: string;
              characters: string[];
              places: string[];
            }[];
          }) => (
            <div key={chapter.id}>
              <h2 className="mb-3 text-xl font-bold">{chapter.title}</h2>
              {chapter.description && (
                <p className="mb-3 text-sm text-muted-foreground">{chapter.description}</p>
              )}
              <div className="space-y-3">
                {chapter.scenes.length === 0 ? (
                  <p className="text-sm text-muted-foreground/60 italic">No scenes yet.</p>
                ) : (
                  chapter.scenes.map((scene) => (
                    <div
                      key={scene.id}
                      className="overflow-hidden rounded-xl border border-border bg-card shadow-sm"
                    >
                      <div
                        className="h-[3px]"
                        style={{ backgroundColor: scene.plotlineColor }}
                      />
                      <div className="p-4">
                        <div className="flex items-start justify-between gap-3">
                          <h3 className="font-semibold leading-tight">{scene.title}</h3>
                          <span
                            className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold text-white"
                            style={{ backgroundColor: scene.plotlineColor }}
                          >
                            {scene.plotlineTitle}
                          </span>
                        </div>
                        {scene.summary && (
                          <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                            {scene.summary}
                          </p>
                        )}
                        {scene.conflict && (
                          <p className="mt-2 text-sm">
                            <span className="font-semibold">Conflict:</span>{" "}
                            {scene.conflict}
                          </p>
                        )}
                        {(scene.characters.length > 0 || scene.places.length > 0) && (
                          <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
                            {scene.characters.length > 0 && (
                              <span>
                                <span className="font-semibold text-foreground/70">Characters:</span>{" "}
                                {scene.characters.join(", ")}
                              </span>
                            )}
                            {scene.places.length > 0 && (
                              <span>
                                <span className="font-semibold text-foreground/70">Places:</span>{" "}
                                {scene.places.join(", ")}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Characters & Places summary */}
        {data.characters.length > 0 && (
          <div className="mt-12">
            <h2 className="mb-4 text-xl font-bold">Characters</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {data.characters.map((c: { id: string; name: string; description?: string }) => (
                <div key={c.id} className="rounded-xl border border-border bg-card p-4 shadow-sm">
                  <p className="font-semibold">{c.name}</p>
                  {c.description && (
                    <p className="mt-1 text-sm text-muted-foreground line-clamp-3">{c.description}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {data.places.length > 0 && (
          <div className="mt-8">
            <h2 className="mb-4 text-xl font-bold">Places</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {data.places.map((p: { id: string; name: string; description?: string }) => (
                <div key={p.id} className="rounded-xl border border-border bg-card p-4 shadow-sm">
                  <p className="font-semibold">{p.name}</p>
                  {p.description && (
                    <p className="mt-1 text-sm text-muted-foreground line-clamp-3">{p.description}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <footer className="mt-16 border-t border-border/60 pt-6 text-center text-xs text-muted-foreground">
          <p>
            Created with{" "}
            <Link href="/" className="font-semibold text-primary hover:underline">
              plotamour
            </Link>{" "}
            · Read-only view
          </p>
        </footer>
      </main>
    </div>
  );
}

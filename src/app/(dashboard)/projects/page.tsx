import { createClient } from "@/lib/db/server";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Upload } from "lucide-react";

/** Generate a stable hue from a project ID for the card accent strip */
function getProjectHue(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) | 0;
  }
  // Keep hues in the blue-violet-pink range (220–330) to match the app palette
  return 220 + (Math.abs(hash) % 110);
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default async function ProjectsPage() {
  const supabase = await createClient();
  const { data: user } = await supabase.auth.getUser();

  const { data: projects } = await supabase
    .from("projects")
    .select("*")
    .is("deleted_at", null)
    .order("updated_at", { ascending: false });

  const hasProjects = projects && projects.length > 0;

  const firstName = user?.user?.user_metadata?.full_name?.split(" ")[0];

  return (
    <div className="min-h-full p-8">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {firstName ? `Hey, ${firstName} 👋` : "Your Projects"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {hasProjects
              ? `${projects.length} project${projects.length !== 1 ? "s" : ""} — pick one to continue writing.`
              : "Start building your first story world."}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild className="gap-1.5 text-muted-foreground hover:text-foreground">
            <Link href="/import">
              <Upload className="h-3.5 w-3.5" />
              Import
            </Link>
          </Button>
          <Button size="sm" asChild>
            <Link href="/projects/new" className="gap-1.5">
              New Project
            </Link>
          </Button>
        </div>
      </div>

      {hasProjects ? (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => {
            const hue = getProjectHue(project.id);
            return (
              <Link
                key={project.id}
                href={`/project/${project.id}/timeline`}
                className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_8px_24px_oklch(0.488_0.183_274.376/0.10)] hover:border-border/80"
                style={{
                  ["--card-hue" as string]: `${hue}`,
                }}
              >
                {/* Color accent strip */}
                <div
                  className="h-[3px] w-full shrink-0"
                  style={{
                    background: `linear-gradient(90deg, hsl(${hue}, 70%, 55%), hsl(${hue + 30}, 75%, 62%))`,
                  }}
                />

                {/* Card body */}
                <div className="flex flex-1 flex-col p-5">
                  <h2 className="text-[15px] font-semibold leading-snug text-foreground transition-colors group-hover:text-primary">
                    {project.title}
                  </h2>
                  {project.description ? (
                    <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                      {project.description}
                    </p>
                  ) : (
                    <p className="mt-1.5 text-sm italic text-muted-foreground/50">No description</p>
                  )}

                  {/* Meta row */}
                  <div className="mt-auto flex items-center justify-between pt-4">
                    <span
                      className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold capitalize tracking-wide"
                      style={{
                        backgroundColor: `hsl(${hue}, 70%, 94%)`,
                        color: `hsl(${hue}, 55%, 38%)`,
                      }}
                    >
                      {project.project_type}
                    </span>
                    <span className="text-xs text-muted-foreground/70">
                      {formatDate(project.updated_at)}
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        /* Empty state */
        <div className="mt-20 flex flex-col items-center text-center">
          {/* Multi-layer icon with subtle glow */}
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
                  d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"
                />
              </svg>
            </div>
          </div>
          <h2 className="text-xl font-bold tracking-tight">Ready to tell a story?</h2>
          <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
            Create your first project to start mapping plotlines, crafting
            characters, and writing in Google Docs.
          </p>
          <div className="mt-7 flex gap-3">
            <Button asChild>
              <Link href="/projects/new">Create a project</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/import" className="gap-2">
                <Upload className="h-4 w-4" />
                Import from Plottr
              </Link>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

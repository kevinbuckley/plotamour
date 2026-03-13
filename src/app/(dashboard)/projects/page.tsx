import { createClient } from "@/lib/db/server";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Upload } from "lucide-react";
import { ProjectCard } from "@/components/projects/project-card";

/** Generate a stable hue from a project ID for the card accent strip */
function getProjectHue(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) | 0;
  }
  // Keep hues in the blue-violet-pink range (220–330) to match the app palette
  return 220 + (Math.abs(hash) % 110);
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
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              id={project.id}
              title={project.title}
              description={project.description}
              projectType={project.project_type}
              updatedAt={project.updated_at}
              hue={getProjectHue(project.id)}
            />
          ))}
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

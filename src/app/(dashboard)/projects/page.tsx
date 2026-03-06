import { createClient } from "@/lib/db/server";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Upload } from "lucide-react";

export default async function ProjectsPage() {
  const supabase = await createClient();
  const { data: user } = await supabase.auth.getUser();

  const { data: projects } = await supabase
    .from("projects")
    .select("*")
    .is("deleted_at", null)
    .order("updated_at", { ascending: false });

  const hasProjects = projects && projects.length > 0;

  return (
    <div className="p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Your Projects</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Welcome back
            {user?.user?.user_metadata?.full_name
              ? `, ${user.user.user_metadata.full_name}`
              : ""}
            .
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" asChild>
            <Link href="/import" className="gap-2">
              <Upload className="h-4 w-4" />
              Import from Plottr
            </Link>
          </Button>
          <Button asChild>
            <Link href="/projects/new">New Project</Link>
          </Button>
        </div>
      </div>

      {hasProjects ? (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Link
              key={project.id}
              href={`/project/${project.id}/timeline`}
              className="group rounded-lg border border-border bg-card p-5 transition-all hover:border-primary hover:shadow-sm"
            >
              <h2 className="font-semibold group-hover:text-primary">
                {project.title}
              </h2>
              {project.description && (
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                  {project.description}
                </p>
              )}
              <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                <span className="capitalize">{project.project_type}</span>
                <span>&middot;</span>
                <span>
                  Updated{" "}
                  {new Date(project.updated_at).toLocaleDateString()}
                </span>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="mt-16 flex flex-col items-center text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
            <svg
              className="h-8 w-8 text-primary"
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
          <h2 className="mt-4 text-lg font-semibold">
            Welcome to plotamour!
          </h2>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            Let&apos;s plan your first story. Create a project to start
            building your timeline and outline.
          </p>
          <div className="mt-6 flex gap-3">
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

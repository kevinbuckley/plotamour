import { getProject } from "@/lib/services/projects";
import { redirect } from "next/navigation";

export default async function CharactersPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const project = await getProject(projectId);
  if (!project) redirect("/projects");

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-border px-6 py-3">
        <div>
          <h1 className="text-lg font-semibold">{project.title}</h1>
          <p className="text-xs text-muted-foreground">Characters</p>
        </div>
      </div>
      <div className="flex flex-1 items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-semibold">Characters coming in Phase 2</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Track your characters and link them to scenes.
          </p>
        </div>
      </div>
    </div>
  );
}

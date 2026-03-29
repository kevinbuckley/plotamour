import { getProject } from "@/lib/services/projects";
import { getCharacters } from "@/lib/services/characters";
import { getTags } from "@/lib/services/tags";
import { redirect } from "next/navigation";
import { CharacterList } from "@/components/characters/character-list";
import { EditableProjectTitle } from "@/components/shared/editable-project-title";

export default async function CharactersPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const project = await getProject(projectId);
  if (!project) redirect("/projects");

  const [characters, tags] = await Promise.all([
    getCharacters(projectId),
    getTags(projectId),
  ]);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between gap-3 border-b border-border px-4 sm:px-6 py-3.5">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">Characters</p>
          <EditableProjectTitle projectId={projectId} initialTitle={project.title} />
        </div>
      </div>
      <div className="flex-1 overflow-hidden">
        <CharacterList
          projectId={projectId}
          initialCharacters={characters}
          initialTags={tags}
        />
      </div>
    </div>
  );
}

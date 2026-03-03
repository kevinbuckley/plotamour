import { getProject } from "@/lib/services/projects";
import { getCharacters } from "@/lib/services/characters";
import { getTags } from "@/lib/services/tags";
import { redirect } from "next/navigation";
import { CharacterList } from "@/components/characters/character-list";

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
      <div className="flex items-center justify-between border-b border-border px-6 py-3">
        <div>
          <h1 className="text-lg font-semibold">{project.title}</h1>
          <p className="text-xs text-muted-foreground">Characters</p>
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

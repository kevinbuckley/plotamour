import { getProject } from "@/lib/services/projects";
import { getPlaces } from "@/lib/services/places";
import { getTags } from "@/lib/services/tags";
import { redirect } from "next/navigation";
import { PlaceList } from "@/components/places/place-list";

export default async function PlacesPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const project = await getProject(projectId);
  if (!project) redirect("/projects");

  const [places, tags] = await Promise.all([
    getPlaces(projectId),
    getTags(projectId),
  ]);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-border px-6 py-3">
        <div>
          <h1 className="text-lg font-semibold">{project.title}</h1>
          <p className="text-xs text-muted-foreground">Places</p>
        </div>
      </div>
      <div className="flex-1 overflow-hidden">
        <PlaceList
          projectId={projectId}
          initialPlaces={places}
          initialTags={tags}
        />
      </div>
    </div>
  );
}

// Owner-only SQL boundary. Authorization is checked inside the atomic function.
import { serviceSql } from "./service";
import type { Scene, SceneOrderInput } from "@/lib/types/database";

export async function persistSceneOrder(actorId: string, input: SceneOrderInput): Promise<Scene[]> {
  const sql = serviceSql();
  const rows = await sql`
    SELECT * FROM public.reorder_scene_cell(
      ${actorId}::uuid, ${input.bookId}::uuid, ${input.chapterId}::uuid,
      ${input.plotlineId}::uuid, ${input.expectedIds}::uuid[], ${input.sceneIds}::uuid[]
    ) ORDER BY position, id
  `;
  return rows as Scene[];
}

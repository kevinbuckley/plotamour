import { z } from "zod";
import { createClient } from "@/lib/db/server";
import { persistSceneOrder } from "@/lib/db/scene-order";

const ids = z.array(z.string().uuid()).min(1).max(10000);
export const sceneOrderSchema = z.object({
  bookId: z.string().uuid(),
  chapterId: z.string().uuid(),
  plotlineId: z.string().uuid(),
  expectedIds: ids,
  sceneIds: ids,
}).refine(({ expectedIds, sceneIds }) =>
  new Set(expectedIds).size === expectedIds.length &&
  new Set(sceneIds).size === sceneIds.length &&
  expectedIds.length === sceneIds.length &&
  sceneIds.every((id) => expectedIds.includes(id)),
  "Scene IDs must be unique and contain the same members"
);

export class SceneOrderError extends Error {
  constructor(message: string, public readonly status: number) { super(message); }
}

export async function reorderScenes(input: unknown) {
  const parsed = sceneOrderSchema.safeParse(input);
  if (!parsed.success) throw new SceneOrderError("Invalid scene order", 400);
  const client = await createClient();
  const { data: { user } } = await client.auth.getUser();
  if (!user) throw new SceneOrderError("Sign in to reorder scenes", 401);
  try {
    return await persistSceneOrder(user.id, parsed.data);
  } catch (error) {
    const code = (error as { code?: string }).code;
    if (code === "42501") throw new SceneOrderError("Section not available", 403);
    if (code === "22023") throw new SceneOrderError("Invalid scene order", 400);
    if (code === "40001" || code === "40P01" || code === "55P03") {
      throw new SceneOrderError("Scenes changed while saving. Reload the page and try again.", 409);
    }
    throw error;
  }
}

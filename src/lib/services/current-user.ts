import { createClient } from "@/lib/db/server";
export async function currentUser() {
  const db = await createClient();
  const {
    data: { user },
  } = await db.auth.getUser();
  return user;
}

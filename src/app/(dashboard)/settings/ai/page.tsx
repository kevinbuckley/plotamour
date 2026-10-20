import Link from "next/link";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { currentUser } from "@/lib/services/current-user";
import { chatGptStatus, checkLocalRequest } from "@/lib/services/chatgpt";
import { AiConnection } from "@/components/shared/ai-connection";
export default async function AiSettings({
  searchParams,
}: {
  searchParams: Promise<{ connection?: string }>;
}) {
  const user = await currentUser();
  if (!user) redirect("/auth/login");
  const h = await headers();
  let local = false;
  try {
    checkLocalRequest(
      new Request(`http://${h.get("host")}/settings/ai`, { headers: h }),
    );
    local = true;
  } catch {
    /* disabled outside local origin */
  }
  const status = local
    ? await chatGptStatus(user.id)
    : { enabled: false, connected: false, planUsage: false, models: [] };
  return (
    <main className="mx-auto max-w-2xl space-y-6 p-8">
      <Link href="/projects" className="underline">
        Back to projects
      </Link>
      <h1 className="text-3xl font-bold">AI settings</h1>
      <AiConnection status={status} outcome={(await searchParams).connection} />
    </main>
  );
}

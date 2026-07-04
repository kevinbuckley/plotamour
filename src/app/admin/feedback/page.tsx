import { serviceSql } from "@/lib/db/service";

export const dynamic = "force-dynamic";

interface FeatureRequest {
  id: string;
  user_id: string | null;
  body: string;
  created_at: string;
}

export default async function AdminFeedbackPage() {
  let requests: FeatureRequest[] = [];
  let errorMessage: string | null = null;

  try {
    const sql = serviceSql();
    requests = (await sql`
      SELECT id, user_id, body, created_at
      FROM feature_requests
      ORDER BY created_at DESC
    `) as FeatureRequest[];
  } catch (e) {
    errorMessage = e instanceof Error ? e.message : "Unknown error";
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground">Feature Requests</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {requests.length} submission{requests.length !== 1 ? "s" : ""}
          </p>
        </div>

        {errorMessage && (
          <div className="rounded-md border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
            Error loading requests: {errorMessage}
          </div>
        )}

        {requests.length === 0 && !errorMessage && (
          <p className="text-sm text-muted-foreground">No submissions yet.</p>
        )}

        <div className="flex flex-col gap-4">
          {requests.map((r) => (
            <div
              key={r.id}
              className="rounded-lg border border-border bg-card p-5 shadow-sm"
            >
              <p className="whitespace-pre-wrap text-sm text-foreground">{r.body}</p>
              <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
                <span>{new Date(r.created_at).toLocaleString()}</span>
                {r.user_id && (
                  <>
                    <span>·</span>
                    <span className="font-mono">{r.user_id.slice(0, 8)}…</span>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

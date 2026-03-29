import { createClient } from "@/lib/db/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const rawNext = searchParams.get("next") ?? "/projects";
  // Prevent open redirect: ensure next is a relative path starting with /
  const next = rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/projects";

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Store the Google refresh token for later Google Docs API access.
      // Must use the session returned directly from exchangeCodeForSession —
      // provider_refresh_token is not available via a subsequent getSession() call.
      if (data.session?.provider_refresh_token) {
        await supabase
          .from("profiles")
          .update({ google_refresh_token: data.session.provider_refresh_token })
          .eq("id", data.session.user.id);
      }
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Return the user to the landing page with an error
  return NextResponse.redirect(`${origin}/?error=auth_failed`);
}

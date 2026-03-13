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
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Store the Google refresh token for later Google Docs API access
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.provider_refresh_token) {
        await supabase
          .from("profiles")
          .update({ google_refresh_token: session.provider_refresh_token })
          .eq("id", session.user.id);
      }
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Return the user to the landing page with an error
  return NextResponse.redirect(`${origin}/?error=auth_failed`);
}

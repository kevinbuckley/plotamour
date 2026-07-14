// Post-sign-in landing route. The OAuth code exchange itself happens on the
// Neon Auth server (via /api/auth/callback/google); Better Auth then redirects
// here (the callbackURL passed to signIn.social). We upsert the profiles row
// (replaces the old Neon handle_new_user DB trigger) and send the user on.

import { auth } from "@/lib/auth/server";
import { serviceSql } from "@/lib/db/service";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const rawNext = searchParams.get("next") ?? "/projects";
  // Prevent open redirect: ensure next is a relative path starting with /
  const next = rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/projects";

  const { data: session } = await auth.getSession();
  const user = session?.user;

  if (!user) {
    return NextResponse.redirect(`${origin}/?error=auth_failed`);
  }

  try {
    const sql = serviceSql();
    await sql`
      INSERT INTO profiles (id, display_name, avatar_url)
      VALUES (${user.id}, ${user.name ?? null}, ${user.image ?? null})
      ON CONFLICT (id) DO UPDATE
        SET display_name = COALESCE(profiles.display_name, EXCLUDED.display_name),
            avatar_url   = COALESCE(profiles.avatar_url, EXCLUDED.avatar_url)
    `;
  } catch (e) {
    // Non-fatal: the user can still use the app; profile creation retries on next login
    console.error("[auth/callback] profile upsert failed:", e);
  }

  return NextResponse.redirect(`${origin}${next}`);
}

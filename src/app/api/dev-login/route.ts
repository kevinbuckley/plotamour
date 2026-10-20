// Dev-only convenience login. Signs in (creating on first use) a local dev
// user with email+password via Neon Auth — replaces the old Neon
// magic-link hack. Gated to development just like before.

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { serviceSql } from "@/lib/db/service";

export async function GET(request: Request) {
  if (process.env.NODE_ENV !== "development") {
    return new NextResponse("Not found", { status: 404 });
  }

  const email = process.env.DEV_USER_EMAIL;
  const password = process.env.DEV_USER_PASSWORD;

  if (!email || !password) {
    return new NextResponse(
      "Missing DEV_USER_EMAIL or DEV_USER_PASSWORD in .env.local (password min 8 chars)",
      { status: 500 }
    );
  }

  // Try sign-in first; create the user on first run.
  let result = await auth.signIn.email({ email, password });
  if (result.error) {
    const signUp = await auth.signUp.email({ email, password, name: "Dev User" });
    if (signUp.error) {
      return new NextResponse(
        `Dev login failed. signIn: ${result.error.message} / signUp: ${signUp.error.message}`,
        { status: 500 }
      );
    }
    result = await auth.signIn.email({ email, password });
    if (result.error) {
      return new NextResponse(`Dev sign-in after sign-up failed: ${result.error.message}`, {
        status: 500,
      });
    }
  }

  // Ensure the profiles row exists (normally done by /auth/callback).
  try {
    const { data: session } = await auth.getSession();
    if (session?.user) {
      const sql = serviceSql();
      await sql`
        INSERT INTO profiles (id, display_name)
        VALUES (${session.user.id}, ${session.user.name ?? "Dev User"})
        ON CONFLICT (id) DO NOTHING
      `;
    }
  } catch (e) {
    console.error("[dev-login] profile upsert failed:", e);
  }

  return NextResponse.redirect(new URL("/projects", request.url));
}

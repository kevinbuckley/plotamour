import { NextResponse } from "next/server";
import { createClient as createAdmin } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function GET(request: Request) {
  if (process.env.NODE_ENV !== "development") {
    return new NextResponse("Not found", { status: 404 });
  }

  const email = process.env.DEV_USER_EMAIL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!email || !serviceRoleKey) {
    return new NextResponse(
      "Missing DEV_USER_EMAIL or SUPABASE_SERVICE_ROLE_KEY in .env.local",
      { status: 500 }
    );
  }

  // Generate a magic link server-side
  const adminClient = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceRoleKey,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const { data, error } = await adminClient.auth.admin.generateLink({
    type: "magiclink",
    email,
  });

  if (error || !data.properties?.action_link) {
    return new NextResponse(`Failed to generate link: ${error?.message}`, { status: 500 });
  }

  // Follow the magic link server-side to get the redirect with tokens
  const verifyResponse = await fetch(data.properties.action_link, {
    redirect: "manual",
  });

  const location = verifyResponse.headers.get("location");
  if (!location) {
    return new NextResponse("No redirect from Supabase verify", { status: 500 });
  }

  // Tokens are in the hash: ...#access_token=xxx&refresh_token=xxx&...
  const hash = location.includes("#") ? location.split("#")[1] : "";
  const params = new URLSearchParams(hash);
  const access_token = params.get("access_token");
  const refresh_token = params.get("refresh_token");

  if (!access_token || !refresh_token) {
    return new NextResponse(
      `No tokens in redirect. Location: ${location}`,
      { status: 500 }
    );
  }

  // Set the session cookies
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    }
  );

  await supabase.auth.setSession({ access_token, refresh_token });

  return NextResponse.redirect(new URL("/projects", request.url));
}

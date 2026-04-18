import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const publicRoutes = ["/", "/auth/login", "/auth/callback", "/privacy", "/termsofservice", "/api/dev-login", "/dev-callback"];
const publicPrefixes = ["/share/", "/api/share"];

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isPublicRoute =
    publicRoutes.some((route) => request.nextUrl.pathname === route) ||
    publicPrefixes.some((prefix) => request.nextUrl.pathname.startsWith(prefix));

  if (!user && !isPublicRoute) {
    const url = request.nextUrl.clone();
    if (process.env.NODE_ENV === "development") {
      url.pathname = "/api/dev-login";
    } else {
      url.pathname = "/";
      url.searchParams.set("redirect", request.nextUrl.pathname);
    }
    return NextResponse.redirect(url);
  }

  // If user is logged in and visits landing page, redirect to dashboard
  if (user && request.nextUrl.pathname === "/") {
    const url = request.nextUrl.clone();
    url.pathname = "/projects";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|html)$).*)",
  ],
};

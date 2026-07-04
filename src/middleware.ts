import { NextResponse, type NextRequest } from "next/server";

const publicRoutes = ["/", "/auth/login", "/auth/callback", "/privacy", "/termsofservice", "/api/dev-login"];
const publicPrefixes = ["/share/", "/api/share", "/api/auth"];

// Neon Auth session token cookie (fixed name in @neondatabase/auth).
// Presence check only — routes are gated here for UX; actual data access is
// enforced by RLS via the Data API JWT and server-side auth.getSession().
const SESSION_COOKIE = "__Secure-neon-auth.session_token";

export function middleware(request: NextRequest) {
  const hasSession = request.cookies.has(SESSION_COOKIE);

  const isPublicRoute =
    publicRoutes.some((route) => request.nextUrl.pathname === route) ||
    publicPrefixes.some((prefix) => request.nextUrl.pathname.startsWith(prefix));

  if (!hasSession && !isPublicRoute) {
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
  if (hasSession && request.nextUrl.pathname === "/") {
    const url = request.nextUrl.clone();
    url.pathname = "/projects";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|html)$).*)",
  ],
};

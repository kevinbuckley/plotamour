import { NextResponse, type NextRequest } from "next/server";
import { chatGptEnabled, chatGptOrigin } from "@/lib/config/chatgpt";
import { auth } from "@/lib/auth/server";

const publicRoutes = ["/", "/auth/login", "/auth/callback", "/privacy", "/termsofservice", "/api/dev-login"];
const publicPrefixes = ["/share/", "/api/share", "/api/auth"];

// Neon Auth session cookies (fixed names in @neondatabase/auth).
const SESSION_COOKIE = "__Secure-neon-auth.session_token";
const CHALLENGE_COOKIE = "__Secure-neon-auth.session_challange";
const VERIFIER_PARAM = "neon_auth_session_verifier";

// Returning from the Google OAuth redirect carries a one-time verifier that
// must be exchanged for the real session cookie — that exchange logic lives
// inside the SDK's own middleware, so delegate just this step to it.
const sdkMiddleware = auth.middleware({ loginUrl: "/auth/login" });

export async function middleware(request: NextRequest) {
  if (request.nextUrl.searchParams.has(VERIFIER_PARAM) && request.cookies.has(CHALLENGE_COOKIE)) {
    return sdkMiddleware(request);
  }

  // The callback has its own one-use, browser-bound state check. A Strict
  // Neon cookie may be absent on a cross-site return from OpenAI.
  if (request.nextUrl.pathname === "/api/ai/chatgpt/callback" && chatGptEnabled() && request.headers.get("host") === new URL(chatGptOrigin()).host) return NextResponse.next();

  const hasSession = request.cookies.has(SESSION_COOKIE);

  const isPublicRoute =
    publicRoutes.some((route) => request.nextUrl.pathname === route) ||
    publicPrefixes.some((prefix) => request.nextUrl.pathname.startsWith(prefix));

  if (!hasSession && !isPublicRoute) {
    // Use a native URL: NextURL normalizes even hostname assignments to localhost.
    const url = chatGptEnabled() && request.headers.get("host") === new URL(chatGptOrigin()).host
      ? new URL(request.nextUrl.pathname + request.nextUrl.search, chatGptOrigin())
      : request.nextUrl.clone();
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

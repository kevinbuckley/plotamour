// Layer 2: Auth — Neon Auth (Better Auth) server instance
//
// Single server-side entry point for sessions, sign-in/out, JWTs for the
// Data API (auth.token()), and Google provider access tokens
// (auth.getAccessToken()). Use in Server Components, Route Handlers,
// Server Actions, and middleware.

import { createNeonAuth } from "@neondatabase/auth/next/server";
import { env } from "@/lib/config/env";

export const auth = createNeonAuth({
  baseUrl: env.NEON_AUTH_BASE_URL,
  cookies: {
    secret: env.NEON_AUTH_COOKIE_SECRET,
  },
});

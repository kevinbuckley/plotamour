// Layer 1: Config — environment variables and constants
//
// Neon vars come from the Vercel Neon integration with the custom prefix
// "plot" (e.g. plot_NEON_AUTH_BASE_URL); unprefixed names are supported for
// local overrides in .env.local.

const buildOnlyCookieSecret =
  process.env.CI === "true" || process.env.VERCEL_ENV === "preview"
    ? "build-placeholder-cookie-secret-32-characters"
    : undefined;

export const env = {
  // Neon Auth (Better Auth)
  NEON_AUTH_BASE_URL: (process.env.NEON_AUTH_BASE_URL ??
    process.env.plot_NEON_AUTH_BASE_URL)!,
  NEON_AUTH_COOKIE_SECRET: (process.env.NEON_AUTH_COOKIE_SECRET ??
    process.env.plot_NEON_AUTH_COOKIE_SECRET ??
    buildOnlyCookieSecret)!,

  // Neon Data API (PostgREST) + direct owner connection (bypasses RLS)
  NEXT_PUBLIC_NEON_DATA_API_URL: process.env.NEXT_PUBLIC_NEON_DATA_API_URL!,
  DATABASE_URL: (process.env.DATABASE_URL ?? process.env.plot_DATABASE_URL)!,

  // Google OAuth (Docs API token refresh for legacy stored refresh tokens)
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
} as const;

# Design Doc: Authentication Flow

**Status:** accepted
**Author:** plotamour team
**Date:** 2026-03-02

## Overview

plotamour uses Google-only authentication via Supabase Auth. This is intentional:
1. Our users write in Google Docs, so they already have a Google account
2. We need Google OAuth tokens for Docs API access anyway
3. One auth method = simpler UX, no password reset flows

## Flow

```
1. User visits plotamour.com (landing page)
2. Clicks "Sign in with Google"
3. Redirected to Google OAuth consent screen
   - Scopes requested:
     - openid, email, profile (basic auth)
     - drive.file (manage files we create)
     - documents (create/read Google Docs)
4. User grants consent
5. Google redirects to /auth/callback
6. Supabase exchanges code for tokens
7. Supabase creates/updates user record
8. We store the Google refresh token (encrypted) for Docs API
9. User is redirected to /dashboard (project list)
```

## Token Management

### Supabase Session
- Supabase manages session cookies automatically
- Session refresh is handled by `@supabase/ssr`
- Middleware checks session on every request to protected routes

### Google API Tokens
- `access_token`: Short-lived (1 hour), used for Google Docs API calls
- `refresh_token`: Long-lived, stored encrypted in our `users` table
- Before any Google API call, we check token freshness and refresh if needed
- If refresh fails (user revoked access), we redirect to re-auth

## Route Protection

```
Public routes:     /           (landing page)
                   /auth/*     (login, callback)

Protected routes:  /dashboard  (project list)
                   /project/*  (all project views)
                   /api/*      (all API routes)
```

Middleware at `src/middleware.ts` handles protection:
1. Check for valid Supabase session
2. If no session → redirect to `/` with `?redirect=` param
3. If session exists → continue and attach user to request

## Supabase Configuration

- Provider: Google
- Additional scopes: `https://www.googleapis.com/auth/documents https://www.googleapis.com/auth/drive.file`
- Redirect URL: `{SITE_URL}/auth/callback`

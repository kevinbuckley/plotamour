# Security — plotamour

## Authentication

- Google OAuth only, via Supabase Auth
- No passwords stored
- Session managed by Supabase (HTTP-only cookies)
- Middleware enforces auth on all `/dashboard` and `/api` routes

## Authorization

### Row Level Security (RLS)
Every table in Supabase has RLS enabled. Policies ensure:
- Users can only read/write their own data
- Child records (books, scenes, etc.) are accessible only if the user owns the parent project
- No admin/superuser access in the application

### Google API Scopes
- `drive.file` — Only access files created by plotamour (not all Drive files)
- `documents` — Create and read Google Docs

We request the minimum scopes needed. We never access files we didn't create.

## Data Protection

### What We Store
- User profile (name, email, avatar from Google)
- Google refresh token (for Docs API access)
- Project data (outlines, characters, places, notes)
- Google Doc IDs and URLs (not the document content)

### What We Don't Store
- Google passwords or access tokens (only refresh tokens)
- Document content from Google Docs (we only read word count + metadata)
- Payment information (no payments in v1)

### Token Security
- Google refresh tokens stored in the `profiles` table
- TODO (TD-001): Encrypt refresh tokens at rest
- Tokens are only used server-side — never sent to the client
- If a token is revoked, the user re-authenticates

## API Security

- All API routes require authenticated Supabase session
- Input validation with Zod on all mutations
- No raw SQL — all queries through Supabase client with parameterized queries
- CORS configured for the deployment domain only

## Content Security

- No user-generated HTML rendering (prevents XSS)
- Rich text editors (Tiptap) sanitize output
- Images: only URLs from Google (avatars) or user-provided URLs (no file uploads in v1)

## Dependencies

- Keep dependencies minimal
- Run `npm audit` regularly
- Pin major versions to avoid supply chain surprises
- Review shadcn/ui components before adding (they're copied into the repo, not imported)

## Incident Response

For an open-source hobby project:
1. If a vulnerability is reported, fix it within 48 hours
2. Rotate any exposed tokens immediately
3. Notify affected users if data was exposed
4. Document the incident and add preventive measures

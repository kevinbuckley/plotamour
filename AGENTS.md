# AGENTS.md — plotamour

> A visual story planning app for hobby novelists who love writing.
> Built with Next.js on Vercel. Open source.

## Quick Context

- **What:** Plottr-style visual outlining with seamless Google Docs round-trip
- **Who:** Hobby novelists, all genres
- **Stack:** Next.js 15 (App Router), Supabase (Postgres + Auth), Tailwind + shadcn/ui, Vercel
- **Key Differentiator:** Outline → Google Doc → Outline workflow that doesn't break your flow

## Where to Look

| Topic | File |
|---|---|
| System architecture & layers | [ARCHITECTURE.md](./ARCHITECTURE.md) |
| Design system & UI patterns | [docs/DESIGN.md](./docs/DESIGN.md) |
| Frontend conventions | [docs/FRONTEND.md](./docs/FRONTEND.md) |
| Product principles | [docs/PRODUCT_SENSE.md](./docs/PRODUCT_SENSE.md) |
| Phase plans & roadmap | [docs/PLANS.md](./docs/PLANS.md) |
| Quality grades by domain | [docs/QUALITY_SCORE.md](./docs/QUALITY_SCORE.md) |
| Reliability & error handling | [docs/RELIABILITY.md](./docs/RELIABILITY.md) |
| Security model | [docs/SECURITY.md](./docs/SECURITY.md) |
| Database schema | [docs/generated/db-schema.md](./docs/generated/db-schema.md) |
| Active execution plans | [docs/exec-plans/active/](./docs/exec-plans/active/) |
| Design decisions | [docs/design-docs/](./docs/design-docs/) |
| Feature specs | [docs/product-specs/](./docs/product-specs/) |

## Architectural Layers (dependency order)

```
Types → Config → Database → Services → API Routes → UI Components → Pages
```

Never skip a layer. UI never imports from Database directly. See ARCHITECTURE.md.

## Code Conventions

- TypeScript strict mode, no `any`
- App Router with server components by default, `"use client"` only when needed
- Supabase client: server-side via `createServerClient`, client-side via `createBrowserClient`
- All database queries go through service layer functions in `src/lib/services/`
- File naming: `kebab-case` for files, `PascalCase` for components
- Collocate tests next to source files as `*.test.ts(x)`

## Commit Conventions

- Commit often, push often
- Conventional commits: `feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`
- One logical change per commit

## Testing

- Unit tests: Vitest
- Component tests: React Testing Library
- E2E: Playwright (when added)
- Test the behavior, not the implementation

# Architecture — plotamour

## System Overview

plotamour is a server-rendered Next.js application deployed on Vercel with Neon as the backend (Postgres database + Google OAuth). It integrates with Google Docs API for the outline↔writing round-trip workflow.

```
┌─────────────────────────────────────────────────┐
│                   Vercel Edge                    │
│  ┌───────────────────────────────────────────┐   │
│  │           Next.js App Router              │   │
│  │  ┌─────────┐  ┌──────────┐  ┌─────────┐  │   │
│  │  │  Pages  │  │   API    │  │ Server  │  │   │
│  │  │  (RSC)  │  │  Routes  │  │ Actions │  │   │
│  │  └────┬────┘  └────┬─────┘  └────┬────┘  │   │
│  │       │             │             │        │   │
│  │  ┌────▼─────────────▼─────────────▼────┐  │   │
│  │  │         Service Layer               │  │   │
│  │  │   src/lib/services/*.ts             │  │   │
│  │  └────┬────────────────────────┬───────┘  │   │
│  │       │                        │           │   │
│  │  ┌────▼─────────┐  ┌──────────▼────────┐  │   │
│  │  │  Neon        │  │  Google Docs API  │  │   │
│  │  │  (DB + Auth) │  │  (OAuth2)         │  │   │
│  │  └──────────────┘  └───────────────────┘  │   │
│  └───────────────────────────────────────────┘   │
└─────────────────────────────────────────────────┘
```

## Dependency Layers

Dependencies flow strictly downward. No layer may import from a layer above it.

```
Layer 0: Types        — src/lib/types/         (pure TS types, zero imports)
Layer 1: Config       — src/lib/config/        (env vars, constants)
Layer 2: Database     — src/lib/db/            (Neon client, query helpers)
Layer 3: Services     — src/lib/services/      (business logic, Google Docs API)
Layer 4: API Routes   — src/app/api/           (HTTP endpoints, server actions)
Layer 5: UI Components— src/components/        (React components)
Layer 6: Pages        — src/app/(routes)/      (Next.js pages, layouts)
```

### Layer Rules

- **Types** imports nothing from the project
- **Config** imports only from Types
- **Database** imports from Types and Config
- **Services** imports from Types, Config, and Database
- **API Routes** imports from Types, Config, and Services (never Database directly)
- **UI Components** imports from Types and other Components
- **Pages** imports from Components and may call Server Actions (which use Services)

## Domain Model

The application is organized around these core domains:

```
Projects     — Top-level container (a book or series)
Books        — Individual books within a project
Plotlines    — Horizontal story threads (main plot, subplot, character arc)
Chapters     — Vertical divisions (chapter, episode, act)
Scenes       — The intersection: a card at (plotline, chapter)
Characters   — Character profiles with custom attributes
Places       — Location/setting profiles
Notes        — Freeform brainstorming content
Tags         — Cross-cutting labels that link to scenes, characters, places
Templates    — Reusable plot structures
GoogleDocs   — Links between outline elements and Google Docs
```

## Key Architectural Decisions

### Why Neon over Vercel Postgres alone?
- Free tier: 500MB storage, 50K monthly active users
- Built-in Google OAuth (no NextAuth complexity)
- Row-level security for multi-tenant data isolation
- Realtime subscriptions if we need them later

### Why App Router with Server Components?
- Reduces client-side JavaScript bundle
- Server components can query Neon directly
- Server Actions for mutations without API boilerplate
- Streaming and Suspense for perceived performance

### Why Google Docs as the writing surface?
- Hobby novelists already use Google Docs
- We don't build a text editor (massive scope reduction)
- Google Docs API gives us word count, content, and revision tracking
- We own the structure; Google owns the prose

### Offline / Local-first?
- Not in scope. Online-only for v1.
- Neon + Vercel gives us sufficient reliability.
- Can revisit with service workers + IndexedDB later.

## Data Flow: The Google Docs Round-Trip

This is the core differentiator. The flow:

```
1. User creates/outlines scenes in plotamour
2. User clicks "Write" on a scene → plotamour creates a Google Doc
   (or opens existing one) with scene context as header/comments
3. User writes in Google Docs
4. User returns to plotamour → we pull word count & status from the Doc
5. Outline view reflects writing progress (word counts, completion status)
6. If user reorders scenes in plotamour → Doc links update, no content lost
```

### Google Docs Integration Architecture

```
src/lib/services/google-docs.ts
├── createDocForScene(sceneId)     — Creates a Google Doc, stores link
├── openDocForScene(sceneId)       — Returns the Doc URL to navigate to
├── syncDocMetadata(sceneId)       — Pulls word count, last modified
├── syncAllDocs(projectId)         — Batch sync for a project
└── reorderDocLinks(projectId)     — Updates Doc titles/headers on reorder
```

OAuth scopes needed:
- `https://www.googleapis.com/auth/documents` (create/read Docs)
- `https://www.googleapis.com/auth/drive.file` (manage files we created)

## File Structure

```
plotamour/
├── AGENTS.md
├── ARCHITECTURE.md
├── docs/                          # Harness documentation
├── src/
│   ├── app/
│   │   ├── (auth)/                # Login/callback routes
│   │   ├── (dashboard)/           # Main app routes
│   │   │   ├── projects/
│   │   │   ├── timeline/
│   │   │   ├── outline/
│   │   │   ├── characters/
│   │   │   ├── places/
│   │   │   └── notes/
│   │   ├── api/
│   │   │   ├── google/            # Google Docs API routes
│   │   │   └── webhooks/
│   │   ├── layout.tsx
│   │   └── page.tsx               # Landing/marketing page
│   ├── components/
│   │   ├── ui/                    # shadcn/ui primitives
│   │   ├── timeline/              # Timeline-specific components
│   │   ├── outline/               # Outline view components
│   │   ├── editor/                # Scene card editor
│   │   ├── characters/
│   │   ├── places/
│   │   ├── notes/
│   │   └── shared/                # Layout, nav, modals
│   ├── lib/
│   │   ├── types/                 # Layer 0
│   │   ├── config/                # Layer 1
│   │   ├── db/                    # Layer 2
│   │   ├── services/              # Layer 3
│   │   └── utils/                 # Pure utility functions
│   └── styles/
│       └── globals.css
├── public/
├── neon/
│   └── migrations/                # SQL migrations
├── tests/
│   └── e2e/
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

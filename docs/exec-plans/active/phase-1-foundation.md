# Execution Plan: Phase 1 — Foundation

**Status:** active
**Target:** MVP with auth, projects, timeline, scenes, outline, Google Docs link-out

## Goals

1. User can sign in with Google and land on a dashboard
2. User can create a project (standalone book)
3. User can add chapters and plotlines to build a timeline grid
4. User can create scene cards at timeline intersections
5. User can drag-and-drop to reorder scenes and chapters
6. User can view an auto-generated outline from the timeline
7. User can click "Write" on a scene to create/open a Google Doc
8. User can return to plotamour and see word count + status from the Doc

## Task Breakdown

### 1. Project Setup
- [ ] Initialize Next.js 15 with App Router and TypeScript
- [ ] Configure Tailwind CSS + shadcn/ui
- [ ] Set up Supabase project (database + auth)
- [ ] Configure Google OAuth in Supabase with Docs/Drive scopes
- [ ] Set up environment variables (.env.local)
- [ ] Create base layout with sidebar navigation
- [ ] Deploy initial skeleton to Vercel

### 2. Authentication
- [ ] Implement Google sign-in flow via Supabase
- [ ] Create /auth/callback route handler
- [ ] Add middleware for route protection
- [ ] Build landing page with sign-in CTA
- [ ] Store Google refresh token on user record

### 3. Database Schema
- [ ] Create migration: users extension (google_refresh_token)
- [ ] Create migration: projects table
- [ ] Create migration: books table
- [ ] Create migration: chapters table
- [ ] Create migration: plotlines table
- [ ] Create migration: scenes table
- [ ] Create migration: scene_google_docs table
- [ ] Set up Row Level Security policies
- [ ] Seed data for development

### 4. Project Management
- [ ] Dashboard page: list user's projects
- [ ] Create project modal/page
- [ ] Project settings page (title, description)
- [ ] Delete project (soft delete)

### 5. Timeline View
- [ ] Timeline grid component (chapters × plotlines)
- [ ] Scene card component (in grid cell)
- [ ] Add chapter (+ button on column header)
- [ ] Add plotline (+ button on row header)
- [ ] Create scene (+ button on empty cell)
- [ ] Scene detail panel (slide-in from right)
- [ ] Drag-and-drop: reorder chapters
- [ ] Drag-and-drop: move scene between cells
- [ ] Sticky headers (plotline names and chapter headers)

### 6. Outline View
- [ ] Auto-generate outline from timeline data
- [ ] Outline as a collapsible tree: Book → Chapter → Scenes
- [ ] Each scene shows: title, summary, characters, word count
- [ ] Click scene in outline → opens scene detail panel
- [ ] "Write in Google Docs" button on each scene

### 7. Google Docs Integration
- [ ] Google API client setup (server-side)
- [ ] Token refresh service
- [ ] Create Doc for scene (with context header)
- [ ] Open existing Doc (redirect to Google Docs)
- [ ] Sync word count + last modified from Doc
- [ ] Writing status badges on timeline + outline
- [ ] Batch sync on project load

## Definition of Done

- User can complete the full loop: sign in → create project → build timeline → write in Docs → see progress
- All data persists across sessions
- App is deployed and accessible on Vercel
- No placeholder UI — every visible element is functional

## Risks

- Google OAuth consent screen verification can take weeks for sensitive scopes. Mitigation: use "testing" mode during development (limited to test users).
- Google Docs API has a 300 requests/minute/user limit. Mitigation: batch and cache syncs.

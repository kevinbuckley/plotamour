# Core Beliefs

These principles guide every product and engineering decision in plotamour.

## Product Beliefs

### 1. The writer's flow is sacred
Every interaction should reduce friction between thinking and writing. If a feature adds a click, a modal, or a decision point — it must earn its place. The outline-to-writing-to-outline loop should feel like turning a page, not switching apps.

### 2. Hobby novelists are our people
We don't build for professional publishers, writing teams, or screenwriting rooms. We build for the person with a day job and a novel in their head. This means: no jargon, no overwhelming dashboards, sensible defaults, and gentle onboarding.

### 3. Google Docs is where writing happens
We don't build a text editor. We don't compete with Google Docs, Scrivener, or Word. We own the structure (outlines, characters, world). The writer owns the prose in their familiar tool. Our job is to make the bridge invisible.

### 4. Visual planning unlocks creativity
A timeline of colored cards across plotlines is more intuitive than a bulleted list. Writers should see their story's shape at a glance — where threads converge, where gaps exist, where pacing lags.

### 5. Simple until you need more
Start with one plotline and a few scenes. Add complexity (characters, places, tags, series) only when the writer asks for it. Progressive disclosure, not feature walls.

## Engineering Beliefs

### 6. The repo is the source of truth
All decisions, specs, architecture, and plans live in the repo. If it's not written down here, it doesn't exist for the system.

### 7. Ship small, ship often
Prefer many small commits over large PRs. Each commit should leave the app in a working state. Push to main frequently.

### 8. Server-first, client when needed
Use React Server Components by default. Only add `"use client"` when the component needs interactivity (drag-and-drop, modals, forms). This keeps the bundle small and the app fast.

### 9. The layer cake is load-bearing
The architectural layers (Types → Config → DB → Services → API → UI → Pages) are not suggestions. They prevent spaghetti and keep the codebase navigable as it grows.

### 10. Tests protect behavior, not coverage numbers
Write tests for the tricky parts: service logic, drag-and-drop reordering, Google Docs sync. Don't chase 100% coverage on static UI.

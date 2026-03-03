# Frontend Conventions — plotamour

## Stack

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript (strict)
- **Styling:** Tailwind CSS v4
- **Components:** shadcn/ui (Radix-based primitives)
- **Drag & Drop:** @dnd-kit/core + @dnd-kit/sortable
- **Rich Text:** Tiptap (lightweight, for scene summaries and notes)
- **Icons:** Lucide React
- **State Management:** React Server Components + URL state. Client state with `useState`/`useReducer` only when necessary. No global state library.

## File Conventions

```
src/components/
├── ui/                 # shadcn/ui components (do not modify directly)
├── timeline/           # Timeline-specific
│   ├── timeline-grid.tsx
│   ├── scene-card.tsx
│   ├── chapter-header.tsx
│   ├── plotline-header.tsx
│   └── scene-detail-panel.tsx
├── outline/
│   ├── outline-tree.tsx
│   └── outline-scene-row.tsx
├── characters/
├── places/
├── notes/
└── shared/
    ├── app-sidebar.tsx
    ├── project-layout.tsx
    ├── empty-state.tsx
    └── loading-skeleton.tsx
```

### Naming
- Files: `kebab-case.tsx`
- Components: `PascalCase` (matches file name without dashes)
- Hooks: `use-kebab-case.ts` → exports `useKebabCase`
- Server actions: `src/app/(dashboard)/[route]/actions.ts`

## Server vs Client Components

**Default to Server Components.** Only add `"use client"` for:

| Need | Pattern |
|---|---|
| Event handlers (onClick, onDrag) | Client component |
| useState / useReducer | Client component |
| useEffect | Client component |
| Browser APIs (window, document) | Client component |
| Form with client validation | Client component |
| Everything else | Server component |

### Data Fetching Pattern
```
Page (Server Component)
  └── fetches data via service layer
  └── passes data as props to Client Components
```

Do NOT use `useEffect` + `fetch` for initial data loading. Use server components or server actions.

## Server Actions

For mutations (create, update, delete):
- Define in `actions.ts` colocated with the page
- Use `"use server"` directive
- Validate input with Zod
- Call service layer functions
- Revalidate paths with `revalidatePath()` or `revalidateTag()`

```typescript
// Example pattern
"use server"
import { z } from "zod"
import { createScene } from "@/lib/services/scenes"
import { revalidatePath } from "next/cache"

const CreateSceneSchema = z.object({
  bookId: z.string().uuid(),
  chapterId: z.string().uuid(),
  plotlineId: z.string().uuid(),
  title: z.string().min(1).max(200),
})

export async function createSceneAction(formData: FormData) {
  const parsed = CreateSceneSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: parsed.error.flatten() }

  const scene = await createScene(parsed.data)
  revalidatePath(`/project/${scene.bookId}/timeline`)
  return { data: scene }
}
```

## Optimistic Updates

For drag-and-drop and other immediate interactions:
- Update UI immediately (optimistic)
- Fire server action in background
- Revert on failure with error toast

Use `useOptimistic` hook from React or `startTransition` with local state.

## URL State

Filters, view modes, and selected items live in URL search params:
- `?plotline=uuid` — filter timeline to one plotline
- `?character=uuid` — highlight scenes with character
- `?tag=uuid` — filter by tag
- `?view=compact` — compact timeline view

This makes views shareable and bookmarkable.

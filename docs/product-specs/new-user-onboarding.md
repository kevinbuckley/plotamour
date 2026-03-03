# Product Spec: New User Onboarding

**Phase:** 1
**Status:** draft

## First-Time Flow

```
Landing page → "Sign in with Google" → Google consent → Dashboard (empty)
```

### Landing Page
- Headline: "Plan your novel. Write in Google Docs. Love every word."
- Subhead: Brief description of the outline↔Google Docs workflow
- Single CTA: "Sign in with Google" button
- Below fold: Feature overview (timeline, outline, Docs integration)
- Footer: Open source badge, GitHub link

### Empty Dashboard (First Visit)
When a new user lands on the dashboard with no projects:

```
┌────────────────────────────────────────────┐
│                                            │
│    Welcome to plotamour!                   │
│                                            │
│    Let's plan your first story.            │
│                                            │
│    ┌──────────────────────────────────┐    │
│    │  📖 Start from scratch           │    │
│    │  Create a blank project          │    │
│    └──────────────────────────────────┘    │
│                                            │
│    ┌──────────────────────────────────┐    │
│    │  📋 Use a template               │    │
│    │  Start with a story structure    │    │
│    └──────────────────────────────────┘    │
│                                            │
└────────────────────────────────────────────┘
```

### Project Creation (From Scratch)
1. Modal with:
   - Project title (required)
   - Book title (defaults to project title)
   - Genre (optional dropdown, for future recommendations)
2. Click "Create" → lands on timeline view
3. Timeline starts with:
   - 1 plotline: "Main Plot"
   - 3 chapters: "Chapter 1", "Chapter 2", "Chapter 3"
   - No scenes (empty cells with "+" buttons)

### Project Creation (From Template)
1. Template picker:
   - Grid of template cards with name + description
   - Click to preview (shows plotlines + chapter structure)
2. Enter project/book title
3. Click "Create" → timeline pre-populated with template structure

## Returning User Flow

```
Sign in → Dashboard → Click project → Timeline view (last viewed book)
```

Dashboard shows:
- Project cards with title, last opened date, book count
- "New Project" button
- Sorted by last opened (most recent first)

## Design Principles

- Zero tutorial popups on first visit — the UI should be self-explanatory
- The empty dashboard is an invitation, not a wall
- One click to create, one more to start planning

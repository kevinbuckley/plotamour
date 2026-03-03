# Product Spec: Timeline & Scenes

**Phase:** 1
**Status:** draft

## Timeline View

The timeline is the primary workspace. It's a 2D grid:
- Columns = Chapters (structural units)
- Rows = Plotlines (story threads)
- Cells = Scene cards

### Navigation
- Accessed via sidebar: "Timeline" (default view for a book)
- Breadcrumb: Project > Book > Timeline
- Sidebar also shows: Outline, Characters, Places, Notes (Phases 1-2)

### Visual Layout

```
Sidebar │       Ch 1          Ch 2          Ch 3          +
────────┤  ┌───────────┐ ┌───────────┐ ┌───────────┐
Main    │  │ Scene A   │ │ Scene D   │ │           │  ←── empty cell
Plot    │  │ 1,245 wds │ │ 0 wds    │ │    [+]    │      with + button
────────┤  └───────────┘ └───────────┘ └───────────┘
Romance │  │           │ │ Scene B   │ │ Scene E   │
Subplot │  │    [+]    │ │ 890 wds  │ │ writing...│
────────┤  └───────────┘ └───────────┘ └───────────┘
  +     │
```

### Scene Card (in grid)
Each card shows:
- **Title** (truncated to ~30 chars)
- **Plotline color** (left border or background tint)
- **Word count** badge (if Google Doc linked) — gray=0, blue=in progress, green=complete
- **Character dots** (up to 3 small avatars, +N more)
- **Status dot** (gray=not started, yellow=in progress, green=draft complete)

### Scene Detail Panel
Clicking a card opens a slide-in panel from the right:

```
┌─────────────────────────────────┐
│ Scene Title           [✕ close] │
│ Chapter 2 · Main Plot           │
├─────────────────────────────────┤
│ Summary                         │
│ ┌─────────────────────────────┐ │
│ │ (rich text editor)          │ │
│ └─────────────────────────────┘ │
│                                 │
│ POV Character: [dropdown]       │
│ Conflict:      [text field]     │
│                                 │
│ Characters    [+ Add]           │
│ · Elena       · Marcus          │
│                                 │
│ Places        [+ Add]           │
│ · The Library                   │
│                                 │
│ Tags          [+ Add]           │
│ · 🔴 Red Herring  · 🔵 Clue    │
│                                 │
│ ──── Google Docs ────           │
│ 📄 1,245 words · Last edited 2h│
│ [Write in Google Docs →]        │
│                                 │
│ [Delete Scene]                  │
└─────────────────────────────────┘
```

### Drag and Drop Behaviors

| Action | Behavior |
|---|---|
| Drag scene within same row | Reorder within plotline (change chapter) |
| Drag scene to different row | Move to different plotline (same chapter) |
| Drag scene to different row+column | Move to different plotline + chapter |
| Drag chapter header | Reorder all scenes in that chapter |
| Drag plotline header | Reorder plotline rows |

All drag operations:
- Show a ghost preview while dragging
- Update optimistically (instant in UI)
- Persist to database via server action
- Are undoable (Ctrl+Z in Phase 4)

### Adding Elements

| Element | How to Add |
|---|---|
| New chapter | Click "+" at end of column headers |
| New plotline | Click "+" at bottom of row headers |
| New scene | Click "+" on any empty cell, or right-click > "Add Scene" |

### Chapter & Plotline Management
- **Rename:** Double-click the header text
- **Delete chapter:** Right-click header > "Delete" (warns if scenes exist)
- **Delete plotline:** Right-click header > "Delete" (warns if scenes exist)
- **Plotline color:** Click the color swatch on the row header to pick a new color

## Outline View

Auto-generated from timeline data. Read-mostly view for reviewing structure.

```
Book Title
├── Chapter 1
│   ├── Scene A (Main Plot) — 1,245 words ✅
│   │   Elena discovers the letter in the attic.
│   └── Scene C (Mystery) — 0 words ⚪
│       The detective arrives at the manor.
├── Chapter 2
│   ├── Scene D (Main Plot) — 0 words ⚪
│   ├── Scene B (Romance) — 890 words 🟡
│   └── [+ Add Scene]
└── Chapter 3
    └── Scene E (Romance) — writing... 🟡
```

- Click any scene → opens the same scene detail panel
- "Write in Google Docs" button appears on hover
- Word counts and status indicators mirror the timeline
- Collapsible chapters (click to expand/collapse)

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
| Drag scene within the same cell | Reorder before or after another scene in that chapter/plotline section |
| Drag scene to another chapter in the same row | Move to that chapter and append to its plotline section |
| Drag scene to different row | Append to the destination plotline section (same chapter) |
| Drag scene to different row+column | Move to different plotline + chapter |
| Drag chapter header | Reorder all scenes in that chapter |
| Drag plotline header | Reorder plotline rows |

All drag operations:
- Show a ghost preview while dragging
- Update optimistically (instant in UI)
- Persist to database via server action
- Are undoable (Ctrl+Z in Phase 4)

### Ordering scenes within a section

A section is one chapter/plotline cell. Scenes are ordered by their saved position, with scene ID as a deterministic tie-breaker for older duplicate positions.

- Desktop cards support dragging within a cell, with a sortable preview and highlighted destination.
- Desktop and mobile scenes have labeled Move up and Move down buttons. Boundaries are disabled; focus returns to an available move button after saving.
- Reordering is optimistic and atomic. A stale order or changed membership is rejected; the UI reloads authoritative positions and shows an error. If it cannot reload, it asks the writer to refresh before retrying.
- New, restored, and incoming scenes append to the destination. Moving out can leave harmless gaps in stored positions; the next reorder normalizes that cell.
- Reordering preserves scene content, relationships, and Google Doc links. It does not define a new chapter-wide order across plotlines.

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

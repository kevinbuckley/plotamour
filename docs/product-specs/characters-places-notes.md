# Product Spec: Characters, Places & Notes

**Phase:** 2
**Status:** draft

## Characters

### Character List Page
- Grid of character cards (like Notion's gallery view)
- Each card: avatar, name, short description, tags
- Sort by: name, date added, custom order
- Filter by: tag, category
- "New Character" button

### Character Detail Page
A full-page view with:

```
┌─────────────────────────────────────────────────────┐
│ [Avatar]  Elena Marchetti                    [Edit] │
│           Protagonist · Mystery Writer               │
├─────────────────────────────────────────────────────┤
│                                                     │
│ Description                                         │
│ A mystery writer who discovers her grandmother's    │
│ letters contain clues to a real unsolved case.      │
│                                                     │
│ ─── Profile ───                                     │
│ Age:           34                                   │
│ Occupation:    Mystery novelist                     │
│ Motivation:    Uncover family truth                 │
│ Flaw:          Trusts too easily                    │
│ [+ Add custom field]                                │
│                                                     │
│ ─── Appears In ───                                  │
│ Ch 1: Scene A · Ch 2: Scene D · Ch 3: Scene G      │
│ (clickable links back to timeline)                  │
│                                                     │
│ ─── Tags ───                                        │
│ 🔴 POV Character · 🔵 Marchetti Family              │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### Custom Attributes
- Writers can add any field they want (text, number, dropdown, long text)
- Profile templates provide a starting set of fields
- Fields are stored as JSONB on the character record
- Template examples: "Basic Profile", "Romance Character", "Fantasy Character", "Villain Profile"

### Character ↔ Scene Linking
- In scene detail panel: "Characters" section with [+ Add] picker
- In character detail: "Appears In" shows all linked scenes
- Adding a character to a scene shows their avatar on the timeline card

## Places

Same pattern as Characters, adapted for locations:

### Place Detail Page
```
┌─────────────────────────────────────────────────────┐
│ [Image]  The Old Library                     [Edit] │
│          Building · Marchetti Estate                 │
├─────────────────────────────────────────────────────┤
│                                                     │
│ Description                                         │
│ A dusty two-story library with floor-to-ceiling     │
│ shelves. The window overlooks the garden.            │
│                                                     │
│ ─── Details ───                                     │
│ Type:          Interior                             │
│ Era:           Victorian                            │
│ Atmosphere:    Quiet, dusty, mysterious             │
│ [+ Add custom field]                                │
│                                                     │
│ ─── Used In ───                                     │
│ Ch 1: Scene A · Ch 2: Scene B                       │
│                                                     │
└─────────────────────────────────────────────────────┘
```

## Notes

Freeform brainstorming area, simpler than Characters/Places:

### Notes List
- List view (not grid) — notes are text-heavy
- Sortable by: title, date modified, category
- Categories: user-defined (e.g., "Research", "Ideas", "World-Building")
- "New Note" button

### Note Editor
- Rich text: headings, bold, italic, lists, links
- Lightweight — not a full document editor
- Optional: link a note to a scene (for reference)

## Tags

Cross-cutting labels that connect elements:

### Tag Management
- Accessible from project settings or inline while tagging
- Each tag: name, color (from a palette), optional category
- Categories group tags: "POV", "Theme", "Status", "Item"
- Tags are project-scoped (shared across all books in a series)

### Tagging UX
- Click [+ Add Tag] on any scene, character, or place
- Dropdown with search: type to filter existing tags, or create new
- Tags show as colored pills
- Clicking a tag in the timeline filters to show only elements with that tag

# Design System Reference

## shadcn/ui

plotamour uses [shadcn/ui](https://ui.shadcn.com/) for its component primitives. shadcn/ui is not a component library — it's a collection of reusable components built on Radix UI and Tailwind CSS that you copy into your project.

### Key Components We Use

| Component | Use Case |
|---|---|
| Button | All buttons and CTAs |
| Card | Scene cards, project cards, character cards |
| Dialog | Modals (create project, confirm delete) |
| Sheet | Side panels (scene detail) |
| Input | Text inputs |
| Textarea | Multi-line text (summaries, descriptions) |
| Select | Dropdowns (POV character, genre) |
| Badge | Tags, status indicators, word counts |
| Tooltip | Hover hints |
| DropdownMenu | Right-click context menus |
| Command | Search/filter palette |
| Separator | Visual dividers |
| Skeleton | Loading states |
| Toast | Success/error notifications |
| ScrollArea | Custom scrollbars on timeline |
| Avatar | Character avatars |
| Popover | Color picker, tag selector |
| Tabs | View switching (timeline/outline) |

### Installation Pattern
```bash
npx shadcn@latest add button card dialog sheet input textarea select badge tooltip dropdown-menu command separator skeleton toast scroll-area avatar popover tabs
```

## @dnd-kit

Drag-and-drop library for the timeline.

- `@dnd-kit/core` — base DnD engine
- `@dnd-kit/sortable` — sortable lists (chapter reorder, plotline reorder)
- `@dnd-kit/utilities` — CSS transform utilities

### Why @dnd-kit over react-beautiful-dnd?
- react-beautiful-dnd is unmaintained
- @dnd-kit supports grid layouts natively
- Better accessibility support
- Smaller bundle size

## Tiptap

Lightweight rich text editor for scene summaries, character descriptions, and notes.

- Headings, bold, italic, lists, links
- No images or embeds (keep it simple)
- Outputs HTML that we store as text

## Lucide React

Icon library. Consistent with shadcn/ui's default icon set.

```tsx
import { Plus, Pencil, Trash2, ExternalLink, FileText } from "lucide-react"
```

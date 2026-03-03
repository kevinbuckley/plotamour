# Design System — plotamour

## Philosophy

Notion-like: clean, spacious, typographic. Let the content breathe. Color is used sparingly and purposefully (plotline colors, status indicators, tags).

## Design Tokens

### Colors

```
Background:      #ffffff (light)
Surface:         #f8f9fa (cards, panels)
Border:          #e5e7eb
Text Primary:    #111827
Text Secondary:  #6b7280
Text Muted:      #9ca3af

Accent:          #6366f1 (indigo-500, primary actions)
Accent Hover:    #4f46e5 (indigo-600)
Accent Light:    #eef2ff (indigo-50, subtle backgrounds)

Status Green:    #22c55e (draft complete)
Status Yellow:   #eab308 (in progress)
Status Gray:     #d1d5db (not started)

Danger:          #ef4444 (delete actions)
```

### Plotline Color Palette
Users pick from a curated set (12 colors):
```
#ef4444  #f97316  #eab308  #22c55e  #14b8a6  #06b6d4
#3b82f6  #6366f1  #8b5cf6  #a855f7  #ec4899  #f43f5e
```

### Typography

```
Font Family:     Inter (sans-serif), system fallback stack
Heading 1:       24px / 700 weight
Heading 2:       20px / 600 weight
Heading 3:       16px / 600 weight
Body:            14px / 400 weight
Small:           12px / 400 weight
Mono:            JetBrains Mono (code blocks only)
```

### Spacing Scale
Tailwind default: 4px base unit. Use `p-2` (8px), `p-3` (12px), `p-4` (16px) as primary spacers.

### Border Radius
```
Cards/Panels:    rounded-lg (8px)
Buttons:         rounded-md (6px)
Tags/Badges:     rounded-full (pill)
Inputs:          rounded-md (6px)
```

### Shadows
Minimal. Only on:
- Modals: `shadow-lg`
- Dropdowns: `shadow-md`
- Scene cards on hover: `shadow-sm`
- Drag ghost: `shadow-lg` with slight rotation

## Component Patterns

### Layout
- Sidebar (240px fixed) + Main content area
- Sidebar: project navigation, view switcher
- Main area: full-width with max-width 1440px for content pages
- Timeline view: no max-width, horizontal scroll

### Scene Cards
- White background, 1px border, plotline color as left border (3px)
- Hover: subtle shadow, slight elevation
- Dragging: elevated shadow, slight opacity
- Min-width: 160px, max-width: 240px in grid

### Panels
- Slide-in from right: 400px wide
- Gray overlay on the rest of the content
- Close button + click-outside to dismiss
- Smooth transition (200ms ease-out)

### Empty States
- Centered illustration or icon (optional)
- Friendly copy: "No scenes yet. Click + to add your first scene."
- Primary action button

### Loading States
- Skeleton loaders matching content shape
- No spinners except on button actions (small inline spinner)

## Accessibility

- All interactive elements keyboard-accessible
- Focus rings visible: `ring-2 ring-indigo-500 ring-offset-2`
- Minimum touch targets: 44px × 44px
- Color is never the only indicator (always paired with icon or text)
- Contrast ratio: minimum 4.5:1 for text

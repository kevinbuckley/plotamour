# Design Doc: Timeline View

**Status:** accepted
**Author:** plotamour team
**Date:** 2026-03-02

## Problem

Writers need to see the shape of their story at a glance. A flat list of chapters doesn't reveal how plotlines interweave, where subplots converge, or where the pacing sags.

## Solution

A 2D grid where:
- **X-axis (columns):** Chapters / beats / episodes (structural divisions)
- **Y-axis (rows):** Plotlines (main plot, subplots, character arcs)
- **Cells:** Scene cards at the intersection of plotline × chapter

This is the same core concept as Plottr's timeline but optimized for simplicity.

## Visual Design

```
         Ch 1        Ch 2        Ch 3        Ch 4
       ┌──────────┬──────────┬──────────┬──────────┐
Main   │ ████████ │ ████████ │          │ ████████ │
Plot   │ Scene A  │ Scene D  │          │ Scene G  │
       ├──────────┼──────────┼──────────┼──────────┤
Romance│          │ ████████ │ ████████ │ ████████ │
       │          │ Scene B  │ Scene E  │ Scene H  │
       ├──────────┼──────────┼──────────┼──────────┤
Mystery│ ████████ │          │ ████████ │          │
       │ Scene C  │          │ Scene F  │          │
       └──────────┴──────────┴──────────┴──────────┘
```

### Scene Cards Show
- Scene title (truncated)
- Color matching the plotline
- Word count badge (if Google Doc linked)
- Character avatars/icons (small, max 3)
- Writing status indicator (dot: gray/yellow/green)

### Interactions
- **Click card** → Opens scene detail panel (slide-in from right)
- **Drag card** → Reorder within row, or move to different chapter
- **Click "+" on empty cell** → Create new scene at that position
- **Click "+" on column header** → Add new chapter
- **Click "+" on row header** → Add new plotline
- **Right-click card** → Context menu (edit, delete, write in Docs, duplicate)

### Filtering & Views
- Filter by plotline (toggle rows on/off)
- Filter by tag (dim non-matching cards)
- Filter by character (highlight scenes with that character)
- Zoom: compact view (just colors, no text) for big-picture overview
- Flip: transpose grid (chapters as rows, plotlines as columns)

## Technical Approach

### Layout
- CSS Grid for the main layout
- Virtualization not needed initially (most novels < 100 chapters × 5 plotlines)
- If performance becomes an issue: react-virtualized or custom virtual scroll

### Drag and Drop
- Use `@dnd-kit/core` for drag-and-drop (lightweight, accessible, well-maintained)
- Drag operations update optimistically in the UI
- Server action persists the new position
- Conflict: if two scenes share a cell, stack them (scene stacks)

### Data Model
- Scenes have `plotline_id`, `chapter_id`, and `position` (order within a cell)
- Reordering updates `position` and potentially `chapter_id`
- Chapter order is determined by `sort_order` on the chapters table
- Plotline order is determined by `sort_order` on the plotlines table

## Responsive Behavior
- Desktop-first: full grid with horizontal scroll for many chapters
- Not optimizing for mobile in v1 (desktop-only per requirements)
- Min-width for scene cards: 160px
- Column headers are sticky on horizontal scroll
- Row headers (plotline names) are sticky on horizontal scroll

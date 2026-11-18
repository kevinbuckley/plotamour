# Scene ordering within a section

## Goal and scope

Address the feedback: “Need to be able to change ordering of scenes within a section.”

Assumption: a section means a timeline cell, identified by chapter and plotline. Let a writer rearrange the scenes in that cell and retain the order after refreshing. Keep the existing chapter and plotline assignments. Reordering across plotlines in a chapter would require a separate decision about chapter-wide reading order; it is outside this change.

Status: planned. No application changes implemented.

## Current behavior

Inspected main at `f0644a0`.

- `src/components/timeline/timeline-grid.tsx` explicitly returns from `handleDragEnd` when the destination cell matches the source. Cards can move between cells but cannot reorder inside one.
- `src/components/timeline/scene-card.tsx` uses draggable cards; `droppable-cell.tsx` provides cell-level drop targets. There are no insertion targets between cards.
- `scenes.position` already exists. `createScene` in `src/lib/services/scenes.ts` appends within a chapter/plotline cell. `moveScene` updates only one scene; the UI always supplies position zero and does not update its local position.
- The timeline filters scenes without explicitly sorting each cell. Initial service reads order by position, but local updates can diverge from persisted order.
- Outline groups by chapter and sorts by plotline order, then scene position. Manuscript and pacing views also consume position; check their behavior with ties across plotlines before changing shared ordering logic.
- The database client uses Neon Data API and user JWTs with RLS, despite older Supabase wording in architecture documentation.

## Intended experience

- Desktop: drag a scene by its handle before or after another scene in the same cell. Show the intended insertion point and preserve click-to-open behavior.
- Provide labeled “Move up” and “Move down” actions on desktop and mobile. Disable the action at the corresponding boundary; preserve focus and announce the result for assistive technology.
- Update immediately, persist once per completed move, and show a recoverable error with rollback if saving fails.
- Dropping outside a target, cancelling, or dropping at the existing position makes no write.
- Existing moves between cells continue to work and append to the destination with coherent saved positions.

## Implementation sequence

### 1. Define and persist the ordering operation

- [ ] Define a typed reorder request scoped to book, chapter, and plotline, carrying the complete ordered list of active scene IDs and the expected prior order/version for conflict detection.
- [ ] Add a service operation in `src/lib/services/scenes.ts`; validate authentication, ownership, matching scope, unique IDs, complete membership, and exclusion of archived/deleted scenes. Reject stale or invalid requests without changing any positions.
- [ ] Persist contiguous positions in one transaction and return the authoritative ordered scenes. Serialize changes to the same cell so concurrent reorder/create/move/archive operations cannot silently overwrite membership. Select a transaction mechanism supported by the current Neon setup; retain user authorization/RLS, and do not use the owner connection as an authorization shortcut.
- [ ] Add a validated `reorderScenes` action to `src/app/api/timeline/route.ts`, returning distinguishable validation, authorization, conflict, and server errors.
- [ ] Bring cross-cell moves onto the same ordering rules: compact the source and append at the destination atomically. Ensure create and unarchive do not produce ambiguous active positions.

### 2. Add scene ordering controls

- [ ] Give every cell an explicit stable position sort, with an ID tie-breaker for existing duplicate positions. Normalize affected cells when saving, without a destructive global rewrite.
- [ ] Use the existing installed sortable drag-and-drop package to support card insertion targets while retaining cell targets for empty destinations. Check current package documentation during implementation.
- [ ] Route drag-and-drop and Move up/Move down through one reorder handler. Share the behavior between desktop cards and mobile scene rows.
- [ ] Add optimistic updates, a pending state that prevents overlapping mutations of the same cell, error feedback, and rollback. On conflict, reload authoritative order and invite retry. Avoid restoring unrelated scene edits from an old state snapshot.
- [ ] Keep selected scene details, linked Google Docs, summaries, tags, and writing status intact.

### 3. Verify and document

- [ ] Add colocated service/API tests for valid reorder, malformed/duplicate/missing/foreign IDs, unauthorized access, stale requests, and atomic failure. Exercise transaction and authorization behavior against a test database rather than relying only on mocked queries.
- [ ] Add component tests for move boundaries, keyboard-accessible controls, optimistic success, failure rollback, and cancelled/no-op drops.
- [ ] Check integration behavior for cross-cell moves, scene creation, archive/unarchive, and concurrent changes to one cell.
- [ ] Manually verify with at least three scenes: move last to first and first to last, refresh, and confirm order in desktop timeline, mobile timeline, outline, and relevant exports. Verify empty and single-scene cells and existing cross-cell dragging.
- [ ] Run focused tests, TypeScript checking, and a production build. Use the repository's working lint invocation; the current script uses `next lint`, so verify compatibility before relying on it.
- [ ] Update `docs/product-specs/timeline-and-scenes.md` with the supported ordering scope and controls. Move this plan to completed after acceptance.

## Acceptance criteria

1. A writer can move any scene to any position within its section using desktop drag-and-drop or accessible move controls.
2. A refresh preserves the chosen order; other cells retain their order.
3. Saving cannot leave partially updated positions, and stale concurrent requests cannot silently overwrite newer order.
4. Failed saves display feedback and restore or reload the correct order.
5. Moving scenes preserves their content, relationships, and Google Doc links.
6. Existing cross-cell movement still works, and active scene creation/restoration produces deterministic placement.

## Decision log

- Interpret section as a chapter/plotline cell based on the existing position scope. Record this assumption explicitly because the feedback does not identify a screen.
- Reuse `scenes.position`; do not add a second ordering field for the same scope.
- Include mobile and keyboard controls so reordering does not depend on pointer dragging.
- Keep this delivery focused on scene order. Chapter/plotline reordering and undo history remain separate work.

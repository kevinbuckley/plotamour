# Design Doc: Data Model

**Status:** accepted
**Author:** plotamour team
**Date:** 2026-03-02

## Entity Relationship Overview

```
User (1) ──── (N) Project
Project (1) ──── (N) Book
Book (1) ──── (N) Chapter
Book (1) ──── (N) Plotline
Chapter + Plotline ──── (N) Scene     (scene lives at an intersection)
Scene (N) ──── (N) Character          (via scene_characters)
Scene (N) ──── (N) Tag                (via scene_tags)
Scene (1) ──── (0..1) GoogleDoc       (optional linked doc)
Project (1) ──── (N) Character
Project (1) ──── (N) Place
Project (1) ──── (N) Note
Project (1) ──── (N) Tag
Character (N) ──── (N) Tag            (via character_tags)
Place (N) ──── (N) Tag                (via place_tags)
Scene (N) ──── (N) Place              (via scene_places)
```

## Key Design Decisions

### Project vs Book
- A **Project** is the top-level container. It can hold one book (standalone) or multiple books (series).
- A **Book** contains the actual timeline (chapters + plotlines + scenes).
- Characters, Places, Notes, and Tags belong to the **Project** level so they can be shared across books in a series.

### Scene Positioning
- A Scene belongs to exactly one `chapter_id` and one `plotline_id`.
- Multiple scenes can exist at the same chapter+plotline intersection (scene stacks).
- Within a stack, `position` determines order (0, 1, 2...).
- Moving a scene = updating its `chapter_id`, `plotline_id`, and/or `position`.

### Custom Attributes
- Characters, Places, and Notes support custom attributes via a JSONB `custom_attributes` column.
- This avoids a complex EAV (entity-attribute-value) schema.
- Template attribute definitions are stored as JSON on the project: `attribute_templates`.

### Tags
- Tags are project-scoped with a `name`, `color`, and optional `category`.
- They can be attached to scenes, characters, and places via join tables.
- Categories allow grouping: "POV", "Status", "Theme", etc.

### Soft Deletes
- Projects, Books, Scenes, Characters, Places use soft deletes (`deleted_at` timestamp).
- This enables an undo/trash feature later.
- Queries filter `WHERE deleted_at IS NULL` by default.

## Full Entity List

See [docs/generated/db-schema.md](../generated/db-schema.md) for the complete SQL schema.

| Entity | Scope | Key Fields |
|---|---|---|
| users | global | id, email, display_name, avatar_url, google_refresh_token |
| projects | user | id, user_id, title, description, type (standalone/series) |
| books | project | id, project_id, title, sort_order, cover_image_url |
| chapters | book | id, book_id, title, sort_order |
| plotlines | book | id, book_id, title, color, sort_order |
| scenes | book | id, book_id, chapter_id, plotline_id, position, title, summary, conflict, pov_character_id |
| characters | project | id, project_id, name, description, avatar_url, custom_attributes (JSONB) |
| places | project | id, project_id, name, description, image_url, custom_attributes (JSONB) |
| notes | project | id, project_id, title, content, category |
| tags | project | id, project_id, name, color, category |
| scene_characters | - | scene_id, character_id |
| scene_places | - | scene_id, place_id |
| scene_tags | - | scene_id, tag_id |
| character_tags | - | character_id, tag_id |
| place_tags | - | place_id, tag_id |
| scene_google_docs | scene | id, scene_id, google_doc_id, word_count, writing_status |
| templates | global | id, name, description, structure (JSONB), is_builtin |

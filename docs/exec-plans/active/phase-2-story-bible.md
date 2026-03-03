# Execution Plan: Phase 2 — Story Bible

**Status:** planned
**Depends on:** Phase 1 complete

## Goals

Add the "story bible" features: characters, places, notes, tags, and filtering.

## Task Breakdown

### 1. Characters
- [ ] Database: characters table + scene_characters join
- [ ] Character list page (project-scoped)
- [ ] Character profile card (name, description, avatar, custom attributes)
- [ ] Character detail page with full bio editor
- [ ] Link characters to scenes
- [ ] Character avatars appear on scene cards in timeline
- [ ] Character filter on timeline (highlight/dim scenes)
- [ ] Character templates (15+ built-in profile structures)

### 2. Places
- [ ] Database: places table + scene_places join
- [ ] Places list page (project-scoped)
- [ ] Place profile card (name, description, image, custom attributes)
- [ ] Place detail page
- [ ] Link places to scenes
- [ ] Place filter on timeline

### 3. Notes
- [ ] Database: notes table
- [ ] Notes section (project-scoped)
- [ ] Rich text note editor (basic: bold, italic, lists, headings)
- [ ] Note categories (user-defined)
- [ ] Attach notes to scenes (optional linking)

### 4. Tags
- [ ] Database: tags table + join tables (scene_tags, character_tags, place_tags)
- [ ] Tag management page
- [ ] Tag creation with name, color, category
- [ ] Apply tags to scenes, characters, places
- [ ] Tag filters on timeline view
- [ ] Tag filters on character/place lists

### 5. Advanced Filtering
- [ ] Multi-filter: combine plotline + character + tag filters
- [ ] Filter persistence (remember last filter state per project)
- [ ] Filter indicator in UI (show active filters)

## Definition of Done

- Writers can build a full story bible alongside their timeline
- Filtering makes it easy to see "all scenes with Character X" or "all scenes tagged 'Red Herring'"
- Custom attributes work smoothly for characters and places

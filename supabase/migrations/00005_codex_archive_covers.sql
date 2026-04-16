-- Migration 00005: Codex enhancements, scene archive, project covers
-- All changes are backwards compatible (nullable or DEFAULT-backed columns)

-- ─── Feature 1: Aliases on characters and places ───────────────────────────
-- Existing rows get an empty array via the DEFAULT. NOT NULL is safe because
-- the DEFAULT fills in immediately for all existing rows.
ALTER TABLE public.characters
  ADD COLUMN IF NOT EXISTS aliases TEXT[] NOT NULL DEFAULT '{}';

ALTER TABLE public.places
  ADD COLUMN IF NOT EXISTS aliases TEXT[] NOT NULL DEFAULT '{}';

-- ─── Feature 2: Character relations ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.character_relations (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_character_id  UUID NOT NULL REFERENCES public.characters(id) ON DELETE CASCADE,
  to_character_id    UUID NOT NULL REFERENCES public.characters(id) ON DELETE CASCADE,
  relation_type      TEXT NOT NULL DEFAULT '',
  description        TEXT NOT NULL DEFAULT '',
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- prevent exact duplicate directed pairs
  UNIQUE (from_character_id, to_character_id)
);

ALTER TABLE public.character_relations ENABLE ROW LEVEL SECURITY;

-- Access via the owning project: user owns from_character → owns the relation.
CREATE POLICY "Users can manage own character relations"
  ON public.character_relations
  FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM   public.characters c
      JOIN   public.projects p ON p.id = c.project_id
      WHERE  c.id = from_character_id
      AND    p.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM   public.characters c
      JOIN   public.projects p ON p.id = c.project_id
      WHERE  c.id = from_character_id
      AND    p.user_id = auth.uid()
    )
  );

-- ─── Feature 3: Project covers ──────────────────────────────────────────────
-- NULL = no cover set. Backwards compatible.
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS cover_image_url TEXT NULL;

-- ─── Feature 4: Scene archive ───────────────────────────────────────────────
-- NULL = active (not archived). Backwards compatible.
ALTER TABLE public.scenes
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ NULL;

CREATE INDEX IF NOT EXISTS idx_scenes_archived_at ON public.scenes (archived_at);

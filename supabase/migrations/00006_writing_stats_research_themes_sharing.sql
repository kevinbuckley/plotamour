-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- Migration 00006 — Writing Stats, Research Links, Themes, Sharing
-- All additions are backwards-compatible:
--   • New tables do not alter existing tables (except two JSONB columns below)
--   • New columns use NOT NULL DEFAULT so existing rows are unaffected
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- ── Feature 1: Writing Statistics & Goals ────────────────────────

CREATE TABLE writing_goals (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id  UUID        NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  daily_goal  INTEGER     NOT NULL DEFAULT 500,
  total_goal  INTEGER,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (project_id, user_id)
);

CREATE TABLE writing_stats (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id       UUID        NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id          UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stat_date        DATE        NOT NULL,
  total_word_count INTEGER     NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (project_id, user_id, stat_date)
);

-- ── Feature 8: Research Links on Codex Items ─────────────────────
-- Backwards compatible: default empty array, existing rows unaffected

ALTER TABLE characters
  ADD COLUMN IF NOT EXISTS research_links JSONB NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE places
  ADD COLUMN IF NOT EXISTS research_links JSONB NOT NULL DEFAULT '[]'::jsonb;

-- ── Feature 9: Themes / Motif Tracker ────────────────────────────

CREATE TABLE themes (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id  UUID        NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name        TEXT        NOT NULL,
  color       TEXT        NOT NULL DEFAULT '#6366f1',
  description TEXT        NOT NULL DEFAULT '',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE scene_themes (
  scene_id  UUID NOT NULL REFERENCES scenes(id)  ON DELETE CASCADE,
  theme_id  UUID NOT NULL REFERENCES themes(id)  ON DELETE CASCADE,
  PRIMARY KEY (scene_id, theme_id)
);

-- ── Feature 10: Project Sharing (read-only share links) ──────────

CREATE TABLE project_shares (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id  UUID        NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  share_token TEXT        NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(24), 'base64url'),
  label       TEXT        NOT NULL DEFAULT '',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at  TIMESTAMPTZ
);

-- ── updated_at trigger function (create if not already present) ──

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ── Triggers ─────────────────────────────────────────────────────

CREATE TRIGGER set_updated_at_writing_goals
  BEFORE UPDATE ON writing_goals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_updated_at_writing_stats
  BEFORE UPDATE ON writing_stats
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_updated_at_themes
  BEFORE UPDATE ON themes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ── Row Level Security ────────────────────────────────────────────

ALTER TABLE writing_goals  ENABLE ROW LEVEL SECURITY;
ALTER TABLE writing_stats  ENABLE ROW LEVEL SECURITY;
ALTER TABLE themes         ENABLE ROW LEVEL SECURITY;
ALTER TABLE scene_themes   ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_shares ENABLE ROW LEVEL SECURITY;

-- writing_goals: owner only (own user_id)
CREATE POLICY "writing_goals_owner" ON writing_goals
  FOR ALL USING (auth.uid() = user_id);

-- writing_stats: owner only (own user_id)
CREATE POLICY "writing_stats_owner" ON writing_stats
  FOR ALL USING (auth.uid() = user_id);

-- themes: project owner
CREATE POLICY "themes_project_owner" ON themes
  FOR ALL USING (
    project_id IN (
      SELECT id FROM projects
      WHERE user_id = auth.uid() AND deleted_at IS NULL
    )
  );

-- scene_themes: project owner via scenes → books → projects
CREATE POLICY "scene_themes_project_owner" ON scene_themes
  FOR ALL USING (
    scene_id IN (
      SELECT s.id FROM scenes s
      JOIN books b ON s.book_id = b.id
      JOIN projects p ON b.project_id = p.id
      WHERE p.user_id = auth.uid() AND p.deleted_at IS NULL
    )
  );

-- project_shares: project owner can manage their share links
CREATE POLICY "project_shares_owner" ON project_shares
  FOR ALL USING (
    project_id IN (
      SELECT id FROM projects
      WHERE user_id = auth.uid() AND deleted_at IS NULL
    )
  );

-- Public share token read — handled via service role in the share API route
-- (no public RLS policy needed; the API validates the token server-side)

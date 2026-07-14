-- plotamour — consolidated Neon schema
--
-- This migration defines the current production schema for Neon:
--   • auth.uid() is provided by Neon Auth and returns the signed-in user's uuid.
--   • user_id columns are plain UUIDs, NOT foreign keys into neon_auth."user":
--     that schema is managed by Neon Auth (Better Auth) and we don't want DDL
--     dependencies on it. App-level integrity: users are created by Neon Auth,
--     profiles rows are upserted by the app on first sign-in.
--   • No handle_new_user trigger — replaced by an
--     app-side profile upsert in the auth callback.
--   • share_token is generated in app code (base64url via Node crypto); the DB
--     default here is only a safety net using base64+translate because Postgres
--     encode() does not support 'base64url'.
--
-- RLS rule carried over from the 00008 postmortem: no two tables' policies may
-- each contain a subquery referencing the other table. project_shares.user_id is
-- a directly-owned column so its owner policy never joins projects, while
-- projects' public-share policy reads project_shares one-way. Keep it that way.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ─── updated_at trigger function ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ─── Profiles ────────────────────────────────────────────────────────────────
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY,  -- = neon_auth."user".id
  display_name TEXT,
  avatar_url TEXT,
  google_refresh_token TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- ─── Projects ────────────────────────────────────────────────────────────────
CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,  -- = neon_auth."user".id
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  project_type TEXT NOT NULL DEFAULT 'standalone'
    CHECK (project_type IN ('standalone', 'series')),
  attribute_templates JSONB DEFAULT '{}',
  cover_image_url TEXT,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_projects_user_id ON public.projects(user_id);
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own projects" ON public.projects
  FOR SELECT USING (auth.uid() = user_id AND deleted_at IS NULL);
CREATE POLICY "Users can insert own projects" ON public.projects
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own projects" ON public.projects
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own projects" ON public.projects
  FOR DELETE USING (auth.uid() = user_id);

-- ─── Books ───────────────────────────────────────────────────────────────────
CREATE TABLE public.books (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  cover_image_url TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_books_project_id ON public.books(project_id);
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own books" ON public.books
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.projects WHERE projects.id = books.project_id AND projects.user_id = auth.uid())
    AND deleted_at IS NULL
  );
CREATE POLICY "Users can insert own books" ON public.books
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.projects WHERE projects.id = books.project_id AND projects.user_id = auth.uid())
  );
CREATE POLICY "Users can update own books" ON public.books
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.projects WHERE projects.id = books.project_id AND projects.user_id = auth.uid())
  );
CREATE POLICY "Users can delete own books" ON public.books
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.projects WHERE projects.id = books.project_id AND projects.user_id = auth.uid())
  );

-- ─── Chapters ────────────────────────────────────────────────────────────────
CREATE TABLE public.chapters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_chapters_book_id ON public.chapters(book_id);
ALTER TABLE public.chapters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own chapters" ON public.chapters
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.books
      JOIN public.projects ON projects.id = books.project_id
      WHERE books.id = chapters.book_id AND projects.user_id = auth.uid()
    )
  );
CREATE POLICY "Users can insert own chapters" ON public.chapters
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.books
      JOIN public.projects ON projects.id = books.project_id
      WHERE books.id = chapters.book_id AND projects.user_id = auth.uid()
    )
  );
CREATE POLICY "Users can update own chapters" ON public.chapters
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.books
      JOIN public.projects ON projects.id = books.project_id
      WHERE books.id = chapters.book_id AND projects.user_id = auth.uid()
    )
  );
CREATE POLICY "Users can delete own chapters" ON public.chapters
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.books
      JOIN public.projects ON projects.id = books.project_id
      WHERE books.id = chapters.book_id AND projects.user_id = auth.uid()
    )
  );

-- ─── Plotlines ───────────────────────────────────────────────────────────────
CREATE TABLE public.plotlines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#6366f1',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_plotlines_book_id ON public.plotlines(book_id);
ALTER TABLE public.plotlines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own plotlines" ON public.plotlines
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.books
      JOIN public.projects ON projects.id = books.project_id
      WHERE books.id = plotlines.book_id AND projects.user_id = auth.uid()
    )
  );
CREATE POLICY "Users can insert own plotlines" ON public.plotlines
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.books
      JOIN public.projects ON projects.id = books.project_id
      WHERE books.id = plotlines.book_id AND projects.user_id = auth.uid()
    )
  );
CREATE POLICY "Users can update own plotlines" ON public.plotlines
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.books
      JOIN public.projects ON projects.id = books.project_id
      WHERE books.id = plotlines.book_id AND projects.user_id = auth.uid()
    )
  );
CREATE POLICY "Users can delete own plotlines" ON public.plotlines
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.books
      JOIN public.projects ON projects.id = books.project_id
      WHERE books.id = plotlines.book_id AND projects.user_id = auth.uid()
    )
  );

-- ─── Characters ──────────────────────────────────────────────────────────────
CREATE TABLE public.characters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  avatar_url TEXT,
  custom_attributes JSONB DEFAULT '{}',
  aliases TEXT[] NOT NULL DEFAULT '{}',
  research_links JSONB NOT NULL DEFAULT '[]'::jsonb,
  sort_order INTEGER NOT NULL DEFAULT 0,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_characters_project_id ON public.characters(project_id);
ALTER TABLE public.characters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own characters" ON public.characters
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.projects WHERE projects.id = characters.project_id AND projects.user_id = auth.uid())
    AND deleted_at IS NULL
  );
CREATE POLICY "Users can insert own characters" ON public.characters
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.projects WHERE projects.id = characters.project_id AND projects.user_id = auth.uid())
  );
CREATE POLICY "Users can update own characters" ON public.characters
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.projects WHERE projects.id = characters.project_id AND projects.user_id = auth.uid())
  );
CREATE POLICY "Users can delete own characters" ON public.characters
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.projects WHERE projects.id = characters.project_id AND projects.user_id = auth.uid())
  );

-- ─── Scenes ──────────────────────────────────────────────────────────────────
CREATE TABLE public.scenes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  chapter_id UUID NOT NULL REFERENCES public.chapters(id) ON DELETE CASCADE,
  plotline_id UUID NOT NULL REFERENCES public.plotlines(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'New Scene',
  summary TEXT DEFAULT '',
  conflict TEXT DEFAULT '',
  pov_character_id UUID REFERENCES public.characters(id) ON DELETE SET NULL,
  position INTEGER NOT NULL DEFAULT 0,
  archived_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_scenes_book_id ON public.scenes(book_id);
CREATE INDEX idx_scenes_chapter_id ON public.scenes(chapter_id);
CREATE INDEX idx_scenes_plotline_id ON public.scenes(plotline_id);
CREATE INDEX idx_scenes_chapter_plotline ON public.scenes(chapter_id, plotline_id);
CREATE INDEX idx_scenes_archived_at ON public.scenes(archived_at);
ALTER TABLE public.scenes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own scenes" ON public.scenes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.books
      JOIN public.projects ON projects.id = books.project_id
      WHERE books.id = scenes.book_id AND projects.user_id = auth.uid()
    )
    AND deleted_at IS NULL
  );
CREATE POLICY "Users can insert own scenes" ON public.scenes
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.books
      JOIN public.projects ON projects.id = books.project_id
      WHERE books.id = scenes.book_id AND projects.user_id = auth.uid()
    )
  );
CREATE POLICY "Users can update own scenes" ON public.scenes
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.books
      JOIN public.projects ON projects.id = books.project_id
      WHERE books.id = scenes.book_id AND projects.user_id = auth.uid()
    )
  );
CREATE POLICY "Users can delete own scenes" ON public.scenes
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.books
      JOIN public.projects ON projects.id = books.project_id
      WHERE books.id = scenes.book_id AND projects.user_id = auth.uid()
    )
  );

-- ─── Scene Google Docs ───────────────────────────────────────────────────────
CREATE TABLE public.scene_google_docs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scene_id UUID NOT NULL UNIQUE REFERENCES public.scenes(id) ON DELETE CASCADE,
  google_doc_id TEXT NOT NULL,
  google_doc_url TEXT NOT NULL,
  word_count INTEGER DEFAULT 0,
  last_synced_at TIMESTAMPTZ,
  last_modified_at TIMESTAMPTZ,
  writing_status TEXT DEFAULT 'not_started'
    CHECK (writing_status IN ('not_started', 'in_progress', 'draft_complete')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_scene_google_docs_scene_id ON public.scene_google_docs(scene_id);
ALTER TABLE public.scene_google_docs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own scene_google_docs" ON public.scene_google_docs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.scenes
      JOIN public.books ON books.id = scenes.book_id
      JOIN public.projects ON projects.id = books.project_id
      WHERE scenes.id = scene_google_docs.scene_id AND projects.user_id = auth.uid()
    )
  );
CREATE POLICY "Users can insert own scene_google_docs" ON public.scene_google_docs
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.scenes
      JOIN public.books ON books.id = scenes.book_id
      JOIN public.projects ON projects.id = books.project_id
      WHERE scenes.id = scene_google_docs.scene_id AND projects.user_id = auth.uid()
    )
  );
CREATE POLICY "Users can update own scene_google_docs" ON public.scene_google_docs
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.scenes
      JOIN public.books ON books.id = scenes.book_id
      JOIN public.projects ON projects.id = books.project_id
      WHERE scenes.id = scene_google_docs.scene_id AND projects.user_id = auth.uid()
    )
  );
CREATE POLICY "Users can delete own scene_google_docs" ON public.scene_google_docs
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.scenes
      JOIN public.books ON books.id = scenes.book_id
      JOIN public.projects ON projects.id = books.project_id
      WHERE scenes.id = scene_google_docs.scene_id AND projects.user_id = auth.uid()
    )
  );

-- ─── Places ──────────────────────────────────────────────────────────────────
CREATE TABLE public.places (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  image_url TEXT,
  custom_attributes JSONB DEFAULT '{}',
  aliases TEXT[] NOT NULL DEFAULT '{}',
  research_links JSONB NOT NULL DEFAULT '[]'::jsonb,
  sort_order INTEGER NOT NULL DEFAULT 0,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_places_project_id ON public.places(project_id);
ALTER TABLE public.places ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own places" ON public.places
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.projects WHERE projects.id = places.project_id AND projects.user_id = auth.uid())
  );

-- ─── Notes ───────────────────────────────────────────────────────────────────
CREATE TABLE public.notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Untitled Note',
  content TEXT DEFAULT '',
  category TEXT DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notes_project_id ON public.notes(project_id);
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own notes" ON public.notes
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.projects WHERE projects.id = notes.project_id AND projects.user_id = auth.uid())
  );

-- ─── Tags ────────────────────────────────────────────────────────────────────
CREATE TABLE public.tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#6366f1',
  category TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tags_project_id ON public.tags(project_id);
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own tags" ON public.tags
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.projects WHERE projects.id = tags.project_id AND projects.user_id = auth.uid())
  );

-- ─── Join tables ─────────────────────────────────────────────────────────────
CREATE TABLE public.scene_characters (
  scene_id UUID NOT NULL REFERENCES public.scenes(id) ON DELETE CASCADE,
  character_id UUID NOT NULL REFERENCES public.characters(id) ON DELETE CASCADE,
  PRIMARY KEY (scene_id, character_id)
);
ALTER TABLE public.scene_characters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own scene_characters" ON public.scene_characters
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.scenes
      JOIN public.books ON books.id = scenes.book_id
      JOIN public.projects ON projects.id = books.project_id
      WHERE scenes.id = scene_characters.scene_id AND projects.user_id = auth.uid()
    )
  );

CREATE TABLE public.scene_places (
  scene_id UUID NOT NULL REFERENCES public.scenes(id) ON DELETE CASCADE,
  place_id UUID NOT NULL REFERENCES public.places(id) ON DELETE CASCADE,
  PRIMARY KEY (scene_id, place_id)
);
ALTER TABLE public.scene_places ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own scene_places" ON public.scene_places
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.scenes
      JOIN public.books ON books.id = scenes.book_id
      JOIN public.projects ON projects.id = books.project_id
      WHERE scenes.id = scene_places.scene_id AND projects.user_id = auth.uid()
    )
  );

CREATE TABLE public.scene_tags (
  scene_id UUID NOT NULL REFERENCES public.scenes(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
  PRIMARY KEY (scene_id, tag_id)
);
ALTER TABLE public.scene_tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own scene_tags" ON public.scene_tags
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.scenes
      JOIN public.books ON books.id = scenes.book_id
      JOIN public.projects ON projects.id = books.project_id
      WHERE scenes.id = scene_tags.scene_id AND projects.user_id = auth.uid()
    )
  );

CREATE TABLE public.character_tags (
  character_id UUID NOT NULL REFERENCES public.characters(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
  PRIMARY KEY (character_id, tag_id)
);
ALTER TABLE public.character_tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own character_tags" ON public.character_tags
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.characters
      JOIN public.projects ON projects.id = characters.project_id
      WHERE characters.id = character_tags.character_id AND projects.user_id = auth.uid()
    )
  );

CREATE TABLE public.place_tags (
  place_id UUID NOT NULL REFERENCES public.places(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
  PRIMARY KEY (place_id, tag_id)
);
ALTER TABLE public.place_tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own place_tags" ON public.place_tags
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.places
      JOIN public.projects ON projects.id = places.project_id
      WHERE places.id = place_tags.place_id AND projects.user_id = auth.uid()
    )
  );

-- ─── Character relations (00005) ─────────────────────────────────────────────
CREATE TABLE public.character_relations (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_character_id  UUID NOT NULL REFERENCES public.characters(id) ON DELETE CASCADE,
  to_character_id    UUID NOT NULL REFERENCES public.characters(id) ON DELETE CASCADE,
  relation_type      TEXT NOT NULL DEFAULT '',
  description        TEXT NOT NULL DEFAULT '',
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (from_character_id, to_character_id)
);

ALTER TABLE public.character_relations ENABLE ROW LEVEL SECURITY;
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

-- ─── Story promises (00003) ──────────────────────────────────────────────────
CREATE TABLE public.story_promises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  plant_scene_id UUID NOT NULL REFERENCES public.scenes(id) ON DELETE CASCADE,
  payoff_scene_id UUID REFERENCES public.scenes(id) ON DELETE SET NULL,
  resolved BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_story_promises_book_id ON public.story_promises(book_id);
CREATE INDEX idx_story_promises_plant_scene ON public.story_promises(plant_scene_id);
CREATE INDEX idx_story_promises_payoff_scene ON public.story_promises(payoff_scene_id);

ALTER TABLE public.story_promises ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own story_promises" ON public.story_promises
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.books
      JOIN public.projects ON projects.id = books.project_id
      WHERE books.id = story_promises.book_id AND projects.user_id = auth.uid()
    )
  );
CREATE POLICY "Users can insert own story_promises" ON public.story_promises
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.books
      JOIN public.projects ON projects.id = books.project_id
      WHERE books.id = story_promises.book_id AND projects.user_id = auth.uid()
    )
  );
CREATE POLICY "Users can update own story_promises" ON public.story_promises
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.books
      JOIN public.projects ON projects.id = books.project_id
      WHERE books.id = story_promises.book_id AND projects.user_id = auth.uid()
    )
  );
CREATE POLICY "Users can delete own story_promises" ON public.story_promises
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.books
      JOIN public.projects ON projects.id = books.project_id
      WHERE books.id = story_promises.book_id AND projects.user_id = auth.uid()
    )
  );

-- ─── Feature requests (00004) ────────────────────────────────────────────────
CREATE TABLE public.feature_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,  -- = neon_auth."user".id; nullable (SET NULL semantics handled in app)
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.feature_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert feature requests" ON public.feature_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view own feature requests" ON public.feature_requests
  FOR SELECT USING (auth.uid() = user_id);

-- ─── Writing goals & stats (00006) ───────────────────────────────────────────
CREATE TABLE public.writing_goals (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id  UUID        NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id     UUID        NOT NULL,  -- = neon_auth."user".id
  daily_goal  INTEGER     NOT NULL DEFAULT 500,
  total_goal  INTEGER,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (project_id, user_id)
);

CREATE TABLE public.writing_stats (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id       UUID        NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id          UUID        NOT NULL,  -- = neon_auth."user".id
  stat_date        DATE        NOT NULL,
  total_word_count INTEGER     NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (project_id, user_id, stat_date)
);

ALTER TABLE public.writing_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.writing_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "writing_goals_owner" ON public.writing_goals
  FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "writing_stats_owner" ON public.writing_stats
  FOR ALL USING (auth.uid() = user_id);

-- ─── Themes (00006) ──────────────────────────────────────────────────────────
CREATE TABLE public.themes (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id  UUID        NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name        TEXT        NOT NULL,
  color       TEXT        NOT NULL DEFAULT '#6366f1',
  description TEXT        NOT NULL DEFAULT '',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.scene_themes (
  scene_id  UUID NOT NULL REFERENCES public.scenes(id)  ON DELETE CASCADE,
  theme_id  UUID NOT NULL REFERENCES public.themes(id)  ON DELETE CASCADE,
  PRIMARY KEY (scene_id, theme_id)
);

ALTER TABLE public.themes       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scene_themes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "themes_project_owner" ON public.themes
  FOR ALL USING (
    project_id IN (
      SELECT id FROM public.projects
      WHERE user_id = auth.uid() AND deleted_at IS NULL
    )
  );

CREATE POLICY "scene_themes_project_owner" ON public.scene_themes
  FOR ALL USING (
    scene_id IN (
      SELECT s.id FROM public.scenes s
      JOIN public.books b ON s.book_id = b.id
      JOIN public.projects p ON b.project_id = p.id
      WHERE p.user_id = auth.uid() AND p.deleted_at IS NULL
    )
  );

-- ─── Project shares (00006 + 00008 fix + 00009 fix, final shape) ─────────────
CREATE TABLE public.project_shares (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id  UUID        NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id     UUID        NOT NULL DEFAULT auth.uid(),  -- = neon_auth."user".id; direct-owned, never joins projects (00008)
  share_token TEXT        NOT NULL UNIQUE
                DEFAULT translate(encode(gen_random_bytes(18), 'base64'), '+/=', '-_'),
  label       TEXT        NOT NULL DEFAULT '',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at  TIMESTAMPTZ
);

ALTER TABLE public.project_shares ENABLE ROW LEVEL SECURITY;

CREATE POLICY "project_shares_owner" ON public.project_shares
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "project_shares_public_read" ON public.project_shares
  FOR SELECT USING (expires_at IS NULL OR expires_at > NOW());

-- ─── Public read policies via share links (00007, minus the 00008-replaced one)
CREATE POLICY "projects_public_via_share" ON public.projects
  FOR SELECT USING (
    deleted_at IS NULL AND
    id IN (
      SELECT project_id FROM public.project_shares
      WHERE expires_at IS NULL OR expires_at > NOW()
    )
  );

CREATE POLICY "books_public_via_share" ON public.books
  FOR SELECT USING (
    deleted_at IS NULL AND
    project_id IN (
      SELECT project_id FROM public.project_shares
      WHERE expires_at IS NULL OR expires_at > NOW()
    )
  );

CREATE POLICY "chapters_public_via_share" ON public.chapters
  FOR SELECT USING (
    book_id IN (
      SELECT b.id FROM public.books b
      JOIN public.project_shares ps ON ps.project_id = b.project_id
      WHERE (ps.expires_at IS NULL OR ps.expires_at > NOW())
        AND b.deleted_at IS NULL
    )
  );

CREATE POLICY "plotlines_public_via_share" ON public.plotlines
  FOR SELECT USING (
    book_id IN (
      SELECT b.id FROM public.books b
      JOIN public.project_shares ps ON ps.project_id = b.project_id
      WHERE (ps.expires_at IS NULL OR ps.expires_at > NOW())
        AND b.deleted_at IS NULL
    )
  );

CREATE POLICY "scenes_public_via_share" ON public.scenes
  FOR SELECT USING (
    deleted_at IS NULL AND
    book_id IN (
      SELECT b.id FROM public.books b
      JOIN public.project_shares ps ON ps.project_id = b.project_id
      WHERE (ps.expires_at IS NULL OR ps.expires_at > NOW())
        AND b.deleted_at IS NULL
    )
  );

CREATE POLICY "characters_public_via_share" ON public.characters
  FOR SELECT USING (
    deleted_at IS NULL AND
    project_id IN (
      SELECT project_id FROM public.project_shares
      WHERE expires_at IS NULL OR expires_at > NOW()
    )
  );

CREATE POLICY "places_public_via_share" ON public.places
  FOR SELECT USING (
    deleted_at IS NULL AND
    project_id IN (
      SELECT project_id FROM public.project_shares
      WHERE expires_at IS NULL OR expires_at > NOW()
    )
  );

CREATE POLICY "scene_characters_public_via_share" ON public.scene_characters
  FOR SELECT USING (
    scene_id IN (
      SELECT s.id FROM public.scenes s
      JOIN public.books b ON s.book_id = b.id
      JOIN public.project_shares ps ON ps.project_id = b.project_id
      WHERE s.deleted_at IS NULL
        AND (ps.expires_at IS NULL OR ps.expires_at > NOW())
    )
  );

CREATE POLICY "scene_places_public_via_share" ON public.scene_places
  FOR SELECT USING (
    scene_id IN (
      SELECT s.id FROM public.scenes s
      JOIN public.books b ON s.book_id = b.id
      JOIN public.project_shares ps ON ps.project_id = b.project_id
      WHERE s.deleted_at IS NULL
        AND (ps.expires_at IS NULL OR ps.expires_at > NOW())
    )
  );

-- ─── Data API role grants ────────────────────────────────────────────────────
-- The Neon Data API's "Grant public schema access" gives `authenticated` full
-- CRUD via default ACLs. The `anonymous` role gets nothing by default, but the
-- /share/[token] flow reads share-viewable tables without login — grant SELECT
-- (RLS *_public_via_share policies still restrict which rows are visible).
GRANT USAGE ON SCHEMA public TO anonymous;
GRANT SELECT ON public.project_shares, public.projects, public.books, public.chapters,
  public.plotlines, public.scenes, public.characters, public.places,
  public.scene_characters, public.scene_places TO anonymous;

-- ─── updated_at triggers ─────────────────────────────────────────────────────
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.profiles          FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.projects          FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.books             FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.chapters          FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.plotlines         FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.scenes            FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.scene_google_docs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.characters        FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.places            FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.notes             FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.tags              FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.story_promises    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.writing_goals     FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.writing_stats     FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.themes            FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

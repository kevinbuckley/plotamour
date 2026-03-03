-- plotamour initial schema
-- Run this in your Supabase SQL Editor

-- Profiles (extends auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
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

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Projects
CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  project_type TEXT NOT NULL DEFAULT 'standalone'
    CHECK (project_type IN ('standalone', 'series')),
  attribute_templates JSONB DEFAULT '{}',
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

-- Books
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

-- Chapters
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

-- Plotlines
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

-- Characters
CREATE TABLE public.characters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  avatar_url TEXT,
  custom_attributes JSONB DEFAULT '{}',
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

-- Scenes
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
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_scenes_book_id ON public.scenes(book_id);
CREATE INDEX idx_scenes_chapter_id ON public.scenes(chapter_id);
CREATE INDEX idx_scenes_plotline_id ON public.scenes(plotline_id);
CREATE INDEX idx_scenes_chapter_plotline ON public.scenes(chapter_id, plotline_id);
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

-- Scene Google Docs
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

-- Join tables
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

-- Places
CREATE TABLE public.places (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  image_url TEXT,
  custom_attributes JSONB DEFAULT '{}',
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

-- Notes
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

-- Tags
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

-- Remaining join tables
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

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.books FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.chapters FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.plotlines FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.scenes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.scene_google_docs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.characters FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.places FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.notes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.tags FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

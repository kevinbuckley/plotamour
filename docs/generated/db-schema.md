# Database Schema

> Auto-generated reference. Source of truth is the Supabase migrations in `supabase/migrations/`.

## Tables

### users (extends Supabase auth.users)

```sql
-- Extra fields on the public profile, linked to auth.users
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  google_refresh_token TEXT,  -- encrypted, for Google Docs API
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### projects

```sql
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  project_type TEXT NOT NULL DEFAULT 'standalone'
    CHECK (project_type IN ('standalone', 'series')),
  attribute_templates JSONB DEFAULT '{}',  -- custom field definitions
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_projects_user_id ON projects(user_id);
```

### books

```sql
CREATE TABLE books (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  cover_image_url TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_books_project_id ON books(project_id);
```

### chapters

```sql
CREATE TABLE chapters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_chapters_book_id ON chapters(book_id);
```

### plotlines

```sql
CREATE TABLE plotlines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#6366f1',  -- hex color
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_plotlines_book_id ON plotlines(book_id);
```

### scenes

```sql
CREATE TABLE scenes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  chapter_id UUID NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
  plotline_id UUID NOT NULL REFERENCES plotlines(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'New Scene',
  summary TEXT DEFAULT '',
  conflict TEXT DEFAULT '',
  pov_character_id UUID REFERENCES characters(id) ON DELETE SET NULL,
  position INTEGER NOT NULL DEFAULT 0,  -- order within a cell (for stacks)
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_scenes_book_id ON scenes(book_id);
CREATE INDEX idx_scenes_chapter_id ON scenes(chapter_id);
CREATE INDEX idx_scenes_plotline_id ON scenes(plotline_id);
CREATE INDEX idx_scenes_chapter_plotline ON scenes(chapter_id, plotline_id);
```

### scene_google_docs

```sql
CREATE TABLE scene_google_docs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scene_id UUID NOT NULL UNIQUE REFERENCES scenes(id) ON DELETE CASCADE,
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

CREATE INDEX idx_scene_google_docs_scene_id ON scene_google_docs(scene_id);
```

### characters

```sql
CREATE TABLE characters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  avatar_url TEXT,
  custom_attributes JSONB DEFAULT '{}',
  sort_order INTEGER NOT NULL DEFAULT 0,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_characters_project_id ON characters(project_id);
```

### places

```sql
CREATE TABLE places (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  image_url TEXT,
  custom_attributes JSONB DEFAULT '{}',
  sort_order INTEGER NOT NULL DEFAULT 0,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_places_project_id ON places(project_id);
```

### notes

```sql
CREATE TABLE notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Untitled Note',
  content TEXT DEFAULT '',
  category TEXT DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notes_project_id ON notes(project_id);
```

### tags

```sql
CREATE TABLE tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#6366f1',
  category TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tags_project_id ON tags(project_id);
```

### Join Tables

```sql
CREATE TABLE scene_characters (
  scene_id UUID NOT NULL REFERENCES scenes(id) ON DELETE CASCADE,
  character_id UUID NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  PRIMARY KEY (scene_id, character_id)
);

CREATE TABLE scene_places (
  scene_id UUID NOT NULL REFERENCES scenes(id) ON DELETE CASCADE,
  place_id UUID NOT NULL REFERENCES places(id) ON DELETE CASCADE,
  PRIMARY KEY (scene_id, place_id)
);

CREATE TABLE scene_tags (
  scene_id UUID NOT NULL REFERENCES scenes(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (scene_id, tag_id)
);

CREATE TABLE character_tags (
  character_id UUID NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (character_id, tag_id)
);

CREATE TABLE place_tags (
  place_id UUID NOT NULL REFERENCES places(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (place_id, tag_id)
);
```

### templates

```sql
CREATE TABLE templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,  -- NULL for built-in
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  category TEXT DEFAULT 'plot',  -- 'plot' or 'character'
  structure JSONB NOT NULL,      -- template definition
  is_builtin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_templates_user_id ON templates(user_id);
```

## Row Level Security

All tables use RLS. General pattern:

```sql
-- Users can only see their own data
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own projects"
  ON projects FOR SELECT
  USING (auth.uid() = user_id AND deleted_at IS NULL);

CREATE POLICY "Users can insert own projects"
  ON projects FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own projects"
  ON projects FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own projects"
  ON projects FOR DELETE
  USING (auth.uid() = user_id);
```

Child tables (books, chapters, etc.) chain through their parent:

```sql
-- Example: books accessible if user owns the project
CREATE POLICY "Users can view own books"
  ON books FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = books.project_id
      AND projects.user_id = auth.uid()
      AND projects.deleted_at IS NULL
    )
  );
```

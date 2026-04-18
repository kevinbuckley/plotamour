-- Migration 00007: Public read policies for project sharing
--
-- Allows the anon key (no login required) to read project data
-- when that project has an active share link. This lets /share/[token]
-- work without the service role key.

-- project_shares: anyone can read active shares (the token itself is secret)
CREATE POLICY "project_shares_public_read" ON project_shares
  FOR SELECT USING (expires_at IS NULL OR expires_at > NOW());

-- projects: readable when an active share exists for the project
CREATE POLICY "projects_public_via_share" ON projects
  FOR SELECT USING (
    deleted_at IS NULL AND
    id IN (
      SELECT project_id FROM project_shares
      WHERE expires_at IS NULL OR expires_at > NOW()
    )
  );

-- books
CREATE POLICY "books_public_via_share" ON books
  FOR SELECT USING (
    deleted_at IS NULL AND
    project_id IN (
      SELECT project_id FROM project_shares
      WHERE expires_at IS NULL OR expires_at > NOW()
    )
  );

-- chapters
CREATE POLICY "chapters_public_via_share" ON chapters
  FOR SELECT USING (
    book_id IN (
      SELECT b.id FROM books b
      JOIN project_shares ps ON ps.project_id = b.project_id
      WHERE (ps.expires_at IS NULL OR ps.expires_at > NOW())
        AND b.deleted_at IS NULL
    )
  );

-- plotlines
CREATE POLICY "plotlines_public_via_share" ON plotlines
  FOR SELECT USING (
    book_id IN (
      SELECT b.id FROM books b
      JOIN project_shares ps ON ps.project_id = b.project_id
      WHERE (ps.expires_at IS NULL OR ps.expires_at > NOW())
        AND b.deleted_at IS NULL
    )
  );

-- scenes
CREATE POLICY "scenes_public_via_share" ON scenes
  FOR SELECT USING (
    deleted_at IS NULL AND
    book_id IN (
      SELECT b.id FROM books b
      JOIN project_shares ps ON ps.project_id = b.project_id
      WHERE (ps.expires_at IS NULL OR ps.expires_at > NOW())
        AND b.deleted_at IS NULL
    )
  );

-- characters
CREATE POLICY "characters_public_via_share" ON characters
  FOR SELECT USING (
    deleted_at IS NULL AND
    project_id IN (
      SELECT project_id FROM project_shares
      WHERE expires_at IS NULL OR expires_at > NOW()
    )
  );

-- places
CREATE POLICY "places_public_via_share" ON places
  FOR SELECT USING (
    deleted_at IS NULL AND
    project_id IN (
      SELECT project_id FROM project_shares
      WHERE expires_at IS NULL OR expires_at > NOW()
    )
  );

-- scene_characters join table
CREATE POLICY "scene_characters_public_via_share" ON scene_characters
  FOR SELECT USING (
    scene_id IN (
      SELECT s.id FROM scenes s
      JOIN books b ON s.book_id = b.id
      JOIN project_shares ps ON ps.project_id = b.project_id
      WHERE s.deleted_at IS NULL
        AND (ps.expires_at IS NULL OR ps.expires_at > NOW())
    )
  );

-- scene_places join table
CREATE POLICY "scene_places_public_via_share" ON scene_places
  FOR SELECT USING (
    scene_id IN (
      SELECT s.id FROM scenes s
      JOIN books b ON s.book_id = b.id
      JOIN project_shares ps ON ps.project_id = b.project_id
      WHERE s.deleted_at IS NULL
        AND (ps.expires_at IS NULL OR ps.expires_at > NOW())
    )
  );

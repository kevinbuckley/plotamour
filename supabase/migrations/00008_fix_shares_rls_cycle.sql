-- Migration 00008: Fix circular RLS dependency introduced by 00006 + 00007
--
-- The cycle:
--   project_shares_owner  → SELECT from projects  (to check ownership)
--   projects_public_via_share → SELECT from project_shares  (to check share exists)
-- PostgreSQL evaluates both policies simultaneously, causing infinite recursion
-- and returning zero rows for ALL project queries — even for authenticated users.
--
-- Fix: add user_id to project_shares so the owner policy needs no join to projects,
-- then re-create the affected policies.

-- 1. Add user_id column (backfill from projects for existing rows)
ALTER TABLE project_shares
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

UPDATE project_shares ps
SET user_id = p.user_id
FROM projects p
WHERE ps.project_id = p.id
  AND ps.user_id IS NULL;

-- Now make it NOT NULL (all rows should have a value after the backfill)
ALTER TABLE project_shares
  ALTER COLUMN user_id SET NOT NULL;

-- Default for future inserts (triggers on insert will have auth.uid() set via service/server)
-- We set a default of auth.uid() so application inserts without explicit user_id still work
ALTER TABLE project_shares
  ALTER COLUMN user_id SET DEFAULT auth.uid();

-- 2. Drop the two policies that form the cycle
DROP POLICY IF EXISTS "project_shares_owner"       ON project_shares;
DROP POLICY IF EXISTS "projects_public_via_share"  ON projects;

-- 3. Re-create project_shares_owner — no join to projects needed anymore
CREATE POLICY "project_shares_owner" ON project_shares
  FOR ALL USING (auth.uid() = user_id);

-- 4. Re-create projects_public_via_share — still references project_shares,
--    but project_shares_owner no longer references back to projects, so no cycle.
CREATE POLICY "projects_public_via_share" ON projects
  FOR SELECT USING (
    deleted_at IS NULL AND
    id IN (
      SELECT project_id FROM project_shares
      WHERE expires_at IS NULL OR expires_at > NOW()
    )
  );

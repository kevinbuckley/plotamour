-- Additive: existing positions remain valid; reordered cells become contiguous.
-- Serialize all scene writes, including Data API writes, with reorders.
CREATE OR REPLACE FUNCTION public.lock_scene_order()
RETURNS trigger LANGUAGE plpgsql SET search_path = public, pg_temp SET lock_timeout = '5s' AS $$
DECLARE
  target_book uuid;
  append_scene boolean := false;
BEGIN
  IF TG_OP = 'DELETE' THEN
    target_book := OLD.book_id;
  ELSE
    target_book := NEW.book_id;
    IF TG_OP = 'UPDATE' AND NEW.book_id IS DISTINCT FROM OLD.book_id THEN
      RAISE EXCEPTION 'Moving scenes between books is not supported' USING ERRCODE = '22023';
    END IF;
  END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended(target_book::text, 0));
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;

  -- Prevent inconsistent chapter/plotline scope even via direct Data API writes.
  IF NOT EXISTS (SELECT 1 FROM chapters WHERE id = NEW.chapter_id AND book_id = NEW.book_id)
    OR NOT EXISTS (SELECT 1 FROM plotlines WHERE id = NEW.plotline_id AND book_id = NEW.book_id) THEN
    RAISE EXCEPTION 'Invalid scene section' USING ERRCODE = '22023';
  END IF;
  IF TG_OP = 'INSERT' THEN
    append_scene := true;
  ELSE
    append_scene := NEW.chapter_id IS DISTINCT FROM OLD.chapter_id
      OR NEW.plotline_id IS DISTINCT FROM OLD.plotline_id
      OR (OLD.archived_at IS NOT NULL AND NEW.archived_at IS NULL)
      OR (OLD.deleted_at IS NOT NULL AND NEW.deleted_at IS NULL);
  END IF;
  IF append_scene AND NEW.deleted_at IS NULL AND NEW.archived_at IS NULL THEN
    SELECT COALESCE(max(position), -1) + 1 INTO NEW.position FROM scenes
      WHERE chapter_id = NEW.chapter_id AND plotline_id = NEW.plotline_id
      AND book_id = NEW.book_id AND deleted_at IS NULL AND archived_at IS NULL
      AND id <> NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS serialize_scene_order ON public.scenes;
CREATE TRIGGER serialize_scene_order BEFORE INSERT OR UPDATE OR DELETE ON public.scenes
  FOR EACH ROW EXECUTE FUNCTION public.lock_scene_order();

-- Only the server's owner connection may call this function. The caller supplies
-- the authenticated session user, never a user ID from the HTTP request.
CREATE OR REPLACE FUNCTION public.reorder_scene_cell(
  actor_id uuid, target_book uuid, target_chapter uuid, target_plotline uuid,
  expected_ids uuid[], ordered_ids uuid[]
) RETURNS SETOF public.scenes LANGUAGE plpgsql SET search_path = public, pg_temp SET lock_timeout = '5s' AS $$
DECLARE current_ids uuid[];
BEGIN
  PERFORM pg_advisory_xact_lock(hashtextextended(target_book::text, 0));
  IF NOT EXISTS (
    SELECT 1 FROM books b JOIN projects p ON p.id = b.project_id
    WHERE b.id = target_book AND p.user_id = actor_id
      AND b.deleted_at IS NULL AND p.deleted_at IS NULL
  ) THEN
    RAISE EXCEPTION 'Section not available' USING ERRCODE = '42501';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM chapters WHERE id = target_chapter AND book_id = target_book)
    OR NOT EXISTS (SELECT 1 FROM plotlines WHERE id = target_plotline AND book_id = target_book) THEN
    RAISE EXCEPTION 'Invalid scene section' USING ERRCODE = '22023';
  END IF;
  IF ordered_ids IS NULL OR expected_ids IS NULL OR cardinality(ordered_ids) = 0
    OR cardinality(ordered_ids) <> (SELECT count(DISTINCT id) FROM unnest(ordered_ids) id)
    OR cardinality(expected_ids) <> cardinality(ordered_ids)
    OR NOT (ordered_ids @> expected_ids AND ordered_ids <@ expected_ids) THEN
    RAISE EXCEPTION 'Invalid scene order' USING ERRCODE = '22023';
  END IF;
  SELECT COALESCE(array_agg(id ORDER BY position, id), ARRAY[]::uuid[]) INTO current_ids
    FROM scenes WHERE book_id = target_book AND chapter_id = target_chapter
      AND plotline_id = target_plotline AND deleted_at IS NULL AND archived_at IS NULL;
  IF current_ids IS DISTINCT FROM expected_ids THEN
    RAISE EXCEPTION 'Scene order changed; reload and retry' USING ERRCODE = '40001';
  END IF;
  RETURN QUERY UPDATE scenes s SET position = requested.ordinality::integer - 1
    FROM unnest(ordered_ids) WITH ORDINALITY AS requested(id, ordinality)
    WHERE s.id = requested.id AND s.book_id = target_book
      AND s.chapter_id = target_chapter AND s.plotline_id = target_plotline
      AND s.archived_at IS NULL AND s.deleted_at IS NULL
    RETURNING s.*;
END;
$$;
REVOKE ALL ON FUNCTION public.reorder_scene_cell(uuid, uuid, uuid, uuid, uuid[], uuid[]) FROM PUBLIC;
-- Neon may ALTER DEFAULT PRIVILEGES to grant EXECUTE to authenticated.
-- Remove explicit default grants too; revoking PUBLIC alone is insufficient.
DO $$
DECLARE grantee_name text;
BEGIN
  FOR grantee_name IN
    SELECT r.rolname FROM pg_proc p
    CROSS JOIN LATERAL aclexplode(p.proacl) a
    JOIN pg_roles r ON r.oid = a.grantee
    WHERE p.oid = 'public.reorder_scene_cell(uuid,uuid,uuid,uuid,uuid[],uuid[])'::regprocedure
      AND a.grantee <> p.proowner
  LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION public.reorder_scene_cell(uuid,uuid,uuid,uuid,uuid[],uuid[]) FROM %I', grantee_name);
  END LOOP;
END;
$$;

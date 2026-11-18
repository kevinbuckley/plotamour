"""Adversarial integration tests against disposable, real PostgreSQL (no app data).
Run: python3 scripts/test-scene-ordering.py. Requires PostgreSQL binaries on PATH.
"""
import concurrent.futures
import pathlib
import socket
import subprocess
import tempfile
import time
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[1]


def uid(n):
    return f"00000000-0000-4000-8000-{n:012d}"


def array(values):
    return "ARRAY[" + ",".join(f"'{uid(n)}'" for n in values) + "]::uuid[]"


class SceneOrderTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.temp = tempfile.TemporaryDirectory(prefix="plotamour-order-tests-")
        cls.path = pathlib.Path(cls.temp.name)
        with socket.socket() as sock:
            sock.bind(("127.0.0.1", 0))
            cls.port = sock.getsockname()[1]
        subprocess.run(["initdb", "-D", str(cls.path / "data"), "-A", "trust", "-U", "postgres"], check=True, capture_output=True)
        subprocess.run(["pg_ctl", "-D", str(cls.path / "data"), "-l", str(cls.path / "log"), "-o",
                        f"-p {cls.port} -k {cls.path} -h 127.0.0.1", "start"], check=True, capture_output=True)
        cls.cmd = ["psql", "-X", "-h", "127.0.0.1", "-p", str(cls.port), "-U", "postgres", "-d", "postgres", "-v", "ON_ERROR_STOP=1", "-qAt"]
        cls.sql("CREATE ROLE anonymous; CREATE ROLE app_user; ALTER DEFAULT PRIVILEGES GRANT EXECUTE ON FUNCTIONS TO app_user; CREATE SCHEMA auth; CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql AS $$ SELECT nullif(current_setting('test.user_id', true), '')::uuid $$;")
        cls.sql((ROOT / "neon/migrations/0001_init.sql").read_text())
        cls.sql((ROOT / "neon/migrations/0002_scene_ordering.sql").read_text())
        cls.sql("GRANT USAGE ON SCHEMA public, auth TO app_user; GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_user;")

    @classmethod
    def tearDownClass(cls):
        subprocess.run(["pg_ctl", "-D", str(cls.path / "data"), "-m", "immediate", "stop"], check=True, capture_output=True)
        cls.temp.cleanup()

    @classmethod
    def sql(cls, query, success=True):
        result = subprocess.run(cls.cmd, input=query, text=True, capture_output=True)
        if success and result.returncode:
            raise AssertionError(result.stderr)
        if not success and not result.returncode:
            raise AssertionError("Expected SQL rejection")
        return result.stdout.strip() if success else result.stderr

    def setUp(self):
        self.sql("TRUNCATE projects CASCADE;")
        self.sql(f"""
          INSERT INTO projects(id,user_id,title) VALUES ('{uid(1)}','{uid(100)}','Fixture');
          INSERT INTO books(id,project_id,title) VALUES ('{uid(2)}','{uid(1)}','Book');
          INSERT INTO chapters(id,book_id,title) VALUES ('{uid(3)}','{uid(2)}','Chapter');
          INSERT INTO plotlines(id,book_id,title) VALUES ('{uid(4)}','{uid(2)}','Plot'), ('{uid(5)}','{uid(2)}','Other');
          INSERT INTO scenes(id,book_id,chapter_id,plotline_id,title,summary) VALUES
            ('{uid(10)}','{uid(2)}','{uid(3)}','{uid(4)}','A','Preserve me'),
            ('{uid(11)}','{uid(2)}','{uid(3)}','{uid(4)}','B',''),
            ('{uid(12)}','{uid(2)}','{uid(3)}','{uid(4)}','C','');
        """)

    def reorder(self, order=(12, 10, 11), expected=(10, 11, 12), actor=100):
        return f"SELECT id FROM reorder_scene_cell('{uid(actor)}','{uid(2)}','{uid(3)}','{uid(4)}',{array(expected)},{array(order)});"

    def titles(self):
        return self.sql(f"SELECT string_agg(title,',' ORDER BY position,id) FROM scenes WHERE plotline_id='{uid(4)}' AND archived_at IS NULL AND deleted_at IS NULL;")

    def test_reorder_preserves_content_and_normalizes(self):
        self.sql(self.reorder())
        self.assertEqual(self.titles(), "C,A,B")
        self.assertEqual(self.sql("SELECT string_agg(position::text,',' ORDER BY position) FROM scenes"), "0,1,2")
        self.assertEqual(self.sql(f"SELECT summary FROM scenes WHERE id='{uid(10)}'"), "Preserve me")

    def test_stale_request_is_atomic(self):
        self.sql(self.reorder())
        self.assertIn("reload and retry", self.sql(self.reorder((11, 12, 10)), success=False))
        self.assertEqual(self.titles(), "C,A,B")

    def test_rejects_duplicate_missing_foreign_and_null_ids(self):
        for expected, order in [((10, 11, 12), (10, 10, 11)), ((10, 11), (11, 10)), ((10, 11, 99), (99, 10, 11)), ((), ())]:
            self.sql(self.reorder(order, expected), success=False)
            self.assertEqual(self.titles(), "A,B,C")
        query = self.reorder().replace(array((12, 10, 11)), f"ARRAY['{uid(10)}',NULL,'{uid(12)}']::uuid[]")
        self.sql(query, success=False)

    def test_wrong_owner_and_deleted_project_rejected(self):
        self.sql(self.reorder(actor=101), success=False)
        self.sql("UPDATE projects SET deleted_at=now()")
        self.sql(self.reorder(), success=False)
        self.assertEqual(self.titles(), "A,B,C")

    def test_public_cannot_spoof_actor(self):
        error = self.sql("SET ROLE app_user; " + self.reorder(), success=False)
        self.assertIn("permission denied for function", error)

    def test_invalid_scope_rejected(self):
        self.sql(self.reorder().replace(uid(3), uid(999)), success=False)
        self.sql(f"UPDATE scenes SET chapter_id='{uid(999)}' WHERE id='{uid(10)}'", success=False)
        self.assertEqual(self.titles(), "A,B,C")

    def test_archive_restore_and_move_append(self):
        self.sql(f"UPDATE scenes SET archived_at=now() WHERE id='{uid(10)}'; UPDATE scenes SET archived_at=NULL WHERE id='{uid(10)}';")
        self.assertEqual(self.titles(), "B,C,A")
        self.sql(f"UPDATE scenes SET plotline_id='{uid(5)}',position=0 WHERE id='{uid(10)}'; UPDATE scenes SET plotline_id='{uid(4)}',position=0 WHERE id='{uid(10)}';")
        self.assertEqual(self.titles(), "B,C,A")

    def test_rls_writer_can_create_but_cannot_spoof_owner(self):
        self.sql(f"SET ROLE app_user; SET test.user_id='{uid(100)}'; INSERT INTO scenes(id,book_id,chapter_id,plotline_id,title) VALUES ('{uid(13)}','{uid(2)}','{uid(3)}','{uid(4)}','D');")
        self.assertEqual(self.titles(), "A,B,C,D")
        self.sql(f"SET ROLE app_user; SET test.user_id='{uid(101)}'; INSERT INTO scenes(id,book_id,chapter_id,plotline_id,title) VALUES ('{uid(14)}','{uid(2)}','{uid(3)}','{uid(4)}','Forbidden');", success=False)
        self.assertEqual(self.titles(), "A,B,C,D")

    def test_archive_changes_membership(self):
        self.sql(f"UPDATE scenes SET archived_at=now() WHERE id='{uid(11)}'")
        self.sql(self.reorder(), success=False)
        self.assertEqual(self.titles(), "A,C")

    def test_concurrent_reorder_rejects_loser(self):
        with concurrent.futures.ThreadPoolExecutor() as pool:
            first = pool.submit(self.sql, "BEGIN; " + self.reorder() + " SELECT pg_sleep(0.5); COMMIT;")
            # Wait until the first transaction is sleeping with its lock held.
            for _ in range(100):
                if self.sql("SELECT count(*) FROM pg_stat_activity WHERE wait_event='PgSleep' AND pid<>pg_backend_pid()") == "1":
                    break
                time.sleep(0.01)
            else:
                self.fail("First transaction did not acquire lock")
            rejected = self.sql(self.reorder((11, 12, 10)), success=False)
            first.result()
        self.assertIn("reload and retry", rejected)
        self.assertEqual(self.titles(), "C,A,B")

    def test_concurrent_creation_appends_after_reorder(self):
        with concurrent.futures.ThreadPoolExecutor() as pool:
            first = pool.submit(self.sql, "BEGIN; " + self.reorder() + " SELECT pg_sleep(0.5); COMMIT;")
            for _ in range(100):
                if self.sql("SELECT count(*) FROM pg_stat_activity WHERE wait_event='PgSleep' AND pid<>pg_backend_pid()") == "1":
                    break
                time.sleep(0.01)
            self.sql(f"INSERT INTO scenes(id,book_id,chapter_id,plotline_id,title,position) VALUES ('{uid(13)}','{uid(2)}','{uid(3)}','{uid(4)}','D',0)")
            first.result()
        self.assertEqual(self.titles(), "C,A,B,D")


if __name__ == "__main__":
    unittest.main(verbosity=2)

# Neon migrations

Apply numbered migrations in order. Existing installations with `0001_init.sql` applied must apply `0002_scene_ordering.sql` before deploying the scene-ordering application code. The migration adds functions and a trigger; it does not rewrite existing scene content or positions.

```sh
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 --single-transaction -f neon/migrations/0002_scene_ordering.sql
```

The server's `DATABASE_URL` must use the migration/function owner. The reorder function accepts the authenticated actor only from the server session and checks ownership inside its transaction. Its EXECUTE grants are restricted to the owner, including removal of grants inherited from Neon's default privileges. Do not grant this function to Data API roles.

Run the database tests without connecting to any application database:

```sh
python3 scripts/test-scene-ordering.py
```

They start a disposable PostgreSQL cluster using `initdb`, `pg_ctl`, and `psql` from PATH and stop it after the tests. They cover RLS writes, actor spoofing, membership validation, stale requests, concurrent reorders/creation, and append placement on restore/move.

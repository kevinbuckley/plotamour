// Layer 2: Database — direct owner connection (bypasses RLS)
//
// Replacement for the old Neon service-role client. The neondb_owner
// connection is not subject to RLS, so only use this in server-only admin
// contexts (admin pages, auth-adjacent lookups like Google refresh tokens).

import { neon } from "@neondatabase/serverless";
import { env } from "@/lib/config/env";

export function serviceSql() {
  return neon(env.DATABASE_URL);
}

// Layer 2: Database — Neon Data API (PostgREST) server client
//
// createClient() keeps the same shape the services were written against with
// db-js: `.from(table)...` for queries plus `.auth.getUser()`. Queries
// go through the Neon Data API with the signed-in user's JWT, so RLS policies
// (auth.uid()) scope every row. Anonymous requests (share pages) simply omit
// the Authorization header and rely on the *_public_via_share policies.

import { NeonPostgrestClient } from "@neondatabase/postgrest-js";
import { auth } from "@/lib/auth/server";
import { env } from "@/lib/config/env";

export interface DbUser {
  id: string;
  email: string;
  user_metadata: { full_name?: string; avatar_url?: string };
}

export type DbClient = NeonPostgrestClient & {
  auth: {
    getUser(): Promise<{
      data: { user: DbUser | null };
      error: Error | null;
    }>;
  };
};

async function getDataApiJwt(): Promise<string | null> {
  try {
    const { data } = await auth.token();
    return (data as { token?: string } | null)?.token ?? null;
  } catch {
    return null;
  }
}

export async function createClient(): Promise<DbClient> {
  // Resolve the JWT once per client (i.e. once per request in practice);
  // the Data API validates it against the project JWKS on every call.
  const jwt = await getDataApiJwt();

  const rest = new NeonPostgrestClient({
    dataApiUrl: env.NEXT_PUBLIC_NEON_DATA_API_URL,
    options: {
      global: {
        fetch: (input: RequestInfo | URL, init?: RequestInit) => {
          const headers = new Headers(init?.headers);
          if (jwt) headers.set("Authorization", `Bearer ${jwt}`);
          return fetch(input, { ...init, headers });
        },
      },
    },
  }) as DbClient;

  rest.auth = {
    async getUser() {
      try {
        const { data } = await auth.getSession();
        const u = data?.user;
        if (!u) {
          return { data: { user: null }, error: new Error("Not authenticated") };
        }
        return {
          data: {
            user: {
              id: u.id,
              email: u.email ?? "",
              user_metadata: {
                full_name: u.name ?? undefined,
                avatar_url: u.image ?? undefined,
              },
            },
          },
          error: null,
        };
      } catch (e) {
        return { data: { user: null }, error: e as Error };
      }
    },
  };

  return rest;
}

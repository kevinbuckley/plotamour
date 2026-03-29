"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/db/browser";

/**
 * Silently syncs provider_refresh_token to the profiles table whenever
 * Supabase fires a SIGNED_IN auth state change with a token present.
 * This handles cases where the auth code is exchanged client-side
 * (e.g. when Supabase redirects to the Site URL instead of /auth/callback),
 * bypassing the server-side callback that normally stores the token.
 */
export function TokenSync() {
  useEffect(() => {
    const supabase = createClient();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (
          (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") &&
          session?.provider_refresh_token
        ) {
          // Fire-and-forget: store the refresh token server-side
          fetch("/api/store-token", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ refreshToken: session.provider_refresh_token }),
          }).catch(() => {
            // Non-critical — the server-side callback may have already stored it
          });
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  return null;
}

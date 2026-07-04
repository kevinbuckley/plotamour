"use client";

// Layer 2: Auth — Neon Auth browser client
//
// Talks to our /api/auth/* proxy (see src/app/api/auth/[...path]/route.ts),
// which forwards to the Neon Auth server and manages session cookies.

import { createAuthClient } from "@neondatabase/auth/next";

export const authClient = createAuthClient();

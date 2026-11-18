// @vitest-environment node
import { afterEach, expect, it, vi } from "vitest";

vi.mock("@/lib/config/env", () => ({ env: {
  NEON_AUTH_BASE_URL: "https://auth.example.com/auth",
  NEON_AUTH_COOKIE_SECRET: "test-cookie-secret-with-at-least-32-characters",
} }));
import { auth } from "./server";

afterEach(() => vi.unstubAllGlobals());

it("preserves cross-site Google callback challenge cookies through the real auth proxy", async () => {
  const headers = new Headers({ "Content-Type": "application/json" });
  for (const name of ["session_challenge", "session_challange"]) {
    headers.append("Set-Cookie", `__Secure-neon-auth.${name}=synthetic-challenge; Path=/; Max-Age=600; HttpOnly; Secure; SameSite=None; Partitioned`);
  }
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ redirect: true, url: "https://accounts.google.com/" }), { headers })));
  const response = await auth.handler().POST(new Request("https://plotamour.com/api/auth/sign-in/social", {
    method: "POST", headers: { Origin: "https://plotamour.com", "Content-Type": "application/json" },
    body: JSON.stringify({ provider: "google", callbackURL: "/auth/callback" }),
  }), { params: Promise.resolve({ path: ["sign-in", "social"] }) });
  expect(response.status).toBe(200);
  const challenges = response.headers.getSetCookie();
  expect(challenges).toHaveLength(2);
  for (const cookie of challenges) {
    expect(cookie).toMatch(/SameSite=Lax/i);
    expect(cookie).toMatch(/; Secure/i);
    expect(cookie).toMatch(/; HttpOnly/i);
    expect(cookie).not.toMatch(/Partitioned/i);
  }
});

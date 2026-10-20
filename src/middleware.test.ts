// @vitest-environment node
import { beforeEach, expect, it, vi } from "vitest";
import { NextRequest, NextResponse } from "next/server";
const sdk = vi.hoisted(() => vi.fn());
vi.mock("@/lib/auth/server", () => ({ auth: { middleware: () => sdk } }));
import { middleware } from "./middleware";
beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("CHATGPT_LOCAL_ENABLED", "true");
  vi.stubEnv("NODE_ENV", "development");
  vi.stubEnv("VERCEL", "");
  vi.stubEnv("CHATGPT_LOCAL_ORIGIN", "http://127.0.0.1:3000");
});
it("lets only the enabled local OAuth callback reach its own state validator", async () => {
  const response = await middleware(
    new NextRequest("http://127.0.0.1:3000/api/ai/chatgpt/callback", {
      headers: { host: "127.0.0.1:3000" },
    }),
  );
  expect(response.headers.get("x-middleware-next")).toBe("1");
  vi.stubEnv("VERCEL", "1");
  const hosted = await middleware(
    new NextRequest("http://127.0.0.1:3000/api/ai/chatgpt/callback", {
      headers: { host: "127.0.0.1:3000" },
    }),
  );
  expect(hosted.headers.get("x-middleware-next")).toBeNull();
});
it("keeps the exact loopback host when an unauthenticated local page redirects", async () => {
  const response = await middleware(
    new NextRequest("http://127.0.0.1:3000/projects", {
      headers: { host: "127.0.0.1:3000" },
    }),
  );
  expect(response.headers.get("location")).toBe(
    "http://127.0.0.1:3000/api/dev-login",
  );
});
it("preserves the existing Google verifier exchange", async () => {
  sdk.mockResolvedValue(NextResponse.next());
  await middleware(
    new NextRequest(
      "http://127.0.0.1:3000/auth/callback?neon_auth_session_verifier=synthetic",
      {
        headers: {
          host: "127.0.0.1:3000",
          cookie: "__Secure-neon-auth.session_challange=synthetic",
        },
      },
    ),
  );
  expect(sdk).toHaveBeenCalledTimes(1);
});

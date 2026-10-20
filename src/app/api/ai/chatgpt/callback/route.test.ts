// @vitest-environment node
import { beforeEach, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
vi.mock("@/lib/services/current-user", () => ({ currentUser: vi.fn() }));
vi.mock("@/lib/services/chatgpt", () => ({
  checkLocalRequest: vi.fn(),
  finishChatGpt: vi.fn(),
}));
import { currentUser } from "@/lib/services/current-user";
import { finishChatGpt } from "@/lib/services/chatgpt";
import { GET } from "./route";
beforeEach(() => {
  vi.resetAllMocks();
});
it("ends the cross-site redirect chain without altering the Plotamour session", async () => {
  vi.mocked(currentUser).mockResolvedValue(null);
  const request = new NextRequest(
    "http://127.0.0.1:3000/api/ai/chatgpt/callback?code=sensitive-code&state=test-state",
    { headers: { cookie: "plotamour-chatgpt-attempt=test-state" } },
  );
  const response = await GET(request);
  expect(response.status).toBe(200);
  expect(response.headers.get("location")).toBeNull();
  const html = await response.text();
  expect(html).toContain("/settings/ai?connection=complete");
  expect(html).not.toContain("sensitive-code");
  expect(response.headers.get("referrer-policy")).toBe("no-referrer");
  expect(response.headers.get("cache-control")).toBe("no-store");
  expect(response.headers.get("set-cookie")).toContain(
    "plotamour-chatgpt-attempt=;",
  );
  expect(response.headers.get("set-cookie")).not.toContain("neon-auth");
  expect(finishChatGpt).toHaveBeenCalledWith(
    undefined,
    expect.any(URLSearchParams),
    "test-state",
  );
});
it("shows a safe recovery page on declined or invalid authorization", async () => {
  vi.mocked(finishChatGpt).mockRejectedValue(
    new Error("private OAuth diagnostics"),
  );
  const response = await GET(
    new NextRequest(
      "http://127.0.0.1:3000/api/ai/chatgpt/callback?error=access_denied",
    ),
  );
  const html = await response.text();
  expect(html).toContain("connection=failed");
  expect(html).not.toContain("private OAuth diagnostics");
});

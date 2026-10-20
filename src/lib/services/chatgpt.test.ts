// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import { generateKeyPair, SignJWT, exportJWK, createLocalJWKSet } from "jose";
const memory = vi.hoisted(() => new Map<string, unknown>());
const keySet = vi.hoisted(() => ({ resolver: undefined as unknown }));
vi.mock("@/lib/db/chatgpt-store", () => ({
  readLocal: vi.fn(async (key: string) => memory.get(key) ?? null),
  writeLocal: vi.fn(async (key: string, value: unknown) => {
    memory.set(key, value);
  }),
  deleteLocal: vi.fn(async (key: string) => {
    memory.delete(key);
  }),
  hostId: vi.fn(async () => "urn:uuid:synthetic-host"),
  withLocalLock: vi.fn(async (_key: string, fn: () => Promise<unknown>) =>
    fn(),
  ),
}));
vi.mock("jose", async (importOriginal) => {
  const actual = await importOriginal<typeof import("jose")>();
  return {
    ...actual,
    createRemoteJWKSet:
      () =>
      (...args: Parameters<ReturnType<typeof actual.createLocalJWKSet>>) =>
        (keySet.resolver as ReturnType<typeof actual.createLocalJWKSet>)(
          ...args,
        ),
  };
});
import {
  startChatGpt,
  finishChatGpt,
  consumeChatGptStream,
  chatGptStatus,
  runChatGpt,
  checkLocalRequest,
  disconnectChatGpt,
} from "./chatgpt";
import type { ChatGptTransaction } from "@/lib/types/ai";
const fetchMock = vi.mocked(fetch);
function sse(events: unknown[]) {
  const bytes = new TextEncoder().encode(
    events.map((event) => `data: ${JSON.stringify(event)}\r\n\r\n`).join(""),
  );
  // Deliberately split UTF-8, CRLF, event and JSON boundaries.
  return new Response(
    new ReadableStream({
      start(controller) {
        for (let i = 0; i < bytes.length; i += 3)
          controller.enqueue(bytes.slice(i, i + 3));
        controller.close();
      },
    }),
  );
}
const reg = () => ({
  clientId: "oaiapp_synthetic",
  subject: "synthetic",
  accessToken: "test-access",
  refreshToken: "test-refresh",
  scopes: ["chatgpt.tokens.use.direct"],
  expiresAt: Date.now() + 3600000,
});
beforeEach(() => {
  memory.clear();
  vi.clearAllMocks();
  fetchMock.mockReset();
  vi.stubEnv("CHATGPT_LOCAL_ENABLED", "true");
  vi.stubEnv("CHATGPT_LOCAL_ORIGIN", "http://127.0.0.1:3000");
  vi.stubEnv("NODE_ENV", "development");
  vi.stubEnv("VERCEL", "");
});
describe("local OAuth", () => {
  it("uses PKCE, unique state/nonce, stable host and separate consent", async () => {
    const identity = new URL(await startChatGpt("user-a", false));
    const plan = new URL(await startChatGpt("user-a", true));
    expect(identity.searchParams.get("scope")).toBe("openid profile email");
    expect(plan.searchParams.get("scope")).toContain(
      "chatgpt.tokens.use.direct",
    );
    expect(plan.searchParams.get("redirect_uri")).toBe(
      "http://127.0.0.1:3000/api/ai/chatgpt/callback",
    );
    expect(plan.searchParams.get("client_id")).toBe("dynamic_agent_client");
    expect(plan.searchParams.get("code_challenge_method")).toBe("S256");
    expect(plan.searchParams.get("state")).not.toBe(
      identity.searchParams.get("state"),
    );
    expect(plan.searchParams.get("nonce")).not.toBe(
      identity.searchParams.get("nonce"),
    );
  });
  it("verifies a real signed ID token, stores granted scope, consumes state once", async () => {
    const url = new URL(await startChatGpt("user-a", true));
    const state = url.searchParams.get("state")!;
    const tx = memory.get(`transaction:${state}`) as ChatGptTransaction;
    const { privateKey, publicKey } = await generateKeyPair("RS256");
    keySet.resolver = createLocalJWKSet({ keys: [await exportJWK(publicKey)] });
    const idToken = await new SignJWT({
      nonce: tx.nonce,
      email: "synthetic@example.invalid",
    })
      .setProtectedHeader({ alg: "RS256" })
      .setIssuer("https://auth.openai.com")
      .setAudience("oaiapp_synthetic")
      .setSubject("synthetic")
      .setIssuedAt()
      .setExpirationTime("1h")
      .sign(privateKey);
    fetchMock.mockResolvedValueOnce(
      Response.json({
        access_token: "test-access",
        id_token: idToken,
        token_type: "Bearer",
        expires_in: 3600,
        scope: "openid email",
      }),
    );
    const params = new URLSearchParams({
      state,
      code: "test-code",
      client_id: "oaiapp_synthetic",
    });
    await finishChatGpt(undefined, params, state); // Strict Neon cookie absent on OAuth return.
    expect((await chatGptStatus("user-a")).planUsage).toBe(false);
    expect((await chatGptStatus("user-b")).connected).toBe(false);
    await expect(finishChatGpt("user-a", params, state)).rejects.toThrow();
  });
  it.each(["nonce", "audience", "issuer", "subject", "signature", "expiry"])(
    "rejects invalid %s without replacing an existing account",
    async (invalid) => {
      const original = reg();
      memory.set("registration:user-a", original);
      const url = new URL(await startChatGpt("user-a", true));
      const state = url.searchParams.get("state")!;
      const tx = memory.get(`transaction:${state}`) as ChatGptTransaction;
      const keys = await generateKeyPair("RS256");
      const otherKeys = await generateKeyPair("RS256");
      keySet.resolver = createLocalJWKSet({
        keys: [await exportJWK(keys.publicKey)],
      });
      const token = await new SignJWT({
        nonce: invalid === "nonce" ? "wrong" : tx.nonce,
      })
        .setProtectedHeader({ alg: "RS256" })
        .setIssuer(
          invalid === "issuer"
            ? "https://invalid.example"
            : "https://auth.openai.com",
        )
        .setAudience(invalid === "audience" ? "wrong" : "oaiapp_synthetic")
        .setSubject(invalid === "subject" ? "wrong" : "synthetic")
        .setIssuedAt()
        .setExpirationTime(invalid === "expiry" ? "-1h" : "1h")
        .sign(invalid === "signature" ? otherKeys.privateKey : keys.privateKey);
      fetchMock.mockResolvedValueOnce(
        Response.json({
          access_token: "new-secret",
          id_token: token,
          token_type: "Bearer",
          expires_in: 3600,
          scope: "chatgpt.tokens.use.direct",
        }),
      );
      await expect(
        finishChatGpt(
          "user-a",
          new URLSearchParams({
            state,
            code: "test",
            client_id: "oaiapp_synthetic",
          }),
          state,
        ),
      ).rejects.toThrow();
      expect(memory.get("registration:user-a")).toEqual(original);
    },
  );
  it("rejects missing browser binding, another user, declined consent, and client substitution", async () => {
    memory.set("registration:user-a", reg());
    for (const invalid of ["cookie", "user", "decline", "client"]) {
      const url = new URL(await startChatGpt("user-a", true));
      const state = url.searchParams.get("state")!;
      const params = new URLSearchParams({
        state,
        code: "test",
        client_id: invalid === "client" ? "oaiapp_other" : "oaiapp_synthetic",
      });
      if (invalid === "decline") params.set("error", "access_denied");
      await expect(
        finishChatGpt(
          invalid === "user" ? "user-b" : "user-a",
          params,
          invalid === "cookie" ? undefined : state,
        ),
      ).rejects.toThrow();
    }
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it("gates hosted runtimes and cross-origin mutation", () => {
    expect(() =>
      checkLocalRequest(
        new Request("http://127.0.0.1:3000/api/ai", {
          headers: { host: "127.0.0.1:3000", origin: "https://evil.example" },
        }),
        true,
      ),
    ).toThrow();
    vi.stubEnv("VERCEL", "1");
    expect(() =>
      checkLocalRequest(new Request("http://127.0.0.1:3000/api/ai")),
    ).toThrow();
  });
});
describe("stream completion", () => {
  it("requires completed and retains split Unicode text", async () => {
    await expect(
      consumeChatGptStream(
        sse([
          {
            type: "response.output_text.delta",
            delta: "Tomorrow’s lighthouse",
          },
          { type: "response.completed" },
        ]),
      ),
    ).resolves.toBe("Tomorrow’s lighthouse");
  });
  it.each(["response.failed", "response.incomplete", "error"])(
    "discards partial text on %s",
    async (type) => {
      await expect(
        consumeChatGptStream(
          sse([
            { type: "response.output_text.delta", delta: "partial" },
            {
              type,
              response: {
                error: { code: "subscription_sharing_usage_limit_exceeded" },
              },
            },
          ]),
        ),
      ).rejects.toThrow(/allowance/);
    },
  );
  it("rejects truncated and empty streams", async () => {
    await expect(
      consumeChatGptStream(
        sse([{ type: "response.output_text.delta", delta: "partial" }]),
      ),
    ).rejects.toThrow(/did not complete/);
    await expect(
      consumeChatGptStream(sse([{ type: "response.completed" }])),
    ).rejects.toThrow(/did not complete/);
  });
});
describe("model and token lifecycle", () => {
  it("discovers models, refreshes atomically and uses only supported inference fields", async () => {
    memory.set("registration:user-a", { ...reg(), expiresAt: 0 });
    fetchMock
      .mockResolvedValueOnce(
        Response.json({
          access_token: "renewed",
          refresh_token: "rotated",
          scope: "chatgpt.tokens.use.direct",
          token_type: "Bearer",
          expires_in: 3600,
        }),
      )
      .mockResolvedValueOnce(
        Response.json({
          models: [
            {
              slug: "available-model",
              display_name: "Available",
              visibility: "list",
            },
          ],
        }),
      )
      .mockResolvedValueOnce(
        sse([
          { type: "response.output_text.delta", delta: "Three scene ideas" },
          { type: "response.completed" },
        ]),
      );
    await expect(
      runChatGpt("user-a", "available-model", "Synthetic lighthouse"),
    ).resolves.toBe("Three scene ideas");
    const calls = fetchMock.mock.calls;
    expect(JSON.parse(calls[2][1]!.body as string)).toEqual({
      model: "available-model",
      input: [{ role: "user", content: "Synthetic lighthouse" }],
      store: false,
      stream: true,
    });
    expect(memory.get("registration:user-a")).toMatchObject({
      accessToken: "renewed",
      refreshToken: "rotated",
    });
  });
  it("does not infer without plan consent or with an unavailable model", async () => {
    await expect(runChatGpt("user-b", "model", "story")).rejects.toThrow(
      /enable plan/,
    );
    memory.set("registration:user-a", reg());
    fetchMock.mockResolvedValueOnce(Response.json({ models: [] }));
    await expect(
      runChatGpt("user-a", "not-available", "story"),
    ).rejects.toThrow(/available/);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
  it("retains credentials on transient refresh failure and clears terminally invalid tokens", async () => {
    const original = { ...reg(), expiresAt: 0 };
    memory.set("registration:user-a", original);
    fetchMock.mockResolvedValueOnce(
      Response.json(
        { error: { code: "temporarily_unavailable" } },
        { status: 503 },
      ),
    );
    await expect(
      runChatGpt("user-a", "available", "synthetic"),
    ).rejects.toThrow(/renew/);
    expect(memory.get("registration:user-a")).toEqual(original);
    fetchMock.mockResolvedValueOnce(
      Response.json({ error: "invalid_grant" }, { status: 400 }),
    );
    await expect(
      runChatGpt("user-a", "available", "synthetic"),
    ).rejects.toThrow(/renew/);
    expect(memory.get("registration:user-a")).not.toHaveProperty("accessToken");
    expect(memory.get("registration:user-a")).not.toHaveProperty(
      "refreshToken",
    );
  });
  it("reports remote revocation failure while clearing local tokens", async () => {
    memory.set("registration:user-a", reg());
    fetchMock.mockResolvedValue(new Response(null, { status: 503 }));
    expect(await disconnectChatGpt("user-a")).toEqual({ revoked: false });
    expect(memory.get("registration:user-a")).not.toHaveProperty(
      "refreshToken",
    );
  });
  it("clears local secrets on disconnect and retains registration for reauthorization", async () => {
    memory.set("registration:user-a", reg());
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 200 }));
    expect(await disconnectChatGpt("user-a")).toEqual({ revoked: true });
    expect(memory.get("registration:user-a")).toEqual({
      clientId: "oaiapp_synthetic",
      subject: "synthetic",
      email: undefined,
      scopes: [],
      expiresAt: 0,
    });
    const url = new URL(await startChatGpt("user-a", true));
    expect(url.searchParams.get("client_id")).toBe("oaiapp_synthetic");
    expect(url.searchParams.get("agent_name_hint")).toBeNull();
    expect(url.searchParams.get("prompt")).toBe("consent");
  });
});

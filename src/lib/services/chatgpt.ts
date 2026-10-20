import { createHash, randomBytes } from "node:crypto";
import { createRemoteJWKSet, jwtVerify } from "jose";
import { z } from "zod";
import {
  CHATGPT_ISSUER,
  CHATGPT_RESOURCE,
  CHATGPT_PLAN_SCOPE,
  CHATGPT_SCOPES,
  chatGptEnabled,
  chatGptOrigin,
} from "@/lib/config/chatgpt";
import {
  readLocal,
  writeLocal,
  deleteLocal,
  hostId,
  withLocalLock,
} from "@/lib/db/chatgpt-store";
import type {
  ChatGptRegistration,
  ChatGptStatus,
  ChatGptTransaction,
} from "@/lib/types/ai";

const jwks = createRemoteJWKSet(
  new URL(`${CHATGPT_ISSUER}/.well-known/jwks.json`),
);
const regKey = (userId: string) => `registration:${userId}`;
const tokenSchema = z.object({
  access_token: z.string().min(1),
  refresh_token: z.string().min(1).optional(),
  id_token: z.string().optional(),
  token_type: z.literal("Bearer"),
  scope: z.string(),
  expires_in: z.number().positive(),
});
const modelsSchema = z.object({
  models: z.array(
    z.object({
      slug: z.string(),
      display_name: z.string(),
      visibility: z.string(),
    }),
  ),
});
function enabled() {
  if (!chatGptEnabled())
    throw new Error(
      "ChatGPT is available only in the explicitly enabled local app.",
    );
}
function random() {
  return randomBytes(32).toString("base64url");
}
export function checkLocalRequest(request: Request, mutation = false) {
  enabled();
  const origin = chatGptOrigin();
  if (
    new URL(request.url).protocol !== "http:" ||
    request.headers.get("host") !== new URL(origin).host ||
    (mutation && request.headers.get("origin") !== origin)
  ) {
    throw new Error(
      "Open the local app at its configured 127.0.0.1 address and retry.",
    );
  }
}
function recovery(code?: string) {
  if (code === "subscription_sharing_user_not_eligible")
    return "ChatGPT plan usage is unavailable for this account or workspace. Check eligibility with OpenAI.";
  if (code?.includes("usage_limit") || code?.includes("usage_unavailable"))
    return "ChatGPT plan allowance is unavailable. Review limits in ChatGPT Settings → Usage, or retry later.";
  return "ChatGPT could not complete this request. Reconnect in AI settings, check plan access, or retry later. No other provider was used.";
}
async function fetchOpenAi(url: string, init?: RequestInit) {
  try {
    return await fetch(url, {
      ...init,
      cache: "no-store",
      signal: AbortSignal.timeout(120_000),
      redirect: "error",
    });
  } catch {
    throw new Error("OpenAI could not be reached. Retry from AI settings.");
  }
}
async function checked(response: Response) {
  if (response.ok) return response;
  const body = (await response.json().catch(() => ({}))) as {
    error?: { code?: string };
  };
  throw new Error(
    response.status === 401
      ? "ChatGPT authorization expired or was revoked. Reconnect in AI settings."
      : recovery(body.error?.code),
  );
}
export async function startChatGpt(userId: string, planConsent: boolean) {
  enabled();
  const registration = await readLocal<ChatGptRegistration>(regKey(userId));
  const tx: ChatGptTransaction = {
    state: random(),
    userId,
    nonce: random(),
    verifier: random(),
    redirectUri: `${chatGptOrigin()}/api/ai/chatgpt/callback`,
    expiresAt: Date.now() + 600_000,
    registration: registration
      ? { clientId: registration.clientId, subject: registration.subject }
      : undefined,
  };
  await writeLocal(`transaction:${tx.state}`, tx);
  const url = new URL(`${CHATGPT_ISSUER}/api/accounts/authorize`);
  const params: Record<string, string> = {
    client_id: registration?.clientId ?? "dynamic_agent_client",
    ext_agent_host_id: await hostId(),
    response_type: "code",
    redirect_uri: tx.redirectUri,
    scope: planConsent ? CHATGPT_SCOPES : "openid profile email",
    resource: CHATGPT_RESOURCE,
    state: tx.state,
    nonce: tx.nonce,
    code_challenge: createHash("sha256")
      .update(tx.verifier)
      .digest("base64url"),
    code_challenge_method: "S256",
  };
  if (!registration) params.agent_name_hint = "Plotamour";
  if (registration?.idToken) params.id_token_hint = registration.idToken;
  if (
    planConsent &&
    registration &&
    !registration.scopes.includes(CHATGPT_PLAN_SCOPE)
  )
    params.prompt = "consent";
  for (const [key, value] of Object.entries(params))
    url.searchParams.set(key, value);
  return url.toString();
}
export async function finishChatGpt(
  userId: string | undefined,
  params: URLSearchParams,
  browserState: string | undefined,
) {
  enabled();
  const state = params.get("state");
  if (!state || state !== browserState || !/^[\w-]{43}$/.test(state))
    throw new Error(
      "Invalid ChatGPT authorization state. Start again in AI settings.",
    );
  const pending = await readLocal<ChatGptTransaction>(`transaction:${state}`);
  if (!pending || (userId && pending.userId !== userId))
    throw new Error("ChatGPT connection attempt does not match this session.");
  const boundUserId = pending.userId;
  return withLocalLock(regKey(boundUserId), async () => {
    const tx = await readLocal<ChatGptTransaction>(`transaction:${state}`);
    if (!tx || tx.expiresAt < Date.now())
      throw new Error(
        "ChatGPT authorization expired or belongs to another session. Start again.",
      );
    await deleteLocal(`transaction:${state}`);
    if (params.has("error"))
      throw new Error(
        "ChatGPT authorization was declined. Your Plotamour account is unchanged.",
      );
    const clientId = params.get("client_id") ?? tx.registration?.clientId;
    if (
      !clientId ||
      !clientId.startsWith("oaiapp_") ||
      (tx.registration && clientId !== tx.registration.clientId)
    )
      throw new Error(
        "ChatGPT registration did not match. Reconnect in AI settings.",
      );
    const code = params.get("code");
    if (!code) throw new Error("ChatGPT did not return an authorization code.");
    const response = await checked(
      await fetchOpenAi(`${CHATGPT_ISSUER}/api/accounts/oauth/token`, {
        method: "POST",
        body: new URLSearchParams({
          grant_type: "authorization_code",
          client_id: clientId,
          code,
          code_verifier: tx.verifier,
          redirect_uri: tx.redirectUri,
          resource: CHATGPT_RESOURCE,
        }),
      }),
    );
    const tokens = tokenSchema.parse(await response.json());
    if (!tokens.id_token)
      throw new Error("ChatGPT identity token was missing.");
    const { payload } = await jwtVerify(tokens.id_token, jwks, {
      issuer: CHATGPT_ISSUER,
      audience: clientId,
      requiredClaims: ["sub", "exp", "iat", "nonce"],
    });
    if (
      (payload.azp !== undefined && payload.azp !== clientId) ||
      (Array.isArray(payload.aud) &&
        payload.aud.length > 1 &&
        payload.azp !== clientId) ||
      payload.nonce !== tx.nonce ||
      (tx.registration && payload.sub !== tx.registration.subject)
    )
      throw new Error("ChatGPT identity did not match the connection attempt.");
    const registration: ChatGptRegistration = {
      clientId,
      subject: payload.sub!,
      email: typeof payload.email === "string" ? payload.email : undefined,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      idToken: tokens.id_token,
      scopes: tokens.scope.split(" "),
      expiresAt: Date.now() + tokens.expires_in * 1000,
    };
    await writeLocal(regKey(boundUserId), registration);
  });
}
async function credentials(userId: string): Promise<ChatGptRegistration> {
  enabled();
  return withLocalLock(regKey(userId), async () => {
    let reg = await readLocal<ChatGptRegistration>(regKey(userId));
    if (!reg?.accessToken || !reg.scopes.includes(CHATGPT_PLAN_SCOPE))
      throw new Error(
        "Connect ChatGPT and enable plan usage in AI settings first.",
      );
    if (reg.expiresAt > Date.now() + 60_000) return reg;
    if (!reg.refreshToken)
      throw new Error(
        "ChatGPT authorization expired. Reconnect in AI settings.",
      );
    const response = await fetchOpenAi(
      `${CHATGPT_ISSUER}/api/accounts/oauth/token`,
      {
        method: "POST",
        body: new URLSearchParams({
          grant_type: "refresh_token",
          client_id: reg.clientId,
          refresh_token: reg.refreshToken,
          resource: CHATGPT_RESOURCE,
        }),
      },
    );
    if (!response.ok) {
      const failure = (await response.json().catch(() => ({}))) as {
        error?: string | { code?: string };
      };
      const code =
        typeof failure.error === "string" ? failure.error : failure.error?.code;
      if (
        [
          "invalid_grant",
          "invalid_refresh_token",
          "token_expired",
          "refresh_token_expired",
          "refresh_token_invalidated",
          "refresh_token_reused",
        ].includes(code ?? "")
      ) {
        await writeLocal(regKey(userId), {
          clientId: reg.clientId,
          subject: reg.subject,
          email: reg.email,
          scopes: [],
          expiresAt: 0,
        });
      }
      throw new Error(
        "ChatGPT could not renew authorization. Reconnect in AI settings.",
      );
    }
    const tokens = tokenSchema.parse(await response.json());
    if (!tokens.refresh_token)
      throw new Error(
        "ChatGPT did not return a replacement refresh token. Reconnect.",
      );
    reg = {
      ...reg,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      scopes: tokens.scope.split(" "),
      expiresAt: Date.now() + tokens.expires_in * 1000,
    };
    await writeLocal(regKey(userId), reg);
    if (!reg.scopes.includes(CHATGPT_PLAN_SCOPE))
      throw new Error(
        "ChatGPT plan permission is disabled. Enable it in AI settings.",
      );
    return reg;
  });
}
export async function chatGptModels(userId: string) {
  const reg = await credentials(userId);
  const response = await checked(
    await fetchOpenAi(`${CHATGPT_RESOURCE}/models`, {
      headers: { Authorization: `Bearer ${reg.accessToken}` },
    }),
  );
  return modelsSchema
    .parse(await response.json())
    .models.filter((m) => m.visibility === "list")
    .map(({ slug, display_name }) => ({ slug, display_name }));
}
export async function chatGptStatus(userId: string): Promise<ChatGptStatus> {
  if (!chatGptEnabled())
    return { enabled: false, connected: false, planUsage: false, models: [] };
  const reg = await readLocal<ChatGptRegistration>(regKey(userId));
  const status: ChatGptStatus = {
    enabled: true,
    connected: !!reg?.accessToken,
    planUsage: !!reg?.accessToken && reg.scopes.includes(CHATGPT_PLAN_SCOPE),
    account: reg
      ? `${reg.email ?? "ChatGPT account"} · ${reg.clientId.slice(-8)}`
      : undefined,
    models: [],
  };
  if (status.planUsage) {
    try {
      status.models = await chatGptModels(userId);
    } catch (e) {
      status.error = e instanceof Error ? e.message : "Reconnect ChatGPT.";
    }
  }
  return status;
}
export async function disconnectChatGpt(userId: string) {
  enabled();
  return withLocalLock(regKey(userId), async () => {
    const reg = await readLocal<ChatGptRegistration>(regKey(userId));
    if (!reg) return { revoked: true };
    let revoked = !reg.refreshToken;
    if (reg.refreshToken) {
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          // Endpoint is advertised in the official OIDC discovery document.
          const response = await fetchOpenAi(
            `${CHATGPT_ISSUER}/api/accounts/oauth/revoke`,
            {
              method: "POST",
              body: new URLSearchParams({
                token: reg.refreshToken,
                token_type_hint: "refresh_token",
                client_id: reg.clientId,
              }),
            },
          );
          revoked = response.status === 200;
          if (revoked || response.status < 500) break;
        } catch {
          /* Clear local secrets even when the remote service is unavailable. */
        }
        if (attempt === 0)
          await new Promise((resolve) => setTimeout(resolve, 300));
      }
    }
    await writeLocal(regKey(userId), {
      clientId: reg.clientId,
      subject: reg.subject,
      email: reg.email,
      scopes: [],
      expiresAt: 0,
    });
    return { revoked };
  });
}
export async function consumeChatGptStream(
  response: Response,
): Promise<string> {
  await checked(response);
  if (!response.body) throw new Error("ChatGPT response stream was missing.");
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let pending = "",
    result = "",
    completed = false;
  try {
    while (true) {
      const { value, done } = await reader.read();
      pending += decoder.decode(value, { stream: !done });
      if (pending.length > 2_000_000)
        throw new Error("ChatGPT response event exceeded the local limit.");
      pending = pending.replace(/\r\n/g, "\n");
      let end: number;
      while ((end = pending.indexOf("\n\n")) >= 0) {
        const block = pending.slice(0, end);
        pending = pending.slice(end + 2);
        const data = block
          .split("\n")
          .filter((l) => l.startsWith("data:"))
          .map((l) => l.slice(5).trimStart())
          .join("\n");
        if (!data || data === "[DONE]") continue;
        const event = JSON.parse(data) as {
          type?: string;
          delta?: string;
          code?: string;
          response?: { error?: { code?: string } };
        };
        if (event.type === "response.output_text.delta")
          result += event.delta ?? "";
        if (
          ["response.failed", "response.incomplete", "error"].includes(
            event.type ?? "",
          )
        )
          throw new Error(recovery(event.response?.error?.code ?? event.code));
        if (event.type === "response.completed") completed = true;
        if (result.length > 100_000)
          throw new Error("ChatGPT result exceeded the local response limit.");
      }
      if (done) break;
    }
  } finally {
    await reader.cancel().catch(() => {});
    reader.releaseLock();
  }
  if (!completed || !result.trim())
    throw new Error(
      "ChatGPT response did not complete. Retry; partial output was discarded.",
    );
  return result;
}
export async function runChatGpt(
  userId: string,
  model: string,
  prompt: string,
) {
  const models = await chatGptModels(userId);
  if (!models.some((m) => m.slug === model))
    throw new Error("Choose an available ChatGPT model in AI settings.");
  const reg = await credentials(userId);
  const response = await fetchOpenAi(`${CHATGPT_RESOURCE}/responses`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${reg.accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      input: [{ role: "user", content: prompt }],
      store: false,
      stream: true,
    }),
  });
  return consumeChatGptStream(response);
}

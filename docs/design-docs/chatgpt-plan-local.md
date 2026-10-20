# Local ChatGPT plan connection

Scene Ideas can use an eligible user's separately authorized ChatGPT plan. Google remains Plotamour's sign-in method and the existing Google AI Studio provider remains available. Google Docs and project RLS are unchanged. No provider fallback occurs.

## Run

Use Node 22, install with `npm ci`, and retain the existing Neon and Google environment settings. Add these local settings to the ignored `.env.local`:

```
CHATGPT_LOCAL_ENABLED=true
CHATGPT_LOCAL_ORIGIN=http://127.0.0.1:3000
```

Run `npm run dev -- --hostname 127.0.0.1`. Sign into Plotamour with Google and open `http://127.0.0.1:3000/settings/ai`. Google may return to `localhost`; navigate back to the explicit IP address after sign-in. The existing development convenience login can fail with an Origin error; use `/auth/login` for Google sign-in rather than changing existing credentials.

The optional checkbox requests plan usage separately from identity. OpenAI's granted scopes determine whether inference is permitted. Approve with your own account; no credentials from Codex or other applications are reused. In a scene, select ChatGPT and an account-discovered model, then choose Scene Ideas. What If, Character Voice, and Pacing Check continue to use Google only. Generated text is shown only after `response.completed` and nonempty output.

## Existing Google model availability

The existing default `gemma-3-27b-it` returned HTTP 404 during local regression validation. `GOOGLE_GENERATIVE_AI_MODEL` now permits an explicit override while preserving the previous default for deployments. The local account catalog listed `gemma-4-31b-it`, which was selected only in the ignored local environment. Hosted Google model migration remains a separate configuration task; no provider or billing fallback is implemented.

## OAuth and credential boundaries

- Dynamic registration uses `dynamic_agent_client`, the persisted installation host ID, PKCE S256, random state and nonce, and the exact loopback callback `/api/ai/chatgpt/callback`.
- OpenAI's ID token signature, issuer, issued-client audience, expiration, nonce, subject and authorized party are checked before replacing a connection. Tokens are never used as Plotamour sessions or linked by email.
- A short-lived, HTTP-only, SameSite=Lax attempt cookie binds the callback to its initiating browser. It is usable only on the callback path, never authenticates Plotamour, and is cleared on return. The callback renders a minimal return link rather than continuing the cross-site redirect chain; this lets the existing Strict Neon session resume on the next same-site navigation. It is unencrypted HTTP only because this feature runs solely on loopback. Neon's existing Strict cookies remain unchanged.
- Each connection is keyed by the authenticated Plotamour user in `~/.config/plotamour/chatgpt/`. Credential files use hashed names, atomic writes and mode 0600; the credential directory is 0700. Do not publish this directory, authorization URLs, callback query strings or credentials. Next's development callback request logging is suppressed.
- Renewable sessions are serialized using filesystem locks. A stale `.lock` directory after an abrupt server crash requires stopping all local Plotamour processes, removing only the stale lock directory, and restarting. Do not remove credential files as a lock-recovery shortcut.
- Rotating refresh tokens are replaced together with access tokens, scopes and expiry. Terminal unusable-token responses clear secrets; transient failures retain them. Disconnect attempts remote refresh-token revocation and clears local tokens even if revocation cannot be confirmed. The retained client/subject mapping supports reauthorization without registering another client.
- Model discovery uses the authorized account's `/v1/models` catalog and displays only `visibility=list` entries. Responses calls use `/v1/responses`, an explicit input array, `store:false`, `stream:true`, and none of the unsupported sampling/output-limit parameters.

## Deployment boundary

The feature requires development mode, explicit local enablement, no Vercel runtime and the configured loopback Host. Mutations additionally require the exact Origin. Setting the flag on a hosted preview or production server does not enable access. K4 in Build223 remains open: hosted deployment requires confirmed OpenAI approval and a separately reviewed hosted design.

## Evidence policy

Unit tests use synthetic tokens, local signing keys and mocked OpenAI HTTP responses. They verify security and completion handling but do not prove live inference. Record browser actions, actual OpenAI admission and completed inference separately in the Build223 handoff. Never store manuscript content or tokens in evidence.

Official references checked October 20, 2026:

- https://developers.openai.com/siwc/token-sharing-open-source/sign-in
- https://developers.openai.com/siwc/token-sharing-open-source/profiles-and-sessions
- https://developers.openai.com/siwc/token-sharing-open-source/models-and-inference
- https://developers.openai.com/siwc/token-sharing-open-source/errors-and-recovery
- https://developers.openai.com/siwc/token-sharing-open-source/preview-limitations

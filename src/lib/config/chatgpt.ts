export const CHATGPT_ISSUER = "https://auth.openai.com";
export const CHATGPT_RESOURCE = "https://api.openai.com/v1";
export const CHATGPT_PLAN_SCOPE = "chatgpt.tokens.use.direct";
export const CHATGPT_SCOPES =
  "openid profile email offline_access resource.invoke chatgpt.tokens.use.direct";

// Local proof only. Hosted admission must be established in a later milestone.
export function chatGptEnabled() {
  return (
    process.env.CHATGPT_LOCAL_ENABLED === "true" &&
    process.env.NODE_ENV === "development" &&
    !process.env.VERCEL
  );
}
export function chatGptOrigin() {
  const url = new URL(
    process.env.CHATGPT_LOCAL_ORIGIN ?? "http://127.0.0.1:3000",
  );
  if (
    url.protocol !== "http:" ||
    url.hostname !== "127.0.0.1" ||
    url.pathname !== "/" ||
    url.search ||
    url.hash ||
    url.username ||
    url.password
  ) {
    throw new Error(
      "ChatGPT local origin must use http://127.0.0.1 and a port.",
    );
  }
  return url.origin;
}

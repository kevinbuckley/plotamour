// Credential-free regression probe for the real OAuth proxy. Cookie values and
// one-time sign-in URLs are never logged. Usage: node scripts/check-auth-cookies.mjs [origin]
const origin = new URL(process.argv[2] ?? "https://plotamour.com").origin;
const response = await fetch(`${origin}/api/auth/sign-in/social`, {
  method: "POST",
  headers: { Origin: origin, "Content-Type": "application/json" },
  body: JSON.stringify({ provider: "google", callbackURL: "/auth/callback?next=%2Fprojects" }),
});
if (!response.ok) throw new Error(`Sign-in proxy returned HTTP ${response.status}`);
const challenges = response.headers.getSetCookie().filter((cookie) =>
  /^__Secure-neon-auth\.session_chall(?:enge|ange)=/.test(cookie));
if (!challenges.length) throw new Error("Sign-in proxy did not set an OAuth challenge cookie");
let valid = true;
for (const cookie of challenges) {
  const [pair, ...attributes] = cookie.split(";").map((value) => value.trim());
  const name = pair.slice(0, pair.indexOf("="));
  const sameSite = attributes.find((attribute) => /^samesite=/i.test(attribute));
  const passes = attributes.some((attribute) => /^secure$/i.test(attribute)) &&
    attributes.some((attribute) => /^httponly$/i.test(attribute)) &&
    attributes.some((attribute) => /^samesite=lax$/i.test(attribute));
  console.log(`${passes ? "PASS" : "FAIL"} ${name}=<REDACTED>; ${sameSite ?? "SameSite missing"}`);
  valid &&= passes;
}
if (!valid) {
  console.error("OAuth challenge cookies must be Secure, HttpOnly, and SameSite=Lax to survive the top-level return from Google.");
  process.exitCode = 1;
}

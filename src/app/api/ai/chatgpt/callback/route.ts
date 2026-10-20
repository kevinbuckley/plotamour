import { NextResponse, type NextRequest } from "next/server";
import { currentUser } from "@/lib/services/current-user";
import { checkLocalRequest, finishChatGpt } from "@/lib/services/chatgpt";
export const runtime = "nodejs";
export async function GET(request: NextRequest) {
  // Never log the callback URL, authorization code, or underlying OAuth errors.
  try {
    checkLocalRequest(request);
    const user = await currentUser();
    await finishChatGpt(
      user?.id,
      new URL(request.url).searchParams,
      request.cookies.get("plotamour-chatgpt-attempt")?.value,
    );
    // End the cross-site navigation chain before returning to routes protected
    // by Neon's Strict session cookie. No token or authorization code enters HTML.
    const response = callbackPage("complete");
    response.cookies.set("plotamour-chatgpt-attempt", "", {
      path: "/api/ai/chatgpt/callback",
      maxAge: 0,
    });
    return response;
  } catch {
    const response = callbackPage("failed");
    response.cookies.set("plotamour-chatgpt-attempt", "", {
      path: "/api/ai/chatgpt/callback",
      maxAge: 0,
    });
    return response;
  }
}

function callbackPage(outcome: "complete" | "failed") {
  const message =
    outcome === "complete"
      ? "ChatGPT connection saved"
      : "ChatGPT connection was not completed";
  return new NextResponse(
    `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${message}</title><meta name="viewport" content="width=device-width, initial-scale=1"></head><body><main><h1>${message}</h1><p>Return to Plotamour to review your connection and plan permission.</p><a href="/settings/ai?connection=${outcome}">Continue to AI settings</a></main></body></html>`,
    {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store",
        "Referrer-Policy": "no-referrer",
        "Content-Security-Policy":
          "default-src 'none'; frame-ancestors 'none'; base-uri 'none'",
      },
    },
  );
}

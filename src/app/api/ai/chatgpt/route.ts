import { NextResponse } from "next/server";
import { z } from "zod";
import { currentUser } from "@/lib/services/current-user";
import {
  chatGptStatus,
  checkLocalRequest,
  startChatGpt,
  disconnectChatGpt,
} from "@/lib/services/chatgpt";
export const runtime = "nodejs";
export async function GET(request: Request) {
  const user = await currentUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    checkLocalRequest(request);
    return NextResponse.json(await chatGptStatus(user.id), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return NextResponse.json(
      { error: "ChatGPT is not enabled at this local address." },
      { status: 403 },
    );
  }
}
export async function POST(request: Request) {
  const user = await currentUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    checkLocalRequest(request, true);
    const { planConsent } = z
      .object({ planConsent: z.boolean() })
      .parse(await request.json());
    const url = await startChatGpt(user.id, planConsent);
    const response = NextResponse.json(
      { url },
      {
        headers: {
          "Cache-Control": "no-store",
          "Referrer-Policy": "no-referrer",
        },
      },
    );
    // Bridge a cross-site OAuth return without changing Neon's Strict cookies.
    // This random, one-use attempt cookie never authenticates Plotamour.
    response.cookies.set(
      "plotamour-chatgpt-attempt",
      new URL(url).searchParams.get("state")!,
      {
        httpOnly: true,
        sameSite: "lax",
        path: "/api/ai/chatgpt/callback",
        maxAge: 600,
      },
    );
    return response;
  } catch (error) {
    // Error names/codes only: never record OAuth parameters or credentials.
    console.warn(
      "[ChatGPT start]",
      error instanceof Error ? error.name : "unknown",
      (error as NodeJS.ErrnoException).code ?? "",
    );
    const message =
      error instanceof Error &&
      (error.message.startsWith("Open the local") ||
        error.message.startsWith("ChatGPT connection is busy"))
        ? error.message
        : "Unable to start ChatGPT connection. Check the local address and try again.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
export async function DELETE(request: Request) {
  const user = await currentUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    checkLocalRequest(request, true);
    return NextResponse.json(await disconnectChatGpt(user.id));
  } catch {
    return NextResponse.json(
      { error: "Unable to disconnect. Retry in AI settings." },
      { status: 400 },
    );
  }
}

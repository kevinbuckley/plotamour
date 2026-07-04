import { auth } from "@/lib/auth/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  await auth.signOut();
  const { origin } = new URL(request.url);
  return NextResponse.redirect(origin, { status: 303 });
}

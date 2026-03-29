import { createClient } from "@/lib/db/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { refreshToken } = await request.json();
    if (!refreshToken || typeof refreshToken !== "string") {
      return NextResponse.json({ error: "Missing refreshToken" }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await supabase
      .from("profiles")
      .update({ google_refresh_token: refreshToken })
      .eq("id", user.id);

    return NextResponse.json({ stored: true });
  } catch {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

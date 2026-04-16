import { NextResponse } from "next/server";
import { createClient } from "@/lib/db/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { body } = await request.json() as { body: string };
    if (!body?.trim()) {
      return NextResponse.json({ error: "body is required" }, { status: 400 });
    }

    const { error } = await supabase
      .from("feature_requests")
      .insert({ user_id: user.id, body: body.trim() });

    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("feedback route error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

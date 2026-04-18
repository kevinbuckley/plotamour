import { NextResponse } from "next/server";
import {
  getWritingStats,
  updateGoal,
  recordDailySnapshot,
  getProjectWordCount,
} from "@/lib/services/writing-stats";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case "getStats": {
        const { projectId } = body;
        if (!projectId) return NextResponse.json({ error: "projectId required" }, { status: 400 });
        const stats = await getWritingStats(projectId);
        return NextResponse.json(stats);
      }

      case "updateGoal": {
        const { projectId, dailyGoal, totalGoal } = body;
        if (!projectId) return NextResponse.json({ error: "projectId required" }, { status: 400 });
        const goal = await updateGoal(projectId, {
          daily_goal: dailyGoal,
          total_goal: totalGoal ?? null,
        });
        return NextResponse.json(goal);
      }

      case "recordSnapshot": {
        const { projectId } = body;
        if (!projectId) return NextResponse.json({ error: "projectId required" }, { status: 400 });
        const total = await getProjectWordCount(projectId);
        await recordDailySnapshot(projectId, total);
        return NextResponse.json({ total });
      }

      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }
  } catch (error) {
    console.error("Writing stats API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

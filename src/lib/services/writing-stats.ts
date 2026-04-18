// Layer 3: Services — writing statistics & goals

import { createClient } from "@/lib/db/server";
import type { WritingGoal, WritingStat } from "@/lib/types/database";

export interface WritingStatsPayload {
  goal: WritingGoal | null;
  totalWordCount: number;
  todayWordCount: number;
  streakDays: number;
  last7Days: { date: string; wordCount: number; delta: number }[];
  recentStats: WritingStat[];
}

/**
 * Get or create the writing goal for a project/user pair.
 */
export async function getOrCreateGoal(projectId: string): Promise<WritingGoal> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Try to get existing
  const { data: existing } = await supabase
    .from("writing_goals")
    .select("*")
    .eq("project_id", projectId)
    .eq("user_id", user.id)
    .single();

  if (existing) return existing as WritingGoal;

  // Create default
  const { data: created, error } = await supabase
    .from("writing_goals")
    .insert({ project_id: projectId, user_id: user.id })
    .select("*")
    .single();

  if (error || !created) throw new Error("Failed to create writing goal");
  return created as WritingGoal;
}

/**
 * Update the writing goal for a project.
 */
export async function updateGoal(
  projectId: string,
  data: { daily_goal?: number; total_goal?: number | null }
): Promise<WritingGoal> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: updated, error } = await supabase
    .from("writing_goals")
    .upsert(
      { project_id: projectId, user_id: user.id, ...data },
      { onConflict: "project_id,user_id" }
    )
    .select("*")
    .single();

  if (error || !updated) throw new Error("Failed to update writing goal");
  return updated as WritingGoal;
}

/**
 * Record today's total word count snapshot for a project.
 * Called after word-count syncs so the daily delta is accurate.
 */
export async function recordDailySnapshot(
  projectId: string,
  totalWordCount: number
): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

  await supabase.from("writing_stats").upsert(
    {
      project_id: projectId,
      user_id: user.id,
      stat_date: today,
      total_word_count: totalWordCount,
    },
    { onConflict: "project_id,user_id,stat_date" }
  );
}

/**
 * Compute the current total word count for a project
 * by summing scene_google_docs.word_count across all books.
 */
export async function getProjectWordCount(projectId: string): Promise<number> {
  const supabase = await createClient();

  // Get all book ids for this project
  const { data: books } = await supabase
    .from("books")
    .select("id")
    .eq("project_id", projectId)
    .is("deleted_at", null);

  if (!books || books.length === 0) return 0;

  const bookIds = books.map((b) => b.id);

  // Get all scene ids across those books
  const { data: scenes } = await supabase
    .from("scenes")
    .select("id")
    .in("book_id", bookIds)
    .is("deleted_at", null);

  if (!scenes || scenes.length === 0) return 0;

  const sceneIds = scenes.map((s) => s.id);

  // Sum word counts from google docs
  const { data: docs } = await supabase
    .from("scene_google_docs")
    .select("word_count")
    .in("scene_id", sceneIds);

  return (docs ?? []).reduce((sum, d) => sum + (d.word_count ?? 0), 0);
}

/**
 * Get full writing stats payload for a project.
 */
export async function getWritingStats(projectId: string): Promise<WritingStatsPayload> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const [goal, totalWordCount] = await Promise.all([
    getOrCreateGoal(projectId),
    getProjectWordCount(projectId),
  ]);

  // Record today's snapshot
  await recordDailySnapshot(projectId, totalWordCount);

  // Fetch last 30 days of stats
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const since = thirtyDaysAgo.toISOString().slice(0, 10);

  const { data: statsRaw } = await supabase
    .from("writing_stats")
    .select("*")
    .eq("project_id", projectId)
    .eq("user_id", user.id)
    .gte("stat_date", since)
    .order("stat_date", { ascending: true });

  const stats = (statsRaw ?? []) as WritingStat[];

  // Build last-7-days array
  const today = new Date().toISOString().slice(0, 10);
  const last7: { date: string; wordCount: number; delta: number }[] = [];

  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    const stat = stats.find((s) => s.stat_date === dateStr);
    const count = stat?.total_word_count ?? 0;

    // Delta: today's count minus previous day's count
    const prevStat = stats.find((s) => {
      const pd = new Date(d);
      pd.setDate(pd.getDate() - 1);
      return s.stat_date === pd.toISOString().slice(0, 10);
    });
    const delta = Math.max(0, count - (prevStat?.total_word_count ?? 0));
    last7.push({ date: dateStr, wordCount: count, delta });
  }

  // Today's words
  const todayStat = last7.find((d) => d.date === today);
  const todayWordCount = todayStat?.delta ?? 0;

  // Streak: count consecutive days going backwards from today where delta > 0
  let streakDays = 0;
  const sortedStats = [...stats].sort((a, b) =>
    b.stat_date.localeCompare(a.stat_date)
  );

  for (let i = 0; i < sortedStats.length; i++) {
    const current = sortedStats[i];
    const prev = sortedStats[i + 1];
    const delta = Math.max(
      0,
      current.total_word_count - (prev?.total_word_count ?? 0)
    );
    if (delta > 0) {
      streakDays++;
    } else {
      // Only break if we've passed today
      if (current.stat_date < today) break;
    }
  }

  return {
    goal,
    totalWordCount,
    todayWordCount,
    streakDays,
    last7Days: last7,
    recentStats: stats.slice(-14),
  };
}

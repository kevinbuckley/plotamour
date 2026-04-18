"use client";

import { useState } from "react";
import { Target, Flame, BookOpen, TrendingUp, Edit2, Check, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { WritingStatsPayload } from "@/lib/services/writing-stats";

interface WritingStatsViewProps {
  projectId: string;
  initialStats: WritingStatsPayload;
}

function StatCard({
  icon,
  label,
  value,
  sub,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub?: string;
  accent?: string;
}) {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-border bg-card px-5 py-4 shadow-sm">
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
        style={{ background: accent ?? "oklch(0.92 0.06 274)" }}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
          {label}
        </p>
        <p className="text-2xl font-bold tabular-nums leading-tight">
          {typeof value === "number" ? value.toLocaleString() : value}
        </p>
        {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
      </div>
    </div>
  );
}

export function WritingStatsView({
  projectId,
  initialStats,
}: WritingStatsViewProps) {
  const [stats, setStats] = useState(initialStats);
  const [editingGoal, setEditingGoal] = useState(false);
  const [dailyGoalInput, setDailyGoalInput] = useState(
    String(initialStats.goal?.daily_goal ?? 500)
  );
  const [totalGoalInput, setTotalGoalInput] = useState(
    String(initialStats.goal?.total_goal ?? "")
  );
  const [saving, setSaving] = useState(false);

  const goal = stats.goal;
  const dailyGoal = goal?.daily_goal ?? 500;
  const totalGoal = goal?.total_goal ?? null;

  const todayProgress = dailyGoal > 0
    ? Math.min(100, Math.round((stats.todayWordCount / dailyGoal) * 100))
    : 0;

  const totalProgress =
    totalGoal && totalGoal > 0
      ? Math.min(100, Math.round((stats.totalWordCount / totalGoal) * 100))
      : null;

  const maxBar = Math.max(...stats.last7Days.map((d) => d.delta), 1);

  const handleSaveGoal = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/writing-stats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "updateGoal",
          projectId,
          dailyGoal: parseInt(dailyGoalInput) || 500,
          totalGoal: parseInt(totalGoalInput) || null,
        }),
      });
      if (res.ok) {
        const updatedGoal = await res.json();
        setStats((prev) => ({ ...prev, goal: updatedGoal }));
        setEditingGoal(false);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-2">
        <StatCard
          icon={<BookOpen className="h-5 w-5 text-primary" />}
          label="Total Words"
          value={stats.totalWordCount}
          sub="across all scenes"
          accent="oklch(0.92 0.06 274)"
        />
        <StatCard
          icon={<Flame className="h-5 w-5 text-orange-500" />}
          label="Writing Streak"
          value={`${stats.streakDays}d`}
          sub={stats.streakDays === 1 ? "keep it up!" : stats.streakDays > 0 ? "on fire \uD83D\uDD25" : "start writing today"}
          accent="oklch(0.95 0.05 50)"
        />
        <StatCard
          icon={<TrendingUp className="h-5 w-5 text-emerald-600" />}
          label="Today's Words"
          value={stats.todayWordCount}
          sub={`goal: ${dailyGoal.toLocaleString()}`}
          accent="oklch(0.93 0.06 155)"
        />
        <StatCard
          icon={<Target className="h-5 w-5 text-violet-600" />}
          label="Daily Goal"
          value={`${todayProgress}%`}
          sub={`${stats.todayWordCount.toLocaleString()} / ${dailyGoal.toLocaleString()}`}
          accent="oklch(0.93 0.06 310)"
        />
      </div>

      {/* Daily goal progress bar */}
      <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-semibold">Today&apos;s Progress</p>
          <span className="text-xs text-muted-foreground">
            {stats.todayWordCount.toLocaleString()} / {dailyGoal.toLocaleString()} words
          </span>
        </div>
        <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500"
            style={{ width: `${todayProgress}%` }}
          />
        </div>
        {todayProgress >= 100 && (
          <p className="mt-2 text-xs font-semibold text-primary">
            🎉 Daily goal reached!
          </p>
        )}
      </div>

      {/* Total goal progress bar */}
      {totalGoal !== null && totalProgress !== null && (
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-semibold">Manuscript Goal</p>
            <span className="text-xs text-muted-foreground">
              {stats.totalWordCount.toLocaleString()} / {totalGoal.toLocaleString()} words
            </span>
          </div>
          <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-violet-500 transition-all duration-500"
              style={{ width: `${totalProgress}%` }}
            />
          </div>
          <p className="mt-1.5 text-xs text-muted-foreground">
            {Math.max(0, totalGoal - stats.totalWordCount).toLocaleString()} words remaining
          </p>
        </div>
      )}

      {/* Last 7 days chart */}
      <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <p className="mb-4 text-sm font-semibold">Last 7 Days</p>
        <div className="flex items-end gap-1.5 h-24">
          {stats.last7Days.map((day) => {
            const height = maxBar > 0 ? Math.max(4, (day.delta / maxBar) * 100) : 4;
            const isToday = day.date === new Date().toISOString().slice(0, 10);
            const label = new Date(day.date + "T12:00:00").toLocaleDateString("en", {
              weekday: "short",
            });
            return (
              <div
                key={day.date}
                className="group flex flex-1 flex-col items-center gap-1"
              >
                <div className="relative w-full flex flex-col justify-end" style={{ height: "80px" }}>
                  <div
                    className={`w-full rounded-sm transition-all ${
                      isToday ? "bg-primary" : "bg-primary/30 group-hover:bg-primary/50"
                    }`}
                    style={{ height: `${height}%` }}
                    title={`${day.delta.toLocaleString()} words`}
                  />
                </div>
                <span className={`text-[9px] font-medium ${isToday ? "text-primary" : "text-muted-foreground/60"}`}>
                  {label}
                </span>
              </div>
            );
          })}
        </div>
        <p className="mt-2 text-[10px] text-muted-foreground/50 text-center">Words written per day</p>
      </div>

      {/* Goal settings */}
      <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-semibold">Goals</p>
          {!editingGoal ? (
            <button
              onClick={() => setEditingGoal(true)}
              className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <Edit2 className="h-3 w-3" />
              Edit
            </button>
          ) : (
            <div className="flex gap-1.5">
              <Button size="sm" onClick={handleSaveGoal} disabled={saving}>
                <Check className="h-3.5 w-3.5" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setEditingGoal(false);
                  setDailyGoalInput(String(dailyGoal));
                  setTotalGoalInput(String(totalGoal ?? ""));
                }}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}
        </div>

        {editingGoal ? (
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-widest text-muted-foreground/70">
                Daily Word Goal
              </label>
              <Input
                type="number"
                value={dailyGoalInput}
                onChange={(e) => setDailyGoalInput(e.target.value)}
                placeholder="500"
                min={0}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-widest text-muted-foreground/70">
                Manuscript Goal (optional)
              </label>
              <Input
                type="number"
                value={totalGoalInput}
                onChange={(e) => setTotalGoalInput(e.target.value)}
                placeholder="80000"
                min={0}
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Leave blank to skip the manuscript progress bar.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2">
              <span className="text-sm text-muted-foreground">Daily goal</span>
              <span className="text-sm font-semibold">{dailyGoal.toLocaleString()} words</span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2">
              <span className="text-sm text-muted-foreground">Manuscript goal</span>
              <span className="text-sm font-semibold">
                {totalGoal ? totalGoal.toLocaleString() + " words" : "—"}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

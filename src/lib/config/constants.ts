// Layer 1: Config — application constants

export const APP_NAME = "plotamour";

export const PLOTLINE_COLORS = [
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#14b8a6",
  "#06b6d4",
  "#3b82f6",
  "#6366f1",
  "#8b5cf6",
  "#a855f7",
  "#ec4899",
  "#f43f5e",
] as const;

export const DEFAULT_PLOTLINE_COLOR = "#6366f1";

export const DEFAULT_CHAPTERS = [
  "Chapter 1",
  "Chapter 2",
  "Chapter 3",
] as const;

export const DEFAULT_PLOTLINE = "Main Plot";

export const WRITING_STATUS_LABELS = {
  not_started: "Not started",
  in_progress: "In progress",
  draft_complete: "Draft complete",
} as const;

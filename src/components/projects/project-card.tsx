"use client";

import { useRouter } from "next/navigation";

interface ProjectCardProps {
  id: string;
  title: string;
  description: string;
  projectType: string;
  updatedAt: string;
  hue: number;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function ProjectCard({
  id,
  title,
  description,
  projectType,
  updatedAt,
  hue,
}: ProjectCardProps) {
  const router = useRouter();

  return (
    <div
      onClick={() => router.push(`/project/${id}/timeline`)}
      className="group flex cursor-pointer flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_8px_24px_oklch(0.488_0.183_274.376/0.10)] hover:border-border/80"
    >
      {/* Color accent strip */}
      <div
        className="h-[3px] w-full shrink-0"
        style={{
          background: `linear-gradient(90deg, hsl(${hue}, 70%, 55%), hsl(${hue + 30}, 75%, 62%))`,
        }}
      />

      {/* Card body */}
      <div className="flex flex-1 flex-col p-5">
        {/* Title */}
        <h2 className="text-[15px] font-semibold leading-snug text-foreground transition-colors group-hover:text-primary">
          {title}
        </h2>

        {/* Description */}
        <p className="mt-1.5 text-sm leading-relaxed">
          {description ? (
            <span className="line-clamp-2 text-muted-foreground">{description}</span>
          ) : (
            <span className="italic text-muted-foreground/50">No description</span>
          )}
        </p>

        {/* Meta row */}
        <div className="mt-auto flex items-center justify-between pt-4">
          <span
            className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold capitalize tracking-wide"
            style={{
              backgroundColor: `hsl(${hue}, 70%, 94%)`,
              color: `hsl(${hue}, 55%, 38%)`,
            }}
          >
            {projectType}
          </span>
          <span className="text-xs text-muted-foreground/70">
            {formatDate(updatedAt)}
          </span>
        </div>
      </div>
    </div>
  );
}

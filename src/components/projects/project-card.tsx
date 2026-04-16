"use client";

import { useRouter } from "next/navigation";
import { useState, useRef } from "react";
import { ImageIcon, X } from "lucide-react";

interface ProjectCardProps {
  id: string;
  title: string;
  description: string;
  projectType: string;
  updatedAt: string;
  hue: number;
  coverImageUrl: string | null;
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
  coverImageUrl,
}: ProjectCardProps) {
  const router = useRouter();
  const [showCoverEdit, setShowCoverEdit] = useState(false);
  const [coverUrl, setCoverUrl] = useState(coverImageUrl ?? "");
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleNavigate = () => {
    if (!showCoverEdit) router.push(`/project/${id}/timeline`);
  };

  const handleSaveCover = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await fetch("/api/projects", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, cover_image_url: coverUrl.trim() || null }),
      });
      setShowCoverEdit(false);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const activeCover = coverUrl.trim() || null;

  return (
    <div
      className="group relative flex cursor-pointer flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_8px_24px_oklch(0.488_0.183_274.376/0.10)] hover:border-border/80"
      onClick={handleNavigate}
    >
      {/* Cover image or accent strip */}
      {activeCover ? (
        <div className="relative h-28 w-full overflow-hidden bg-muted">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={activeCover}
            alt=""
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/30" />
        </div>
      ) : (
        <div
          className="h-[3px] w-full shrink-0"
          style={{
            background: `linear-gradient(90deg, hsl(${hue}, 70%, 55%), hsl(${hue + 30}, 75%, 62%))`,
          }}
        />
      )}

      {/* Edit cover button — visible on hover */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          setShowCoverEdit((v) => !v);
          setTimeout(() => inputRef.current?.focus(), 50);
        }}
        className="absolute right-2 top-2 flex items-center gap-1 rounded-md bg-black/40 px-2 py-1 text-[10px] font-medium text-white opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100"
        title="Set cover image"
      >
        <ImageIcon className="h-3 w-3" />
        Cover
      </button>

      {/* Inline cover URL editor */}
      {showCoverEdit && (
        <div
          className="absolute inset-x-0 top-0 z-10 border-b border-border bg-background p-3 shadow-md"
          onClick={(e) => e.stopPropagation()}
        >
          <form onSubmit={handleSaveCover} className="flex items-center gap-2">
            <input
              ref={inputRef}
              type="url"
              value={coverUrl}
              onChange={(e) => setCoverUrl(e.target.value)}
              placeholder="Paste image URL…"
              className="flex-1 rounded-md border border-input bg-background px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <button
              type="submit"
              disabled={saving}
              className="rounded-md bg-primary px-2.5 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {saving ? "…" : "Save"}
            </button>
            <button
              type="button"
              onClick={() => setShowCoverEdit(false)}
              className="rounded-md p-1.5 text-muted-foreground hover:bg-muted"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </form>
        </div>
      )}

      {/* Card body */}
      <div className="flex flex-1 flex-col p-5">
        <h2 className="text-[15px] font-semibold leading-snug text-foreground transition-colors group-hover:text-primary">
          {title}
        </h2>
        <p className="mt-1.5 text-sm leading-relaxed">
          {description ? (
            <span className="line-clamp-2 text-muted-foreground">{description}</span>
          ) : (
            <span className="italic text-muted-foreground/50">No description</span>
          )}
        </p>
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

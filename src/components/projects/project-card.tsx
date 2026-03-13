"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Pencil } from "lucide-react";

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
  title: initialTitle,
  description: initialDescription,
  projectType,
  updatedAt,
  hue,
}: ProjectCardProps) {
  const router = useRouter();
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription);
  const [editingField, setEditingField] = useState<"title" | "description" | null>(null);
  const [editValue, setEditValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (editingField === "title") {
      inputRef.current?.focus();
      inputRef.current?.select();
    } else if (editingField === "description") {
      textareaRef.current?.focus();
      textareaRef.current?.select();
    }
  }, [editingField]);

  const handleSave = async () => {
    if (!editingField) return;
    const trimmed = editValue.trim();
    const field = editingField;

    if (field === "title" && (!trimmed || trimmed === title)) {
      setEditingField(null);
      return;
    }
    if (field === "description" && trimmed === description) {
      setEditingField(null);
      return;
    }

    // Optimistic update
    if (field === "title" && trimmed) setTitle(trimmed);
    if (field === "description") setDescription(trimmed);
    setEditingField(null);

    try {
      const res = await fetch("/api/projects", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, [field]: trimmed }),
      });
      if (!res.ok) throw new Error("Failed to update");
    } catch (e) {
      console.error(`Failed to update project ${field}:`, e);
      // Revert
      if (field === "title") setTitle(initialTitle);
      if (field === "description") setDescription(initialDescription);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && editingField === "title") {
      e.preventDefault();
      handleSave();
    }
    if (e.key === "Escape") {
      setEditingField(null);
    }
  };

  return (
    <div
      onClick={() => {
        if (!editingField) router.push(`/project/${id}/timeline`);
      }}
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
        {editingField === "title" ? (
          <input
            ref={inputRef}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
            onClick={(e) => e.stopPropagation()}
            className="w-full border-b border-primary bg-transparent text-[15px] font-semibold leading-snug outline-none"
          />
        ) : (
          <h2
            className="flex items-center gap-1 text-[15px] font-semibold leading-snug text-foreground transition-colors group-hover:text-primary"
            onClick={(e) => {
              e.stopPropagation();
              setEditingField("title");
              setEditValue(title);
            }}
            title="Click to rename"
          >
            <span className="cursor-text">{title}</span>
            <Pencil className="h-2.5 w-2.5 shrink-0 text-muted-foreground/0 transition-colors group-hover:text-muted-foreground/40" />
          </h2>
        )}

        {/* Description */}
        {editingField === "description" ? (
          <textarea
            ref={textareaRef}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleSave}
            onKeyDown={(e) => {
              if (e.key === "Escape") setEditingField(null);
            }}
            onClick={(e) => e.stopPropagation()}
            rows={2}
            className="mt-1.5 w-full resize-none border-b border-primary bg-transparent text-sm leading-relaxed text-muted-foreground outline-none"
            placeholder="Add a description..."
          />
        ) : (
          <p
            className="mt-1.5 flex cursor-text items-start gap-1 text-sm leading-relaxed"
            onClick={(e) => {
              e.stopPropagation();
              setEditingField("description");
              setEditValue(description);
            }}
            title="Click to edit description"
          >
            {description ? (
              <span className="line-clamp-2 text-muted-foreground">{description}</span>
            ) : (
              <span className="italic text-muted-foreground/50">No description</span>
            )}
            <Pencil className="mt-0.5 h-2.5 w-2.5 shrink-0 text-muted-foreground/0 transition-colors group-hover:text-muted-foreground/40" />
          </p>
        )}

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

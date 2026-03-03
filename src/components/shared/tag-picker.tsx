"use client";

import { useState, useRef, useEffect } from "react";
import { Plus, X } from "lucide-react";
import type { Tag } from "@/lib/types/database";
import { PLOTLINE_COLORS } from "@/lib/config/constants";

interface TagPickerProps {
  allTags: Tag[];
  selectedTagIds: string[];
  projectId: string;
  onAdd: (tagId: string) => void;
  onRemove: (tagId: string) => void;
  onCreate: (tag: Tag) => void;
}

export function TagPicker({
  allTags,
  selectedTagIds,
  projectId,
  onAdd,
  onRemove,
  onCreate,
}: TagPickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const selectedTags = allTags.filter((t) => selectedTagIds.includes(t.id));
  const availableTags = allTags
    .filter((t) => !selectedTagIds.includes(t.id))
    .filter((t) => t.name.toLowerCase().includes(search.toLowerCase()));

  const handleCreate = async () => {
    if (!search.trim()) return;
    const colorIndex = allTags.length % PLOTLINE_COLORS.length;
    try {
      const res = await fetch("/api/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create",
          projectId,
          name: search.trim(),
          color: PLOTLINE_COLORS[colorIndex],
        }),
      });
      if (res.ok) {
        const tag = await res.json();
        onCreate(tag);
        onAdd(tag.id);
        setSearch("");
      }
    } catch {
      // ignore
    }
  };

  return (
    <div ref={ref} className="relative">
      <div className="flex flex-wrap gap-1.5">
        {selectedTags.map((tag) => (
          <span
            key={tag.id}
            className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium"
            style={{
              backgroundColor: `${tag.color}20`,
              color: tag.color,
            }}
          >
            {tag.name}
            <button
              onClick={() => onRemove(tag.id)}
              className="rounded-full p-0.5 transition-colors hover:bg-black/10"
            >
              <X className="h-2.5 w-2.5" />
            </button>
          </span>
        ))}
        <button
          onClick={() => setOpen(!open)}
          className="inline-flex items-center gap-1 rounded-full border border-dashed border-border px-2 py-0.5 text-xs text-muted-foreground transition-colors hover:border-primary hover:text-primary"
        >
          <Plus className="h-3 w-3" />
          Tag
        </button>
      </div>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 w-56 rounded-md border border-border bg-background p-1 shadow-lg">
          <input
            className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm placeholder:text-muted-foreground focus:outline-none"
            placeholder="Search or create tag..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && availableTags.length === 0 && search.trim()) {
                handleCreate();
              }
            }}
            autoFocus
          />
          <div className="mt-1 max-h-40 overflow-y-auto">
            {availableTags.map((tag) => (
              <button
                key={tag.id}
                onClick={() => {
                  onAdd(tag.id);
                  setSearch("");
                }}
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-accent"
              >
                <div
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: tag.color }}
                />
                {tag.name}
                {tag.category && (
                  <span className="ml-auto text-xs text-muted-foreground">{tag.category}</span>
                )}
              </button>
            ))}
            {search.trim() && availableTags.length === 0 && (
              <button
                onClick={handleCreate}
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-primary transition-colors hover:bg-accent"
              >
                <Plus className="h-3.5 w-3.5" />
                Create &quot;{search.trim()}&quot;
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

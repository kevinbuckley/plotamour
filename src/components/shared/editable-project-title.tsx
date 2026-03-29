"use client";

import { useState, useRef, useEffect } from "react";
import { Pencil } from "lucide-react";
import { useRouter } from "next/navigation";

interface EditableProjectTitleProps {
  projectId: string;
  initialTitle: string;
}

export function EditableProjectTitle({
  projectId,
  initialTitle,
}: EditableProjectTitleProps) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(initialTitle);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTitle(initialTitle);
  }, [initialTitle]);

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  const handleSave = async () => {
    if (saving) return;
    const trimmed = title.trim();
    if (!trimmed || trimmed === initialTitle) {
      setTitle(initialTitle);
      setEditing(false);
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/projects", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: projectId, title: trimmed }),
      });
      if (!res.ok) throw new Error("Failed to update title");
      setEditing(false);
      router.refresh();
    } catch (e) {
      console.error("Failed to update project title:", e);
      setTitle(initialTitle);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  if (editing) {
    return (
      <input
        ref={inputRef}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onBlur={handleSave}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            handleSave();
          }
          if (e.key === "Escape") {
            setTitle(initialTitle);
            setEditing(false);
          }
        }}
        disabled={saving}
        className="mt-0.5 w-full min-w-0 border-b border-primary bg-transparent text-[15px] font-semibold tracking-tight outline-none"
      />
    );
  }

  return (
    <h1
      onClick={() => setEditing(true)}
      className="group mt-0.5 flex min-w-0 cursor-pointer items-center gap-1.5 text-[15px] font-semibold tracking-tight"
      title="Click to rename"
    >
      <span className="truncate">{initialTitle}</span>
      <Pencil className="h-3 w-3 shrink-0 text-muted-foreground/0 transition-colors group-hover:text-muted-foreground/60" />
    </h1>
  );
}

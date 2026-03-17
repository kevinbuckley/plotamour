"use client";

import { useState, useRef, useEffect } from "react";
import { Pencil } from "lucide-react";

interface EditableBookTitleProps {
  bookId: string;
  initialTitle: string;
}

export function EditableBookTitle({
  bookId,
  initialTitle,
}: EditableBookTitleProps) {
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
      const res = await fetch("/api/books", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "update", id: bookId, title: trimmed }),
      });
      if (!res.ok) throw new Error("Failed to update book title");
      setEditing(false);
    } catch (e) {
      console.error("Failed to update book title:", e);
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
        className="w-full min-w-0 border-b border-primary bg-transparent text-xs font-medium text-muted-foreground outline-none"
      />
    );
  }

  return (
    <p
      onClick={() => setEditing(true)}
      className="group/book flex cursor-pointer items-center gap-1 text-xs font-medium text-muted-foreground"
      title="Click to rename book"
    >
      <span className="truncate">{initialTitle}</span>
      <Pencil className="h-2.5 w-2.5 shrink-0 text-muted-foreground/0 transition-colors group-hover/book:text-muted-foreground/60" />
    </p>
  );
}

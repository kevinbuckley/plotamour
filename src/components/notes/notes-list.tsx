"use client";

import { useState } from "react";
import { Plus, StickyNote, Trash2 } from "lucide-react";

/** Deterministic hue for category color accent */
function getCategoryHue(cat: string): number {
  let hash = 0;
  for (let i = 0; i < cat.length; i++) hash = (hash * 31 + cat.charCodeAt(i)) | 0;
  return 210 + (Math.abs(hash) % 150);
}
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { Note } from "@/lib/types/database";

interface NotesListProps {
  projectId: string;
  initialNotes: Note[];
}

async function noteAction(body: Record<string, unknown>) {
  const res = await fetch("/api/notes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error("API call failed");
  return res.json();
}

export function NotesList({ projectId, initialNotes }: NotesListProps) {
  const [notes, setNotes] = useState(initialNotes);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>("");

  const categories = [
    ...new Set(notes.map((n) => n.category).filter(Boolean)),
  ].sort();

  const filteredNotes = filterCategory
    ? notes.filter((n) => n.category === filterCategory)
    : notes;

  const selectedNote = notes.find((n) => n.id === selectedId) ?? null;

  const handleCreate = async () => {
    const note = await noteAction({
      action: "create",
      projectId,
      category: filterCategory || undefined,
    });
    setNotes((prev) => [note, ...prev]);
    setSelectedId(note.id);
  };

  const handleUpdate = async (id: string, data: Partial<Note>) => {
    const updated = await noteAction({ action: "update", id, data });
    setNotes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, ...updated } : n))
    );
  };

  const handleDelete = async (id: string) => {
    await noteAction({ action: "delete", id });
    setNotes((prev) => prev.filter((n) => n.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  return (
    <div className="flex h-full">
      {/* Sidebar: note list */}
      <div className="w-72 shrink-0 border-r border-border">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/60">
            {filteredNotes.length} Note{filteredNotes.length !== 1 ? "s" : ""}
          </p>
          <Button onClick={handleCreate} size="sm" variant="ghost" className="h-7 w-7 rounded-md p-0">
            <Plus className="h-3.5 w-3.5" />
          </Button>
        </div>

        {/* Category filter */}
        {categories.length > 0 && (
          <div className="flex gap-1 overflow-x-auto border-b border-border px-3 py-2">
            <button
              onClick={() => setFilterCategory("")}
              className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs transition-colors ${
                !filterCategory
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-accent"
              }`}
            >
              All
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() =>
                  setFilterCategory(filterCategory === cat ? "" : cat)
                }
                className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs transition-colors ${
                  filterCategory === cat
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-accent"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {/* Note items */}
        <div className="overflow-y-auto">
          {filteredNotes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center px-4">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-muted">
                <StickyNote className="h-6 w-6 text-muted-foreground/60" />
              </div>
              <p className="text-sm font-semibold">No notes yet</p>
              <p className="mt-1 text-xs text-muted-foreground">Jot down ideas, research, and inspiration.</p>
              <Button
                onClick={handleCreate}
                size="sm"
                variant="outline"
                className="mt-3 gap-1.5"
              >
                <Plus className="h-3.5 w-3.5" />
                New Note
              </Button>
            </div>
          ) : (
            filteredNotes.map((note) => {
              const catHue = note.category ? getCategoryHue(note.category) : null;
              return (
                <button
                  key={note.id}
                  onClick={() => setSelectedId(note.id)}
                  className={`group relative flex w-full items-start gap-0 border-b border-border/60 text-left transition-colors ${
                    selectedId === note.id
                      ? "bg-primary/[0.04]"
                      : "hover:bg-accent/40"
                  }`}
                >
                  {/* Category color strip */}
                  <div
                    className="absolute left-0 top-0 h-full w-[3px] rounded-r-sm transition-opacity"
                    style={catHue
                      ? { backgroundColor: `hsl(${catHue}, 60%, 55%)`, opacity: selectedId === note.id ? 1 : 0.5 }
                      : { backgroundColor: "var(--primary)", opacity: selectedId === note.id ? 0.6 : 0.2 }
                    }
                  />
                  <div className="min-w-0 flex-1 pl-5 pr-4 py-3">
                    <p className="truncate text-sm font-medium leading-snug">{note.title}</p>
                    {note.category && (
                      <span
                        className="mt-0.5 inline-block rounded-full px-1.5 py-px text-[10px] font-semibold"
                        style={catHue ? {
                          backgroundColor: `hsl(${catHue}, 65%, 93%)`,
                          color: `hsl(${catHue}, 50%, 35%)`,
                        } : {}}
                      >
                        {note.category}
                      </span>
                    )}
                    {note.content && (
                      <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                        {note.content}
                      </p>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 overflow-y-auto">
        {selectedNote ? (
          <NoteEditor
            note={selectedNote}
            onUpdate={handleUpdate}
            onDelete={handleDelete}
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted/60">
              <StickyNote className="h-7 w-7 text-muted-foreground/40" />
            </div>
            <p className="text-sm text-muted-foreground">
              Select a note to start editing
            </p>
            <Button onClick={handleCreate} size="sm" variant="outline" className="gap-1.5 mt-1">
              <Plus className="h-3.5 w-3.5" />
              New Note
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

function NoteEditor({
  note,
  onUpdate,
  onDelete,
}: {
  note: Note;
  onUpdate: (id: string, data: Partial<Note>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const [title, setTitle] = useState(note.title);
  const [content, setContent] = useState(note.content);
  const [category, setCategory] = useState(note.category);

  // Sync when note changes
  useState(() => {
    setTitle(note.title);
    setContent(note.content);
    setCategory(note.category);
  });

  const catHue = category ? getCategoryHue(category) : null;

  return (
    <div className="flex h-full flex-col">
      {/* Editor toolbar */}
      <div className="flex items-center justify-between border-b border-border px-6 py-2.5">
        <div className="flex items-center gap-2">
          {/* Category pill — click to edit */}
          <div className="relative">
            <Input
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              onBlur={() => onUpdate(note.id, { category })}
              placeholder="+ Category"
              className="h-6 w-28 rounded-full border-none px-2.5 py-0 text-[11px] font-semibold shadow-none focus-visible:ring-1 focus-visible:ring-primary/30"
              style={catHue ? {
                backgroundColor: `hsl(${catHue}, 65%, 93%)`,
                color: `hsl(${catHue}, 50%, 35%)`,
              } : {}}
            />
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 rounded-md p-0 text-muted-foreground/60 hover:text-destructive hover:bg-destructive/10"
          onClick={() => {
            if (confirm("Delete this note?")) onDelete(note.id);
          }}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>

      <div className="flex-1 space-y-3 p-6">
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={() => onUpdate(note.id, { title })}
          className="border-none px-0 text-xl font-bold shadow-none focus-visible:ring-0"
          placeholder="Note title"
        />
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onBlur={() => onUpdate(note.id, { content })}
          className="min-h-[400px] resize-none border-none px-0 shadow-none focus-visible:ring-0 text-sm leading-relaxed text-foreground/80"
          placeholder="Start writing..."
        />
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { Plus, StickyNote, Trash2, ChevronRight } from "lucide-react";
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
          <p className="text-sm text-muted-foreground">
            {filteredNotes.length} note{filteredNotes.length !== 1 ? "s" : ""}
          </p>
          <Button onClick={handleCreate} size="sm" variant="ghost" className="h-8 gap-1">
            <Plus className="h-4 w-4" />
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
              <StickyNote className="mb-2 h-8 w-8 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">No notes yet</p>
              <Button
                onClick={handleCreate}
                size="sm"
                variant="outline"
                className="mt-3 gap-1"
              >
                <Plus className="h-3.5 w-3.5" />
                New Note
              </Button>
            </div>
          ) : (
            filteredNotes.map((note) => (
              <button
                key={note.id}
                onClick={() => setSelectedId(note.id)}
                className={`group flex w-full items-center gap-2 border-b border-border px-4 py-3 text-left transition-colors ${
                  selectedId === note.id
                    ? "bg-primary/5"
                    : "hover:bg-accent/50"
                }`}
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{note.title}</p>
                  {note.category && (
                    <p className="text-xs text-muted-foreground">{note.category}</p>
                  )}
                  {note.content && (
                    <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                      {note.content}
                    </p>
                  )}
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/50" />
              </button>
            ))
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
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <StickyNote className="mx-auto mb-3 h-10 w-10 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">
                Select a note to edit, or create a new one
              </p>
            </div>
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

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-border px-6 py-3">
        <div className="flex items-center gap-3">
          <Input
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            onBlur={() => onUpdate(note.id, { category })}
            placeholder="Category"
            className="h-7 w-32 text-xs"
          />
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="text-destructive hover:text-destructive"
          onClick={() => {
            if (confirm("Delete this note?")) onDelete(note.id);
          }}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex-1 space-y-4 p-6">
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={() => onUpdate(note.id, { title })}
          className="border-none text-xl font-semibold shadow-none focus-visible:ring-0"
          placeholder="Note title"
        />
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onBlur={() => onUpdate(note.id, { content })}
          className="min-h-[400px] resize-none border-none shadow-none focus-visible:ring-0"
          placeholder="Start writing..."
        />
      </div>
    </div>
  );
}

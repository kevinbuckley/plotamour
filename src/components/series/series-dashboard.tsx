"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, BookOpen, Trash2, Pencil } from "lucide-react";
import type { Book, Project } from "@/lib/types/database";

interface SeriesDashboardProps {
  project: Project;
  books: Book[];
}

export function SeriesDashboard({ project, books: initialBooks }: SeriesDashboardProps) {
  const router = useRouter();
  const [books, setBooks] = useState(initialBooks);
  const [showNewForm, setShowNewForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [creating, setCreating] = useState(false);
  const [editingBookId, setEditingBookId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const editInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingBookId) {
      editInputRef.current?.focus();
      editInputRef.current?.select();
    }
  }, [editingBookId]);

  const handleCreateBook = async () => {
    if (!newTitle.trim()) return;
    setCreating(true);
    try {
      const res = await fetch("/api/books", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create",
          projectId: project.id,
          title: newTitle.trim(),
        }),
      });
      if (res.ok) {
        const book = await res.json();
        setBooks((prev) => [...prev, book]);
        setNewTitle("");
        setShowNewForm(false);
      }
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteBook = async (bookId: string, bookTitle: string) => {
    if (books.length <= 1) {
      alert("A series must have at least one book.");
      return;
    }
    if (!confirm(`Delete "${bookTitle}"? This will remove all its chapters, plotlines, and scenes.`)) return;

    try {
      const res = await fetch("/api/books", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete", id: bookId }),
      });
      if (!res.ok) throw new Error("Failed to delete book");
      setBooks((prev) => prev.filter((b) => b.id !== bookId));
    } catch (e) {
      console.error("Failed to delete book:", e);
    }
  };

  const handleRenameBook = async (bookId: string) => {
    const trimmed = editingTitle.trim();
    const book = books.find((b) => b.id === bookId);
    if (!trimmed || trimmed === book?.title) {
      setEditingBookId(null);
      return;
    }

    // Optimistic update
    setBooks((prev) =>
      prev.map((b) => (b.id === bookId ? { ...b, title: trimmed } : b))
    );
    setEditingBookId(null);

    try {
      const res = await fetch("/api/books", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "update", id: bookId, title: trimmed }),
      });
      if (!res.ok) throw new Error("Failed to rename book");
    } catch (e) {
      console.error("Failed to rename book:", e);
      // Revert on failure
      setBooks((prev) =>
        prev.map((b) => (b.id === bookId ? { ...b, title: book?.title ?? trimmed } : b))
      );
    }
  };

  const handleOpenBook = (bookId: string) => {
    router.push(`/project/${project.id}/timeline?bookId=${bookId}`);
  };

  /** Deterministic hue from a book ID for gradient cover */
  function getBookHue(id: string): number {
    let hash = 0;
    for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) | 0;
    return 200 + (Math.abs(hash) % 140);
  }

  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {books.map((book, index) => {
          const hue = getBookHue(book.id);
          return (
            <div
              key={book.id}
              className="group relative cursor-pointer overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-border/80 hover:shadow-lg"
              onClick={() => handleOpenBook(book.id)}
            >
              {/* Book cover with unique per-book gradient */}
              <div
                className="flex h-36 items-center justify-center"
                style={{
                  background: `linear-gradient(135deg, hsl(${hue}, 60%, 92%), hsl(${hue + 25}, 65%, 85%))`,
                }}
              >
                <BookOpen
                  className="h-10 w-10 opacity-40"
                  style={{ color: `hsl(${hue}, 55%, 38%)` }}
                />
              </div>

              {/* Thin gradient accent strip at top */}
              <div
                className="absolute top-0 left-0 right-0 h-[3px]"
                style={{
                  background: `linear-gradient(90deg, hsl(${hue}, 65%, 52%), hsl(${hue + 30}, 70%, 60%))`,
                }}
              />

              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <span
                      className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
                      style={{
                        backgroundColor: `hsl(${hue}, 65%, 93%)`,
                        color: `hsl(${hue}, 50%, 35%)`,
                      }}
                    >
                      Book {index + 1}
                    </span>
                    {editingBookId === book.id ? (
                      <input
                        ref={editInputRef}
                        value={editingTitle}
                        onChange={(e) => setEditingTitle(e.target.value)}
                        onBlur={() => handleRenameBook(book.id)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleRenameBook(book.id);
                          }
                          if (e.key === "Escape") setEditingBookId(null);
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="mt-1.5 w-full border-b border-primary bg-transparent text-sm font-semibold leading-snug outline-none"
                      />
                    ) : (
                      <h3
                        className="mt-1.5 flex cursor-text items-center gap-1 truncate text-sm font-semibold leading-snug transition-colors group-hover:text-primary"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingBookId(book.id);
                          setEditingTitle(book.title);
                        }}
                        title="Click to rename"
                      >
                        {book.title}
                        <Pencil className="inline h-2.5 w-2.5 shrink-0 text-muted-foreground/0 transition-colors group-hover:text-muted-foreground/50" />
                      </h3>
                    )}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteBook(book.id, book.title);
                    }}
                    className="shrink-0 rounded-md p-1 text-muted-foreground opacity-0 transition-opacity hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
                {book.description && (
                  <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                    {book.description}
                  </p>
                )}
              </div>
            </div>
          );
        })}

        {/* Add book card */}
        {showNewForm ? (
          <div className="flex flex-col rounded-xl border border-dashed border-primary/60 bg-card p-5 shadow-sm">
            <h3 className="mb-3 text-sm font-semibold">Add a new book</h3>
            <Input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Book title"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreateBook();
                if (e.key === "Escape") setShowNewForm(false);
              }}
            />
            <div className="mt-3 flex gap-2">
              <Button
                size="sm"
                onClick={handleCreateBook}
                disabled={creating || !newTitle.trim()}
              >
                {creating ? "Adding..." : "Add Book"}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowNewForm(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowNewForm(true)}
            className="group flex h-full min-h-[160px] flex-col items-center justify-center gap-2.5 rounded-xl border-2 border-dashed border-border/60 text-muted-foreground/60 transition-all hover:border-primary/50 hover:bg-primary/[0.03] hover:text-primary"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-dashed border-current transition-colors">
              <Plus className="h-5 w-5" />
            </div>
            <span className="text-sm font-medium">Add Book</span>
          </button>
        )}
      </div>
    </div>
  );
}

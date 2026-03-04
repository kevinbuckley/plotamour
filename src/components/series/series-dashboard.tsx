"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, BookOpen, Trash2 } from "lucide-react";
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

    await fetch("/api/books", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "delete", id: bookId }),
    });
    setBooks((prev) => prev.filter((b) => b.id !== bookId));
  };

  const handleOpenBook = (bookId: string) => {
    router.push(`/project/${project.id}/timeline?bookId=${bookId}`);
  };

  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {books.map((book, index) => (
          <div
            key={book.id}
            className="group relative cursor-pointer rounded-lg border border-border bg-card transition-all hover:border-primary hover:shadow-sm"
            onClick={() => handleOpenBook(book.id)}
          >
            {/* Book cover placeholder */}
            <div className="flex h-40 items-center justify-center rounded-t-lg bg-gradient-to-br from-primary/10 to-primary/5">
              <BookOpen className="h-12 w-12 text-primary/40" />
            </div>

            <div className="p-4">
              <div className="flex items-start justify-between">
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">
                    Book {index + 1}
                  </p>
                  <h3 className="truncate font-semibold">{book.title}</h3>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteBook(book.id, book.title);
                  }}
                  className="text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              {book.description && (
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                  {book.description}
                </p>
              )}
            </div>
          </div>
        ))}

        {/* Add book card */}
        {showNewForm ? (
          <div className="flex flex-col rounded-lg border border-dashed border-primary bg-card p-4">
            <h3 className="mb-3 text-sm font-medium">Add a new book</h3>
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
            className="flex h-40 flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border transition-colors hover:border-primary hover:text-primary"
          >
            <Plus className="h-8 w-8" />
            <span className="text-sm font-medium">Add Book</span>
          </button>
        )}
      </div>
    </div>
  );
}

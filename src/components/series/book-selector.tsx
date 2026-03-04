"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Plus, BookOpen, ChevronDown } from "lucide-react";
import type { Book } from "@/lib/types/database";
import { cn } from "@/lib/utils/cn";

interface BookSelectorProps {
  projectId: string;
  books: Book[];
  currentBookId: string;
}

export function BookSelector({
  projectId,
  books,
  currentBookId,
}: BookSelectorProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");

  const currentBook = books.find((b) => b.id === currentBookId);

  const handleSelectBook = (bookId: string) => {
    setOpen(false);
    // Navigate to the same page but with the new bookId
    const url = new URL(pathname, window.location.origin);
    url.searchParams.set("bookId", bookId);
    router.push(url.pathname + url.search);
  };

  const handleCreateBook = async () => {
    if (!newTitle.trim()) return;
    setCreating(true);
    try {
      const res = await fetch("/api/books", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create",
          projectId,
          title: newTitle.trim(),
        }),
      });
      if (res.ok) {
        const book = await res.json();
        setNewTitle("");
        handleSelectBook(book.id);
        router.refresh();
      }
    } finally {
      setCreating(false);
    }
  };

  if (books.length <= 1) return null;

  return (
    <div className="relative px-2">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm transition-colors hover:bg-accent"
      >
        <BookOpen className="h-4 w-4 text-muted-foreground" />
        <span className="flex-1 truncate text-left">
          {currentBook?.title ?? "Select book"}
        </span>
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 text-muted-foreground transition-transform",
            open && "rotate-180"
          )}
        />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute left-2 right-2 top-full z-20 mt-1 rounded-md border border-border bg-popover shadow-md">
            {books.map((book) => (
              <button
                key={book.id}
                onClick={() => handleSelectBook(book.id)}
                className={cn(
                  "flex w-full items-center gap-2 px-3 py-2 text-sm transition-colors hover:bg-accent",
                  book.id === currentBookId && "bg-accent font-medium"
                )}
              >
                <BookOpen className="h-3.5 w-3.5 text-muted-foreground" />
                {book.title}
              </button>
            ))}

            <div className="border-t border-border p-2">
              <div className="flex gap-1.5">
                <input
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="New book title..."
                  className="flex-1 rounded border border-input bg-background px-2 py-1 text-sm"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleCreateBook();
                  }}
                />
                <button
                  onClick={handleCreateBook}
                  disabled={creating || !newTitle.trim()}
                  className="flex items-center gap-1 rounded bg-primary px-2 py-1 text-xs text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
                >
                  <Plus className="h-3 w-3" />
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

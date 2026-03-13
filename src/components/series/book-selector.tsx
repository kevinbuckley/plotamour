"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Plus, BookOpen, ChevronDown, Check } from "lucide-react";
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
  const currentIdx = books.findIndex((b) => b.id === currentBookId);

  const handleSelectBook = (bookId: string) => {
    setOpen(false);
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
        className="flex w-full items-center gap-2 rounded-lg border border-border bg-sidebar-accent/40 px-3 py-2 text-sm transition-colors hover:bg-sidebar-accent hover:border-border/80"
      >
        <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-primary/12 text-[10px] font-bold text-primary">
          {currentIdx + 1}
        </div>
        <span className="flex-1 truncate text-left font-medium">
          {currentBook?.title ?? "Select book"}
        </span>
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 text-muted-foreground transition-transform duration-200",
            open && "rotate-180"
          )}
        />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute left-2 right-2 top-full z-20 mt-1.5 overflow-hidden rounded-xl border border-border bg-popover shadow-xl">
            <div className="px-3 py-2 border-b border-border/60">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
                Books
              </p>
            </div>
            <div className="p-1">
              {books.map((book, idx) => (
                <button
                  key={book.id}
                  onClick={() => handleSelectBook(book.id)}
                  className={cn(
                    "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors hover:bg-accent",
                    book.id === currentBookId && "bg-primary/8"
                  )}
                >
                  <div
                    className={cn(
                      "flex h-5 w-5 shrink-0 items-center justify-center rounded-md text-[10px] font-bold transition-colors",
                      book.id === currentBookId
                        ? "bg-primary/15 text-primary"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    {idx + 1}
                  </div>
                  <span className={cn("flex-1 truncate text-left", book.id === currentBookId && "font-semibold text-primary")}>
                    {book.title}
                  </span>
                  {book.id === currentBookId && (
                    <Check className="h-3.5 w-3.5 shrink-0 text-primary" />
                  )}
                </button>
              ))}
            </div>

            <div className="border-t border-border/60 p-2">
              <div className="flex gap-1.5">
                <input
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="New book title..."
                  className="flex-1 rounded-lg border border-input bg-muted/50 px-2.5 py-1.5 text-sm placeholder:text-muted-foreground/60 focus:border-primary/40 focus:outline-none transition-colors"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleCreateBook();
                  }}
                />
                <button
                  onClick={handleCreateBook}
                  disabled={creating || !newTitle.trim()}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

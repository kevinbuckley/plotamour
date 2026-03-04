"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, ChevronDown } from "lucide-react";

interface ExportMenuProps {
  bookId: string;
}

export function ExportMenu({ bookId }: ExportMenuProps) {
  const [open, setOpen] = useState(false);
  const [exporting, setExporting] = useState(false);

  const handleExport = async (format: "text" | "html" | "json") => {
    setExporting(true);
    setOpen(false);

    try {
      const res = await fetch("/api/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookId, format }),
      });

      if (!res.ok) throw new Error("Export failed");

      const blob = await res.blob();
      const disposition = res.headers.get("Content-Disposition");
      const match = disposition?.match(/filename="(.+?)"/);
      const filename = match?.[1] ?? `outline.${format === "json" ? "json" : format}`;

      // Download
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Export error:", err);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(!open)}
        disabled={exporting}
        className="gap-1.5"
      >
        <Download className="h-3.5 w-3.5" />
        {exporting ? "Exporting..." : "Export"}
        <ChevronDown className="h-3 w-3" />
      </Button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full z-20 mt-1 w-48 rounded-md border border-border bg-popover shadow-md">
            <button
              onClick={() => handleExport("text")}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm transition-colors hover:bg-accent"
            >
              📄 Plain Text (.txt)
            </button>
            <button
              onClick={() => handleExport("html")}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm transition-colors hover:bg-accent"
            >
              🌐 HTML (.html)
            </button>
            <button
              onClick={() => handleExport("json")}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm transition-colors hover:bg-accent"
            >
              📦 JSON (.json)
            </button>
          </div>
        </>
      )}
    </div>
  );
}

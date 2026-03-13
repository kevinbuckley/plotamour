"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, ChevronDown, FileText, Code2, Braces, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface ExportMenuProps {
  bookId: string;
}

const EXPORT_OPTIONS = [
  {
    format: "text" as const,
    label: "Plain Text",
    ext: ".txt",
    icon: FileText,
    description: "Clean, readable text",
  },
  {
    format: "html" as const,
    label: "HTML",
    ext: ".html",
    icon: Code2,
    description: "Formatted web page",
  },
  {
    format: "json" as const,
    label: "JSON",
    ext: ".json",
    icon: Braces,
    description: "Raw data export",
  },
];

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
        className="gap-1.5 text-muted-foreground hover:text-foreground"
      >
        {exporting ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Download className="h-3.5 w-3.5" />
        )}
        {exporting ? "Exporting..." : "Export"}
        <ChevronDown className={cn("h-3 w-3 transition-transform", open && "rotate-180")} />
      </Button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full z-20 mt-1.5 w-52 overflow-hidden rounded-xl border border-border bg-popover shadow-xl">
            <div className="px-3 py-2 border-b border-border/60">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
                Download as
              </p>
            </div>
            <div className="p-1">
              {EXPORT_OPTIONS.map(({ format, label, ext, icon: Icon, description }) => (
                <button
                  key={format}
                  onClick={() => handleExport(format)}
                  className="flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-sm transition-colors hover:bg-accent"
                >
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted">
                    <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 text-left">
                    <span className="font-medium">{label}</span>
                    <span className="ml-1 text-muted-foreground/60">{ext}</span>
                    <p className="text-xs text-muted-foreground/60">{description}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, ChevronDown, FileText, Code2, Braces, Loader2, BookOpen, FileDown } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface ExportMenuProps {
  bookId: string;
}

const OUTLINE_OPTIONS = [
  {
    format: "pdf" as const,
    label: "PDF",
    ext: ".pdf",
    icon: FileDown,
    description: "Print-ready document",
  },
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

const MANUSCRIPT_OPTIONS = [
  {
    format: "pdf" as const,
    label: "PDF",
    ext: ".pdf",
    icon: FileDown,
    description: "Print-ready manuscript",
  },
  {
    format: "html" as const,
    label: "HTML",
    ext: ".html",
    icon: Code2,
    description: "Formatted manuscript",
  },
  {
    format: "text" as const,
    label: "Plain Text",
    ext: ".txt",
    icon: FileText,
    description: "Standard manuscript",
  },
];

/**
 * Open HTML content in a new window and trigger the browser print dialog.
 * The user can then save as PDF from the print dialog.
 */
function printHtmlAsPdf(html: string) {
  const printWindow = window.open("", "_blank");
  if (!printWindow) return;

  printWindow.document.write(html);
  printWindow.document.close();

  // Wait for content to render, then trigger print
  printWindow.onload = () => {
    setTimeout(() => {
      printWindow.print();
    }, 300);
  };
  // Fallback if onload already fired
  setTimeout(() => {
    printWindow.print();
  }, 600);
}

export function ExportMenu({ bookId }: ExportMenuProps) {
  const [open, setOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [compiling, setCompiling] = useState(false);
  const [compileError, setCompileError] = useState<string | null>(null);

  const handleExport = async (format: "text" | "html" | "json" | "pdf") => {
    setExporting(true);
    setOpen(false);

    try {
      // PDF uses the HTML export and opens print dialog
      const apiFormat = format === "pdf" ? "html" : format;

      const res = await fetch("/api/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookId, format: apiFormat }),
      });

      if (!res.ok) throw new Error("Export failed");

      if (format === "pdf") {
        const html = await res.text();
        printHtmlAsPdf(html);
        return;
      }

      const blob = await res.blob();
      const disposition = res.headers.get("Content-Disposition");
      const match = disposition?.match(/filename="(.+?)"/);
      const filename = match?.[1] ?? `outline.${format === "json" ? "json" : format}`;

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

  const handleCompile = async (format: "text" | "html" | "pdf") => {
    setCompiling(true);
    setCompileError(null);
    setOpen(false);

    try {
      // PDF uses the HTML compile and opens print dialog
      const apiFormat = format === "pdf" ? "html" : format;

      const res = await fetch("/api/manuscript", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookId, format: apiFormat }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        if (err.needsReconnect) {
          setCompileError("Google Docs not connected. Please reconnect.");
        } else if (err.skippedScenes?.length > 0) {
          setCompileError(`No scenes with written content found.`);
        } else {
          setCompileError(err.error || "Compilation failed.");
        }
        return;
      }

      if (format === "pdf") {
        const html = await res.text();
        printHtmlAsPdf(html);
        return;
      }

      const blob = await res.blob();
      const disposition = res.headers.get("Content-Disposition");
      const match = disposition?.match(/filename="(.+?)"/);
      const filename = match?.[1] ?? `manuscript.${format}`;

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Compile error:", err);
      setCompileError("Network error. Please try again.");
    } finally {
      setCompiling(false);
    }
  };

  const isLoading = exporting || compiling;

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="sm"
        onClick={() => { setOpen(!open); setCompileError(null); }}
        disabled={isLoading}
        className="gap-1.5 text-muted-foreground hover:text-foreground"
      >
        {isLoading ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Download className="h-3.5 w-3.5" />
        )}
        {compiling ? "Compiling..." : exporting ? "Exporting..." : "Export"}
        <ChevronDown className={cn("h-3 w-3 transition-transform", open && "rotate-180")} />
      </Button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full z-20 mt-1.5 w-56 max-h-[70vh] overflow-y-auto overflow-x-hidden rounded-xl border border-border bg-popover shadow-xl">
            {/* Manuscript compile section */}
            <div className="px-3 py-2 border-b border-border/60">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
                Compile Manuscript
              </p>
            </div>
            <div className="p-1 border-b border-border/40">
              {MANUSCRIPT_OPTIONS.map(({ format, label, ext, icon: Icon, description }) => (
                <button
                  key={`ms-${format}`}
                  onClick={() => handleCompile(format)}
                  className="flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-sm transition-colors hover:bg-accent"
                >
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/10">
                    <BookOpen className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <div className="flex-1 text-left">
                    <span className="font-medium">{label}</span>
                    <span className="ml-1 text-muted-foreground/60">{ext}</span>
                    <p className="text-xs text-muted-foreground/60">{description}</p>
                  </div>
                </button>
              ))}
            </div>

            {/* Outline export section */}
            <div className="px-3 py-2 border-b border-border/60">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
                Export Outline
              </p>
            </div>
            <div className="p-1">
              {OUTLINE_OPTIONS.map(({ format, label, ext, icon: Icon, description }) => (
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

      {/* Compile error toast */}
      {compileError && (
        <div className="absolute right-0 top-full z-30 mt-1.5 w-[calc(100vw-2rem)] max-w-64 rounded-lg border border-destructive/30 bg-destructive/5 p-3 shadow-lg">
          <p className="text-xs text-destructive">{compileError}</p>
          <button
            onClick={() => setCompileError(null)}
            className="mt-1.5 text-[10px] text-muted-foreground hover:text-foreground"
          >
            Dismiss
          </button>
        </div>
      )}
    </div>
  );
}

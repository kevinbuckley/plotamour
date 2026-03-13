"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Upload, FileText, ArrowLeft, Loader2, Check, AlertCircle } from "lucide-react";
import Link from "next/link";

interface PlottrPreview {
  title: string;
  books: number;
  chapters: number;
  plotlines: number;
  scenes: number;
  characters: number;
  places: number;
  notes: number;
  tags: number;
}

export default function ImportPage() {
  const router = useRouter();
  const [fileData, setFileData] = useState<Record<string, unknown> | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [preview, setPreview] = useState<PlottrPreview | null>(null);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const processFile = useCallback(async (file: File) => {
    setError(null);
    setPreview(null);
    setFileName(file.name);

    if (!file.name.endsWith(".pltr") && !file.name.endsWith(".json")) {
      setError("Please upload a .pltr or .json file exported from Plottr.");
      return;
    }

    setLoading(true);

    try {
      const text = await file.text();
      const data = JSON.parse(text);
      setFileData(data);

      // Get preview from server
      const res = await fetch("/api/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "preview", data }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to parse file");
      }

      const previewData = await res.json();
      setPreview(previewData);
    } catch (err) {
      setError(
        err instanceof SyntaxError
          ? "Invalid file format. The file doesn't contain valid JSON data."
          : err instanceof Error
            ? err.message
            : "Failed to read file"
      );
      setFileData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragActive(false);
      const file = e.dataTransfer.files?.[0];
      if (file) processFile(file);
    },
    [processFile]
  );

  const handleImport = async () => {
    if (!fileData) return;

    setImporting(true);
    setError(null);

    try {
      const res = await fetch("/api/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "import", data: fileData }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Import failed");
      }

      const { projectId } = await res.json();
      router.push(`/project/${projectId}/timeline`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed");
      setImporting(false);
    }
  };

  const handleReset = () => {
    setFileData(null);
    setFileName("");
    setPreview(null);
    setError(null);
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <Link
          href="/projects"
          className="mb-5 inline-flex items-center gap-1.5 rounded-md px-1 py-0.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to projects
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">Import from Plottr</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Upload your .pltr file to bring your story into plotamour.
        </p>
      </div>

      <div className="mx-auto max-w-lg">
        {!preview ? (
          <>
            {/* Upload area */}
            <div
              className={`relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-14 text-center transition-all duration-200 ${
                dragActive
                  ? "border-primary bg-primary/5 shadow-[0_0_0_4px_oklch(0.488_0.183_274.376/0.08)]"
                  : "border-border hover:border-primary/40 hover:bg-muted/20"
              }`}
              onDragOver={(e) => {
                e.preventDefault();
                setDragActive(true);
              }}
              onDragLeave={() => setDragActive(false)}
              onDrop={handleDrop}
            >
              {loading ? (
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="h-10 w-10 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">Reading file...</p>
                </div>
              ) : (
                <>
                  <div className="relative mb-5">
                    <div
                      className="absolute inset-0 rounded-2xl blur-lg"
                      style={{ background: "oklch(0.488 0.183 274.376 / 0.12)" }}
                    />
                    <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/15 to-primary/8 shadow-md ring-1 ring-primary/10">
                      <Upload className="h-7 w-7 text-primary" />
                    </div>
                  </div>
                  <p className="text-base font-semibold tracking-tight">
                    Drop your .pltr file here
                  </p>
                  <p className="mt-1.5 text-sm text-muted-foreground">
                    or <span className="text-primary underline-offset-4 hover:underline cursor-pointer">click to browse</span>
                  </p>
                  <input
                    type="file"
                    accept=".pltr,.json"
                    onChange={handleFileChange}
                    className="absolute inset-0 cursor-pointer opacity-0"
                  />
                </>
              )}
            </div>

            {error && (
              <div className="mt-4 flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            <p className="mt-5 text-center text-xs text-muted-foreground/70">
              In Plottr, use <span className="font-medium text-muted-foreground">File → Save As</span> to export a .pltr file you can import here.
            </p>
          </>
        ) : (
          <>
            {/* Preview */}
            <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
              {/* Success header */}
              <div className="flex items-center gap-3 border-b border-border/60 bg-emerald-50/50 px-5 py-4">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-100 shadow-sm">
                  <FileText className="h-4.5 w-4.5 text-emerald-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="font-semibold leading-snug">{preview.title}</h2>
                  <p className="text-xs text-muted-foreground/70 mt-0.5">{fileName}</p>
                </div>
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-500 shadow-sm">
                  <Check className="h-4 w-4 text-white" />
                </div>
              </div>

              {/* Stats */}
              <div className="p-5">
                <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
                  What will be imported
                </p>
                <div className="grid grid-cols-3 gap-2.5">
                  {[
                    { label: "Chapters", value: preview.chapters },
                    { label: "Plotlines", value: preview.plotlines },
                    { label: "Scenes", value: preview.scenes },
                    { label: "Characters", value: preview.characters },
                    { label: "Places", value: preview.places },
                    { label: "Notes", value: preview.notes },
                  ].map(
                    (item) =>
                      item.value > 0 && (
                        <div
                          key={item.label}
                          className="rounded-xl border border-border bg-muted/30 p-3 text-center"
                        >
                          <p className="text-xl font-bold tabular-nums">{item.value}</p>
                          <p className="mt-0.5 text-[11px] font-medium text-muted-foreground">{item.label}</p>
                        </div>
                      )
                  )}
                </div>

                {error && (
                  <div className="mt-4 flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                    <p className="text-sm text-destructive">{error}</p>
                  </div>
                )}

                <div className="mt-5 flex gap-3">
                  <Button
                    onClick={handleImport}
                    disabled={importing}
                    className="flex-1 gap-2"
                  >
                    {importing ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Upload className="h-3.5 w-3.5" />
                    )}
                    {importing ? "Importing..." : "Import Project"}
                  </Button>
                  <Button
                    onClick={handleReset}
                    variant="outline"
                    disabled={importing}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    Start over
                  </Button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

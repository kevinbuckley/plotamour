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
          className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to projects
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">Import from Plottr</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Upload your .pltr file to import your story into plotamour.
        </p>
      </div>

      <div className="mx-auto max-w-lg">
        {!preview ? (
          <>
            {/* Upload area */}
            <div
              className={`relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-12 transition-colors ${
                dragActive
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-muted-foreground/50"
              }`}
              onDragOver={(e) => {
                e.preventDefault();
                setDragActive(true);
              }}
              onDragLeave={() => setDragActive(false)}
              onDrop={handleDrop}
            >
              {loading ? (
                <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
              ) : (
                <>
                  <Upload className="h-10 w-10 text-muted-foreground" />
                  <p className="mt-4 text-sm font-medium">
                    Drop your .pltr file here
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    or click to browse
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
              <div className="mt-4 flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            <p className="mt-4 text-center text-xs text-muted-foreground">
              In Plottr, go to File → Save As to create a .pltr file you can import here.
            </p>
          </>
        ) : (
          <>
            {/* Preview */}
            <div className="rounded-xl border border-border bg-card p-6">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="font-semibold">{preview.title}</h2>
                  <p className="text-xs text-muted-foreground">{fileName}</p>
                </div>
                <Check className="h-5 w-5 text-green-500" />
              </div>

              <div className="mt-5 grid grid-cols-3 gap-3">
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
                        className="rounded-lg bg-muted/50 p-3 text-center"
                      >
                        <p className="text-lg font-semibold">{item.value}</p>
                        <p className="text-xs text-muted-foreground">{item.label}</p>
                      </div>
                    )
                )}
              </div>

              {error && (
                <div className="mt-4 flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3">
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
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}
                  {importing ? "Importing..." : "Import Project"}
                </Button>
                <Button
                  onClick={handleReset}
                  variant="outline"
                  disabled={importing}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { X, FileText, ExternalLink, Trash2 } from "lucide-react";
import type { Scene, SceneGoogleDoc, Chapter, Plotline } from "@/lib/types/database";

type SceneWithDoc = Scene & { google_doc?: SceneGoogleDoc | null };

interface SceneDetailPanelProps {
  scene: SceneWithDoc;
  chapters: Chapter[];
  plotlines: Plotline[];
  projectId: string;
  onUpdate: (id: string, data: Partial<Scene>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onMove: (sceneId: string, chapterId: string, plotlineId: string) => Promise<void>;
  onClose: () => void;
}

export function SceneDetailPanel({
  scene,
  chapters,
  plotlines,
  projectId,
  onUpdate,
  onDelete,
  onMove,
  onClose,
}: SceneDetailPanelProps) {
  const [title, setTitle] = useState(scene.title);
  const [summary, setSummary] = useState(scene.summary);
  const [conflict, setConflict] = useState(scene.conflict);
  const [creatingDoc, setCreatingDoc] = useState(false);

  const currentChapter = chapters.find((c) => c.id === scene.chapter_id);
  const currentPlotline = plotlines.find((p) => p.id === scene.plotline_id);
  const doc = scene.google_doc;

  const handleSave = async () => {
    await onUpdate(scene.id, { title, summary, conflict });
  };

  const handleCreateDoc = async () => {
    setCreatingDoc(true);
    try {
      const res = await fetch("/api/google-docs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "createDoc",
          sceneId: scene.id,
          projectId,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.url) window.open(data.url, "_blank");
      }
    } finally {
      setCreatingDoc(false);
    }
  };

  const handleOpenDoc = () => {
    if (doc?.google_doc_url) window.open(doc.google_doc_url, "_blank");
  };

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 z-40 bg-black/20" onClick={onClose} />

      {/* Panel */}
      <div className="fixed right-0 top-0 z-50 flex h-full w-[420px] flex-col border-l border-border bg-background shadow-lg">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <div className="min-w-0">
            <h2 className="truncate text-base font-semibold">{scene.title}</h2>
            <p className="text-xs text-muted-foreground">
              {currentChapter?.title} &middot; {currentPlotline?.title}
            </p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 space-y-5 overflow-y-auto p-5">
          {/* Title */}
          <div>
            <label className="mb-1.5 block text-sm font-medium">Title</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={handleSave}
            />
          </div>

          {/* Summary */}
          <div>
            <label className="mb-1.5 block text-sm font-medium">Summary</label>
            <Textarea
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              onBlur={handleSave}
              rows={3}
              placeholder="What happens in this scene..."
            />
          </div>

          {/* Conflict */}
          <div>
            <label className="mb-1.5 block text-sm font-medium">Conflict</label>
            <Input
              value={conflict}
              onChange={(e) => setConflict(e.target.value)}
              onBlur={handleSave}
              placeholder="The tension or challenge..."
            />
          </div>

          {/* Move scene */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium">Chapter</label>
              <select
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={scene.chapter_id}
                onChange={(e) => onMove(scene.id, e.target.value, scene.plotline_id)}
              >
                {chapters.map((c) => (
                  <option key={c.id} value={c.id}>{c.title}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Plotline</label>
              <select
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={scene.plotline_id}
                onChange={(e) => onMove(scene.id, scene.chapter_id, e.target.value)}
              >
                {plotlines.map((p) => (
                  <option key={p.id} value={p.id}>{p.title}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Google Docs section */}
          <div className="rounded-lg border border-border p-4">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-medium">
              <FileText className="h-4 w-4" />
              Google Docs
            </h3>

            {doc ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {doc.word_count.toLocaleString()} words
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {doc.writing_status.replace(/_/g, " ")}
                  </span>
                </div>
                {doc.last_synced_at && (
                  <p className="text-xs text-muted-foreground">
                    Last synced: {new Date(doc.last_synced_at).toLocaleString()}
                  </p>
                )}
                <Button onClick={handleOpenDoc} className="w-full gap-2" variant="outline">
                  <ExternalLink className="h-4 w-4" />
                  Open in Google Docs
                </Button>
              </div>
            ) : (
              <Button
                onClick={handleCreateDoc}
                disabled={creatingDoc}
                className="w-full gap-2"
              >
                <FileText className="h-4 w-4" />
                {creatingDoc ? "Creating..." : "Write in Google Docs"}
              </Button>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-border p-4">
          <Button
            variant="ghost"
            className="w-full text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={() => {
              if (confirm("Delete this scene?")) onDelete(scene.id);
            }}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete scene
          </Button>
        </div>
      </div>
    </>
  );
}

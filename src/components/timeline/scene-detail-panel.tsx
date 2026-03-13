"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { X, FileText, ExternalLink, Trash2, MapPin, Plus, Loader2 } from "lucide-react";
import { TagPicker } from "@/components/shared/tag-picker";
import type { Scene, SceneGoogleDoc, Chapter, Plotline, Character, Place, Tag } from "@/lib/types/database";

type SceneWithDoc = Scene & { google_doc?: SceneGoogleDoc | null };

interface SceneDetailPanelProps {
  scene: SceneWithDoc;
  chapters: Chapter[];
  plotlines: Plotline[];
  projectId: string;
  characters: Character[];
  places: Place[];
  tags: Tag[];
  onUpdate: (id: string, data: Partial<Scene>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onMove: (sceneId: string, chapterId: string, plotlineId: string) => Promise<void>;
  onClose: () => void;
  onTagCreated: (tag: Tag) => void;
}

/** Deterministic color for character avatar from name */
function getAvatarColor(name: string): { bg: string; text: string } {
  const COLORS = [
    { bg: "#dbeafe", text: "#1d4ed8" }, // blue
    { bg: "#ede9fe", text: "#7c3aed" }, // violet
    { bg: "#fce7f3", text: "#be185d" }, // pink
    { bg: "#dcfce7", text: "#15803d" }, // green
    { bg: "#fef3c7", text: "#b45309" }, // amber
    { bg: "#ffedd5", text: "#c2410c" }, // orange
    { bg: "#e0f2fe", text: "#0369a1" }, // sky
    { bg: "#f0fdf4", text: "#166534" }, // emerald
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) | 0;
  return COLORS[Math.abs(hash) % COLORS.length];
}

export function SceneDetailPanel({
  scene,
  chapters,
  plotlines,
  projectId,
  characters,
  places,
  tags,
  onUpdate,
  onDelete,
  onMove,
  onClose,
  onTagCreated,
}: SceneDetailPanelProps) {
  const [title, setTitle] = useState(scene.title);
  const [summary, setSummary] = useState(scene.summary);
  const [conflict, setConflict] = useState(scene.conflict);
  const [creatingDoc, setCreatingDoc] = useState(false);
  const [docError, setDocError] = useState<string | null>(null);
  const [linkedCharacterIds, setLinkedCharacterIds] = useState<string[]>([]);
  const [linkedPlaceIds, setLinkedPlaceIds] = useState<string[]>([]);
  const [tagIds, setTagIds] = useState<string[]>([]);
  const [showCharacterPicker, setShowCharacterPicker] = useState(false);
  const [showPlacePicker, setShowPlacePicker] = useState(false);

  const currentChapter = chapters.find((c) => c.id === scene.chapter_id);
  const currentPlotline = plotlines.find((p) => p.id === scene.plotline_id);
  const doc = scene.google_doc;

  useEffect(() => {
    setTitle(scene.title);
    setSummary(scene.summary);
    setConflict(scene.conflict);

    // Fetch linked characters
    fetch("/api/characters", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "getSceneCharacters", sceneId: scene.id }),
    })
      .then((r) => r.json())
      .then(setLinkedCharacterIds)
      .catch(() => {});

    // Fetch linked places
    fetch("/api/places", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "getScenePlaces", sceneId: scene.id }),
    })
      .then((r) => r.json())
      .then(setLinkedPlaceIds)
      .catch(() => {});

    // Fetch tags
    fetch("/api/tags", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "getSceneTags", sceneId: scene.id }),
    })
      .then((r) => r.json())
      .then(setTagIds)
      .catch(() => {});
  }, [scene.id, scene.title, scene.summary, scene.conflict]);

  const handleSave = async () => {
    await onUpdate(scene.id, { title, summary, conflict });
  };

  const handleCreateDoc = async () => {
    setCreatingDoc(true);
    setDocError(null);
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
        if (data.url) {
          window.open(data.url, "_blank");
        } else {
          setDocError("Failed to create document.");
        }
      } else {
        const err = await res.json().catch(() => ({}));
        setDocError(err.needsReconnect ? "reconnect" : (err.error || "Failed to create Google Doc."));
      }
    } catch {
      setDocError("Network error. Please try again.");
    } finally {
      setCreatingDoc(false);
    }
  };

  const handleOpenDoc = () => {
    if (doc?.google_doc_url) window.open(doc.google_doc_url, "_blank");
  };

  const handleLinkCharacter = async (characterId: string) => {
    await fetch("/api/characters", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "linkToScene", sceneId: scene.id, characterId }),
    });
    setLinkedCharacterIds((prev) => [...prev, characterId]);
    setShowCharacterPicker(false);
  };

  const handleUnlinkCharacter = async (characterId: string) => {
    await fetch("/api/characters", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "unlinkFromScene", sceneId: scene.id, characterId }),
    });
    setLinkedCharacterIds((prev) => prev.filter((id) => id !== characterId));
  };

  const handleLinkPlace = async (placeId: string) => {
    await fetch("/api/places", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "linkToScene", sceneId: scene.id, placeId }),
    });
    setLinkedPlaceIds((prev) => [...prev, placeId]);
    setShowPlacePicker(false);
  };

  const handleUnlinkPlace = async (placeId: string) => {
    await fetch("/api/places", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "unlinkFromScene", sceneId: scene.id, placeId }),
    });
    setLinkedPlaceIds((prev) => prev.filter((id) => id !== placeId));
  };

  const handleAddTag = async (tagId: string) => {
    await fetch("/api/tags", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "addToScene", sceneId: scene.id, tagId }),
    });
    setTagIds((prev) => [...prev, tagId]);
  };

  const handleRemoveTag = async (tagId: string) => {
    await fetch("/api/tags", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "removeFromScene", sceneId: scene.id, tagId }),
    });
    setTagIds((prev) => prev.filter((id) => id !== tagId));
  };

  const unlinkedCharacters = characters.filter(
    (c) => !linkedCharacterIds.includes(c.id)
  );
  const unlinkedPlaces = places.filter(
    (p) => !linkedPlaceIds.includes(p.id)
  );

  const writingStatusLabel: Record<string, string> = {
    not_started: "Not started",
    in_progress: "In progress",
    draft_complete: "Draft complete",
  };

  const writingStatusClass: Record<string, string> = {
    not_started: "bg-gray-100 text-gray-500",
    in_progress: "bg-amber-50 text-amber-600",
    draft_complete: "bg-emerald-50 text-emerald-700",
  };

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[1px]" onClick={onClose} />

      {/* Panel */}
      <div className="fixed right-0 top-0 z-50 flex h-full w-[420px] flex-col border-l border-border bg-background shadow-2xl">
        {/* Plotline color accent strip */}
        {currentPlotline && (
          <div
            className="h-[3px] w-full shrink-0"
            style={{
              background: `linear-gradient(90deg, ${currentPlotline.color}, ${currentPlotline.color}bb)`,
            }}
          />
        )}

        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
          <div className="min-w-0">
            <h2 className="truncate text-base font-semibold">{scene.title}</h2>
            <div className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
              <span>{currentChapter?.title}</span>
              {currentPlotline && (
                <>
                  <span>&middot;</span>
                  <span
                    className="inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-semibold text-white"
                    style={{ backgroundColor: currentPlotline.color }}
                  >
                    {currentPlotline.title}
                  </span>
                </>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="ml-3 rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 space-y-5 overflow-y-auto p-5">
          {/* Title */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-muted-foreground/70">Title</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={handleSave}
            />
          </div>

          {/* Summary */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-muted-foreground/70">Summary</label>
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
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-muted-foreground/70">Conflict</label>
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
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-muted-foreground/70">Chapter</label>
              <select
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-xs transition-colors focus:border-ring focus:outline-none focus:ring-[3px] focus:ring-ring/20"
                value={scene.chapter_id}
                onChange={(e) => onMove(scene.id, e.target.value, scene.plotline_id)}
              >
                {chapters.map((c) => (
                  <option key={c.id} value={c.id}>{c.title}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-muted-foreground/70">Plotline</label>
              <select
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-xs transition-colors focus:border-ring focus:outline-none focus:ring-[3px] focus:ring-ring/20"
                value={scene.plotline_id}
                onChange={(e) => onMove(scene.id, scene.chapter_id, e.target.value)}
              >
                {plotlines.map((p) => (
                  <option key={p.id} value={p.id}>{p.title}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Divider before metadata */}
          <div className="border-t border-border/60" />

          {/* Characters */}
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-widest text-muted-foreground/70">Characters</label>
            <div className="space-y-1.5">
              {linkedCharacterIds.map((cid) => {
                const char = characters.find((c) => c.id === cid);
                if (!char) return null;
                const avatarColor = getAvatarColor(char.name);
                return (
                  <div
                    key={cid}
                    className="group flex items-center gap-2.5 rounded-lg bg-muted/40 px-3 py-1.5"
                  >
                    {/* Character initials avatar */}
                    <div
                      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold"
                      style={{ backgroundColor: avatarColor.bg, color: avatarColor.text }}
                    >
                      {char.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm">{char.name}</span>
                    <button
                      onClick={() => handleUnlinkCharacter(cid)}
                      className="ml-auto text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                );
              })}
              {showCharacterPicker ? (
                <div className="rounded-lg border border-border bg-card p-2 shadow-sm">
                  {unlinkedCharacters.length === 0 ? (
                    <p className="px-2 py-1 text-xs text-muted-foreground">
                      No more characters to add
                    </p>
                  ) : (
                    unlinkedCharacters.map((char) => {
                      const avatarColor = getAvatarColor(char.name);
                      return (
                        <button
                          key={char.id}
                          onClick={() => handleLinkCharacter(char.id)}
                          className="flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-accent"
                        >
                          <div
                            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold"
                            style={{ backgroundColor: avatarColor.bg, color: avatarColor.text }}
                          >
                            {char.name.charAt(0).toUpperCase()}
                          </div>
                          {char.name}
                        </button>
                      );
                    })
                  )}
                  <button
                    onClick={() => setShowCharacterPicker(false)}
                    className="mt-1 w-full text-center text-xs text-muted-foreground hover:text-foreground"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowCharacterPicker(true)}
                  className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <Plus className="h-3 w-3" />
                  Add character
                </button>
              )}
            </div>
          </div>

          {/* Places */}
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-widest text-muted-foreground/70">Places</label>
            <div className="space-y-1.5">
              {linkedPlaceIds.map((pid) => {
                const pl = places.find((p) => p.id === pid);
                if (!pl) return null;
                return (
                  <div
                    key={pid}
                    className="group flex items-center gap-2.5 rounded-lg bg-muted/40 px-3 py-1.5"
                  >
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sky-100">
                      <MapPin className="h-3.5 w-3.5 text-sky-600" />
                    </div>
                    <span className="text-sm">{pl.name}</span>
                    <button
                      onClick={() => handleUnlinkPlace(pid)}
                      className="ml-auto text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                );
              })}
              {showPlacePicker ? (
                <div className="rounded-lg border border-border bg-card p-2 shadow-sm">
                  {unlinkedPlaces.length === 0 ? (
                    <p className="px-2 py-1 text-xs text-muted-foreground">
                      No more places to add
                    </p>
                  ) : (
                    unlinkedPlaces.map((pl) => (
                      <button
                        key={pl.id}
                        onClick={() => handleLinkPlace(pl.id)}
                        className="flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-accent"
                      >
                        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sky-100">
                          <MapPin className="h-3.5 w-3.5 text-sky-600" />
                        </div>
                        {pl.name}
                      </button>
                    ))
                  )}
                  <button
                    onClick={() => setShowPlacePicker(false)}
                    className="mt-1 w-full text-center text-xs text-muted-foreground hover:text-foreground"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowPlacePicker(true)}
                  className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <Plus className="h-3 w-3" />
                  Add place
                </button>
              )}
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-widest text-muted-foreground/70">Tags</label>
            <TagPicker
              allTags={tags}
              selectedTagIds={tagIds}
              projectId={projectId}
              onAdd={handleAddTag}
              onRemove={handleRemoveTag}
              onCreate={onTagCreated}
            />
          </div>

          {/* Google Docs section */}
          <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
            <div className="flex items-center gap-2 border-b border-border/60 bg-muted/30 px-4 py-3">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-100">
                <FileText className="h-4 w-4 text-blue-600" />
              </div>
              <h3 className="text-sm font-semibold">Google Docs</h3>
            </div>

            <div className="p-4">
              {doc ? (
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${writingStatusClass[doc.writing_status] ?? "bg-gray-100 text-gray-500"}`}
                    >
                      {writingStatusLabel[doc.writing_status] ?? doc.writing_status}
                    </span>
                    {doc.word_count > 0 && (
                      <span className="tabular-nums text-sm font-medium text-foreground/70">
                        {doc.word_count.toLocaleString()} <span className="font-normal text-muted-foreground">words</span>
                      </span>
                    )}
                  </div>
                  {doc.last_synced_at && (
                    <p className="text-[11px] text-muted-foreground/70">
                      Synced {new Date(doc.last_synced_at).toLocaleString()}
                    </p>
                  )}
                  <Button onClick={handleOpenDoc} className="w-full gap-2" variant="outline" size="sm">
                    <ExternalLink className="h-3.5 w-3.5" />
                    Open in Google Docs
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <Button
                    onClick={handleCreateDoc}
                    disabled={creatingDoc}
                    className="w-full gap-2"
                    size="sm"
                  >
                    {creatingDoc ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <FileText className="h-3.5 w-3.5" />
                    )}
                    {creatingDoc ? "Creating doc..." : "Write in Google Docs"}
                  </Button>
                  {docError && (
                    docError === "reconnect" ? (
                      <p className="text-xs text-destructive">
                        Google Docs not connected.{" "}
                        <a
                          href={`/auth/login?reconnect=true&next=${encodeURIComponent(window.location.pathname)}`}
                          className="underline hover:no-underline"
                        >
                          Connect Google Docs →
                        </a>
                      </p>
                    ) : (
                      <p className="text-xs text-destructive">{docError}</p>
                    )
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-border p-4">
          <Button
            variant="ghost"
            size="sm"
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

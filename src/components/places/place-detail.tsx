"use client";

import { useState, useEffect } from "react";
import { X, Plus, Trash2, MapPin, ChevronDown, ChevronUp, Link2, StickyNote, ExternalLink } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { TagPicker } from "@/components/shared/tag-picker";
import type { Place, Tag, ResearchLink } from "@/lib/types/database";
import type { SceneMention } from "@/lib/services/characters";

interface PlaceDetailProps {
  place: Place;
  projectId: string;
  allTags: Tag[];
  onUpdate: (id: string, data: Partial<Place>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onClose: () => void;
  onTagCreated: (tag: Tag) => void;
}

export function PlaceDetail({
  place,
  projectId,
  allTags,
  onUpdate,
  onDelete,
  onClose,
  onTagCreated,
}: PlaceDetailProps) {
  const [name, setName] = useState(place.name);
  const [description, setDescription] = useState(place.description);
  const [attributes, setAttributes] = useState<Record<string, string>>(
    (place.custom_attributes as Record<string, string>) ?? {}
  );
  const [newAttrKey, setNewAttrKey] = useState("");
  const [tagIds, setTagIds] = useState<string[]>([]);

  // Aliases
  const [aliases, setAliases] = useState<string[]>(place.aliases ?? []);
  const [newAlias, setNewAlias] = useState("");

  // Research links
  const [researchLinks, setResearchLinks] = useState<ResearchLink[]>(
    (place.research_links as ResearchLink[]) ?? []
  );
  const [showResearchForm, setShowResearchForm] = useState(false);
  const [newResearchType, setNewResearchType] = useState<"url" | "note">("url");
  const [newResearchTitle, setNewResearchTitle] = useState("");
  const [newResearchUrl, setNewResearchUrl] = useState("");
  const [newResearchNotes, setNewResearchNotes] = useState("");

  // Mentions
  const [mentions, setMentions] = useState<SceneMention[]>([]);
  const [mentionsExpanded, setMentionsExpanded] = useState(false);

  useEffect(() => {
    setName(place.name);
    setDescription(place.description);
    setAttributes((place.custom_attributes as Record<string, string>) ?? {});
    setAliases(place.aliases ?? []);
    setResearchLinks((place.research_links as ResearchLink[]) ?? []);

    const controller = new AbortController();

    fetch("/api/tags", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "getPlaceTags", placeId: place.id }),
      signal: controller.signal,
    })
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then(setTagIds)
      .catch((e) => { if (e.name !== "AbortError") console.error(e); });

    fetch("/api/places", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "getPlaceScenesDetailed", placeId: place.id }),
      signal: controller.signal,
    })
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then(setMentions)
      .catch((e) => { if (e.name !== "AbortError") console.error(e); });

    return () => controller.abort();
  }, [place.id]);

  const handleSave = async () => {
    try {
      await onUpdate(place.id, { name, description });
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveAttribute = async (key: string, value: string) => {
    const updated = { ...attributes, [key]: value };
    setAttributes(updated);
    try {
      await onUpdate(place.id, { custom_attributes: updated as Record<string, unknown> });
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteAttribute = async (key: string) => {
    const updated = { ...attributes };
    delete updated[key];
    setAttributes(updated);
    try {
      await onUpdate(place.id, { custom_attributes: updated as Record<string, unknown> });
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddAttribute = async () => {
    if (!newAttrKey.trim()) return;
    const key = newAttrKey.trim();
    const updated = { ...attributes, [key]: "" };
    setAttributes(updated);
    setNewAttrKey("");
    try {
      await onUpdate(place.id, { custom_attributes: updated as Record<string, unknown> });
    } catch (e) {
      console.error(e);
    }
  };

  // ── Aliases ──────────────────────────────────────────────────────────────

  const handleAddAlias = async () => {
    const alias = newAlias.trim();
    if (!alias || aliases.includes(alias)) return;
    const updated = [...aliases, alias];
    setAliases(updated);
    setNewAlias("");
    try {
      await onUpdate(place.id, { aliases: updated });
    } catch (e) {
      console.error(e);
    }
  };

  const handleRemoveAlias = async (alias: string) => {
    const updated = aliases.filter((a) => a !== alias);
    setAliases(updated);
    try {
      await onUpdate(place.id, { aliases: updated });
    } catch (e) {
      console.error(e);
    }
  };

  // ── Research Links ────────────────────────────────────────────────────────

  const handleAddResearchLink = async () => {
    if (!newResearchTitle.trim()) return;
    const link: ResearchLink = {
      id: crypto.randomUUID(),
      type: newResearchType,
      title: newResearchTitle.trim(),
      url: newResearchType === "url" ? newResearchUrl.trim() : undefined,
      notes: newResearchNotes.trim() || undefined,
      created_at: new Date().toISOString(),
    };
    const updated = [...researchLinks, link];
    setResearchLinks(updated);
    setNewResearchTitle("");
    setNewResearchUrl("");
    setNewResearchNotes("");
    setShowResearchForm(false);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await onUpdate(place.id, { research_links: updated as any });
    } catch (e) { console.error(e); }
  };

  const handleDeleteResearchLink = async (id: string) => {
    const updated = researchLinks.filter((l) => l.id !== id);
    setResearchLinks(updated);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await onUpdate(place.id, { research_links: updated as any });
    } catch (e) { console.error(e); }
  };

  // ── Tags ─────────────────────────────────────────────────────────────────

  const handleAddTag = async (tagId: string) => {
    try {
      const res = await fetch("/api/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "addToPlace", placeId: place.id, tagId }),
      });
      if (!res.ok) throw new Error();
      setTagIds((prev) => [...prev, tagId]);
    } catch (e) {
      console.error(e);
    }
  };

  const handleRemoveTag = async (tagId: string) => {
    try {
      const res = await fetch("/api/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "removeFromPlace", placeId: place.id, tagId }),
      });
      if (!res.ok) throw new Error();
      setTagIds((prev) => prev.filter((id) => id !== tagId));
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="w-full md:w-[380px] shrink-0 border-l border-border bg-background">
      <div className="flex h-full flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sky-100 shadow-sm">
              <MapPin className="h-4.5 w-4.5 text-sky-600" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">Place</p>
              <h2 className="truncate text-sm font-semibold leading-tight">{place.name}</h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="ml-2 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 space-y-5 overflow-y-auto p-5">
          {/* Name */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-muted-foreground/70">Name</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} onBlur={handleSave} />
          </div>

          {/* Aliases */}
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-widest text-muted-foreground/70">Also Known As</label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {aliases.map((alias) => (
                <span
                  key={alias}
                  className="group inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium"
                >
                  {alias}
                  <button
                    onClick={() => handleRemoveAlias(alias)}
                    className="text-muted-foreground/50 transition-colors hover:text-destructive"
                  >
                    <X className="h-2.5 w-2.5" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <Input
                value={newAlias}
                onChange={(e) => setNewAlias(e.target.value)}
                placeholder="Add alternate name"
                className="text-sm"
                onKeyDown={(e) => { if (e.key === "Enter") handleAddAlias(); }}
              />
              <Button variant="outline" size="sm" onClick={handleAddAlias} disabled={!newAlias.trim()}>
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-muted-foreground/70">Description</label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onBlur={handleSave}
              rows={4}
              placeholder="Describe this place..."
            />
          </div>

          <div className="border-t border-border/60" />

          {/* Custom Attributes */}
          <div>
            <label className="mb-2.5 block text-xs font-semibold uppercase tracking-widest text-muted-foreground/70">Details</label>
            <div className="space-y-2">
              {Object.entries(attributes).map(([key, value]) => (
                <div key={key} className="group flex items-start gap-2">
                  <div className="flex-1 overflow-hidden rounded-lg border border-border bg-muted/30 px-3 py-2">
                    <label className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">{key}</label>
                    <Input
                      value={value}
                      onChange={(e) => setAttributes((prev) => ({ ...prev, [key]: e.target.value }))}
                      onBlur={(e) => handleSaveAttribute(key, e.target.value)}
                      className="mt-0.5 h-auto border-none bg-transparent p-0 shadow-none focus-visible:ring-0"
                    />
                  </div>
                  <button
                    onClick={() => handleDeleteAttribute(key)}
                    className="mt-3 rounded-md p-1 text-muted-foreground opacity-0 transition-opacity hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
            <div className="mt-2 flex items-center gap-2">
              <Input
                value={newAttrKey}
                onChange={(e) => setNewAttrKey(e.target.value)}
                placeholder="Add field (e.g. Type, Era)"
                className="text-sm"
                onKeyDown={(e) => { if (e.key === "Enter") handleAddAttribute(); }}
              />
              <Button variant="outline" size="sm" onClick={handleAddAttribute} disabled={!newAttrKey.trim()}>
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-widest text-muted-foreground/70">Tags</label>
            <TagPicker
              allTags={allTags}
              selectedTagIds={tagIds}
              projectId={projectId}
              onAdd={handleAddTag}
              onRemove={handleRemoveTag}
              onCreate={onTagCreated}
            />
          </div>

          {/* Research Links */}
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-widest text-muted-foreground/70">Research</label>
            <div className="space-y-1.5">
              {researchLinks.map((link) => (
                <div key={link.id} className="group flex items-start gap-2 rounded-lg border border-border bg-muted/20 px-3 py-2">
                  <div className="mt-0.5 shrink-0 text-muted-foreground/60">
                    {link.type === "url" ? <Link2 className="h-3.5 w-3.5" /> : <StickyNote className="h-3.5 w-3.5" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold leading-tight truncate">{link.title}</p>
                    {link.url && (
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-0.5 text-[10px] text-primary hover:underline truncate max-w-full"
                      >
                        {link.url.replace(/^https?:\/\//, "").slice(0, 40)}
                        <ExternalLink className="h-2.5 w-2.5 shrink-0" />
                      </a>
                    )}
                    {link.notes && (
                      <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2">{link.notes}</p>
                    )}
                  </div>
                  <button
                    onClick={() => handleDeleteResearchLink(link.id)}
                    className="shrink-0 rounded p-0.5 text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>

            {showResearchForm ? (
              <div className="mt-2 rounded-lg border border-border bg-muted/20 p-3 space-y-2">
                <div className="flex gap-2">
                  <button
                    onClick={() => setNewResearchType("url")}
                    className={`flex-1 rounded-md px-2 py-1 text-xs font-medium transition-colors ${newResearchType === "url" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
                  >
                    🔗 Link
                  </button>
                  <button
                    onClick={() => setNewResearchType("note")}
                    className={`flex-1 rounded-md px-2 py-1 text-xs font-medium transition-colors ${newResearchType === "note" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
                  >
                    📝 Note
                  </button>
                </div>
                <Input
                  value={newResearchTitle}
                  onChange={(e) => setNewResearchTitle(e.target.value)}
                  placeholder="Title"
                  className="text-sm"
                />
                {newResearchType === "url" && (
                  <Input
                    value={newResearchUrl}
                    onChange={(e) => setNewResearchUrl(e.target.value)}
                    placeholder="https://..."
                    className="text-sm"
                  />
                )}
                <Input
                  value={newResearchNotes}
                  onChange={(e) => setNewResearchNotes(e.target.value)}
                  placeholder="Notes (optional)"
                  className="text-sm"
                  onKeyDown={(e) => { if (e.key === "Enter") handleAddResearchLink(); }}
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleAddResearchLink} disabled={!newResearchTitle.trim()}>Add</Button>
                  <Button size="sm" variant="ghost" onClick={() => { setShowResearchForm(false); setNewResearchTitle(""); setNewResearchUrl(""); setNewResearchNotes(""); }}>Cancel</Button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowResearchForm(true)}
                className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-primary"
              >
                <Plus className="h-3.5 w-3.5" />
                Add research link or note
              </button>
            )}
          </div>

          <div className="border-t border-border/60" />

          {/* Used In */}
          <div>
            <button
              className="flex w-full items-center justify-between"
              onClick={() => setMentionsExpanded((v) => !v)}
            >
              <label className="cursor-pointer text-xs font-semibold uppercase tracking-widest text-muted-foreground/70">
                Used In
                {mentions.length > 0 && (
                  <span className="ml-1.5 rounded-full bg-sky-100 px-1.5 py-0.5 text-[10px] text-sky-700">
                    {mentions.length}
                  </span>
                )}
              </label>
              {mentions.length > 0 && (
                mentionsExpanded ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
              )}
            </button>

            {mentions.length === 0 ? (
              <p className="mt-1.5 text-xs text-muted-foreground">
                Link this place to scenes from the scene detail panel.
              </p>
            ) : mentionsExpanded ? (
              <div className="mt-2 space-y-1">
                {mentions.map((m) => (
                  <div key={m.sceneId} className="rounded-md border border-border bg-muted/20 px-3 py-2">
                    <p className="text-xs font-medium text-foreground truncate">{m.sceneTitle}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{m.chapterTitle}</p>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-border p-4">
          <Button
            variant="ghost"
            className="w-full text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={() => {
              if (confirm(`Delete "${place.name}"?`)) onDelete(place.id);
            }}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete place
          </Button>
        </div>
      </div>
    </div>
  );
}

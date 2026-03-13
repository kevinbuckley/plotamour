"use client";

import { useState, useEffect } from "react";
import { X, Plus, Trash2, MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { TagPicker } from "@/components/shared/tag-picker";
import type { Place, Tag } from "@/lib/types/database";

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
  const [sceneIds, setSceneIds] = useState<string[]>([]);

  useEffect(() => {
    setName(place.name);
    setDescription(place.description);
    setAttributes(
      (place.custom_attributes as Record<string, string>) ?? {}
    );

    fetch("/api/tags", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "getPlaceTags", placeId: place.id }),
    })
      .then((r) => r.json())
      .then(setTagIds)
      .catch(() => {});

    fetch("/api/places", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "getPlaceScenes", placeId: place.id }),
    })
      .then((r) => r.json())
      .then(setSceneIds)
      .catch(() => {});
  }, [place.id, place.name, place.description, place.custom_attributes]);

  const handleSave = async () => {
    await onUpdate(place.id, { name, description });
  };

  const handleSaveAttribute = async (key: string, value: string) => {
    const updated = { ...attributes, [key]: value };
    setAttributes(updated);
    await onUpdate(place.id, {
      custom_attributes: updated as Record<string, unknown>,
    });
  };

  const handleDeleteAttribute = async (key: string) => {
    const updated = { ...attributes };
    delete updated[key];
    setAttributes(updated);
    await onUpdate(place.id, {
      custom_attributes: updated as Record<string, unknown>,
    });
  };

  const handleAddAttribute = () => {
    if (!newAttrKey.trim()) return;
    setAttributes((prev) => ({ ...prev, [newAttrKey.trim()]: "" }));
    setNewAttrKey("");
  };

  const handleAddTag = async (tagId: string) => {
    await fetch("/api/tags", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "addToPlace",
        placeId: place.id,
        tagId,
      }),
    });
    setTagIds((prev) => [...prev, tagId]);
  };

  const handleRemoveTag = async (tagId: string) => {
    await fetch("/api/tags", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "removeFromPlace",
        placeId: place.id,
        tagId,
      }),
    });
    setTagIds((prev) => prev.filter((id) => id !== tagId));
  };

  return (
    <div className="w-[380px] shrink-0 border-l border-border bg-background">
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
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={handleSave}
            />
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

          {/* Divider */}
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
                      onChange={(e) =>
                        setAttributes((prev) => ({
                          ...prev,
                          [key]: e.target.value,
                        }))
                      }
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
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAddAttribute();
                }}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={handleAddAttribute}
                disabled={!newAttrKey.trim()}
              >
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

          {/* Divider */}
          <div className="border-t border-border/60" />

          {/* Used In */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-muted-foreground/70">
              Used In
            </label>
            {sceneIds.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                Link this place to scenes from the scene detail panel.
              </p>
            ) : (
              <div className="inline-flex items-center gap-1.5 rounded-full bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-700">
                <MapPin className="h-3 w-3" />
                <span>{sceneIds.length} scene{sceneIds.length !== 1 ? "s" : ""}</span>
              </div>
            )}
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

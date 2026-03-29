"use client";

import { useState, useEffect } from "react";
import { X, Plus, Trash2 } from "lucide-react";

/** Deterministic color for character avatar from name */
function getAvatarColor(name: string): { bg: string; text: string } {
  const COLORS = [
    { bg: "#dbeafe", text: "#1d4ed8" },
    { bg: "#ede9fe", text: "#7c3aed" },
    { bg: "#fce7f3", text: "#be185d" },
    { bg: "#dcfce7", text: "#15803d" },
    { bg: "#fef3c7", text: "#b45309" },
    { bg: "#ffedd5", text: "#c2410c" },
    { bg: "#e0f2fe", text: "#0369a1" },
    { bg: "#f3e8ff", text: "#7e22ce" },
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) | 0;
  return COLORS[Math.abs(hash) % COLORS.length];
}
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { TagPicker } from "@/components/shared/tag-picker";
import type { Character, Tag } from "@/lib/types/database";

interface CharacterDetailProps {
  character: Character;
  projectId: string;
  allTags: Tag[];
  onUpdate: (id: string, data: Partial<Character>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onClose: () => void;
  onTagCreated: (tag: Tag) => void;
}

export function CharacterDetail({
  character,
  projectId,
  allTags,
  onUpdate,
  onDelete,
  onClose,
  onTagCreated,
}: CharacterDetailProps) {
  const [name, setName] = useState(character.name);
  const [description, setDescription] = useState(character.description);
  const [attributes, setAttributes] = useState<Record<string, string>>(
    (character.custom_attributes as Record<string, string>) ?? {}
  );
  const [newAttrKey, setNewAttrKey] = useState("");
  const [tagIds, setTagIds] = useState<string[]>([]);
  const [sceneIds, setSceneIds] = useState<string[]>([]);

  useEffect(() => {
    setName(character.name);
    setDescription(character.description);
    setAttributes(
      (character.custom_attributes as Record<string, string>) ?? {}
    );

    const controller = new AbortController();

    // Fetch tags and scenes
    fetch("/api/tags", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "getCharacterTags", characterId: character.id }),
      signal: controller.signal,
    })
      .then((r) => { if (!r.ok) throw new Error("Failed to fetch tags"); return r.json(); })
      .then(setTagIds)
      .catch((e) => { if (e.name !== "AbortError") console.error("Failed to load character tags:", e); });

    fetch("/api/characters", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "getCharacterScenes", characterId: character.id }),
      signal: controller.signal,
    })
      .then((r) => { if (!r.ok) throw new Error("Failed to fetch scenes"); return r.json(); })
      .then(setSceneIds)
      .catch((e) => { if (e.name !== "AbortError") console.error("Failed to load character scenes:", e); });

    return () => controller.abort();
  }, [character.id]);

  const handleSave = async () => {
    try {
      await onUpdate(character.id, { name, description });
    } catch (e) {
      console.error("Failed to save character:", e);
    }
  };

  const handleSaveAttribute = async (key: string, value: string) => {
    const updated = { ...attributes, [key]: value };
    setAttributes(updated);
    try {
      await onUpdate(character.id, {
        custom_attributes: updated as Record<string, unknown>,
      });
    } catch (e) {
      console.error("Failed to save attribute:", e);
    }
  };

  const handleDeleteAttribute = async (key: string) => {
    const updated = { ...attributes };
    delete updated[key];
    setAttributes(updated);
    try {
      await onUpdate(character.id, {
        custom_attributes: updated as Record<string, unknown>,
      });
    } catch (e) {
      console.error("Failed to delete attribute:", e);
    }
  };

  const handleAddAttribute = () => {
    if (!newAttrKey.trim()) return;
    const key = newAttrKey.trim();
    setAttributes((prev) => ({ ...prev, [key]: "" }));
    setNewAttrKey("");
  };

  const handleAddTag = async (tagId: string) => {
    try {
      const res = await fetch("/api/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "addToCharacter",
          characterId: character.id,
          tagId,
        }),
      });
      if (!res.ok) throw new Error("Failed to add tag");
      setTagIds((prev) => [...prev, tagId]);
    } catch (e) {
      console.error("Failed to add tag:", e);
    }
  };

  const handleRemoveTag = async (tagId: string) => {
    try {
      const res = await fetch("/api/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "removeFromCharacter",
          characterId: character.id,
          tagId,
        }),
      });
      if (!res.ok) throw new Error("Failed to remove tag");
      setTagIds((prev) => prev.filter((id) => id !== tagId));
    } catch (e) {
      console.error("Failed to remove tag:", e);
    }
  };

  const avatarColor = getAvatarColor(character.name);

  return (
    <div className="w-full md:w-[380px] shrink-0 border-l border-border bg-background">
      <div className="flex h-full flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold shadow-sm"
              style={{ backgroundColor: avatarColor.bg, color: avatarColor.text }}
            >
              {character.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">Character</p>
              <h2 className="truncate text-sm font-semibold leading-tight">{character.name}</h2>
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
              placeholder="Who is this character..."
            />
          </div>

          {/* Divider */}
          <div className="border-t border-border/60" />

          {/* Custom Attributes */}
          <div>
            <label className="mb-2.5 block text-xs font-semibold uppercase tracking-widest text-muted-foreground/70">Profile</label>
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
                placeholder="Add field (e.g. Age, Motivation)"
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

          {/* Appears In */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-muted-foreground/70">
              Appears In
            </label>
            {sceneIds.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                Link this character to scenes from the scene detail panel.
              </p>
            ) : (
              <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/8 px-2.5 py-1 text-xs font-semibold text-primary">
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
              if (confirm(`Delete "${character.name}"?`)) onDelete(character.id);
            }}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete character
          </Button>
        </div>
      </div>
    </div>
  );
}

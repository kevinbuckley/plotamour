"use client";

import { useState, useEffect } from "react";
import { X, Plus, Trash2, ChevronDown, ChevronUp } from "lucide-react";

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
import type { Character, CharacterRelation, Tag } from "@/lib/types/database";
import type { SceneMention } from "@/lib/services/characters";

interface CharacterDetailProps {
  character: Character;
  projectId: string;
  allCharacters: Character[];
  allTags: Tag[];
  onUpdate: (id: string, data: Partial<Character>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onClose: () => void;
  onTagCreated: (tag: Tag) => void;
}

async function characterAction(body: Record<string, unknown>) {
  const res = await fetch("/api/characters", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error("API call failed");
  return res.json();
}

export function CharacterDetail({
  character,
  projectId,
  allCharacters,
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

  // Aliases
  const [aliases, setAliases] = useState<string[]>(character.aliases ?? []);
  const [newAlias, setNewAlias] = useState("");

  // Mentions + progression
  const [mentions, setMentions] = useState<SceneMention[]>([]);
  const [mentionsExpanded, setMentionsExpanded] = useState(false);

  // Relations
  const [relations, setRelations] = useState<CharacterRelation[]>([]);
  const [showRelationPicker, setShowRelationPicker] = useState(false);
  const [newRelationTarget, setNewRelationTarget] = useState("");
  const [newRelationType, setNewRelationType] = useState("");

  useEffect(() => {
    setName(character.name);
    setDescription(character.description);
    setAttributes((character.custom_attributes as Record<string, string>) ?? {});
    setAliases(character.aliases ?? []);

    const controller = new AbortController();

    fetch("/api/tags", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "getCharacterTags", characterId: character.id }),
      signal: controller.signal,
    })
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then(setTagIds)
      .catch((e) => { if (e.name !== "AbortError") console.error(e); });

    fetch("/api/characters", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "getCharacterScenesDetailed", characterId: character.id }),
      signal: controller.signal,
    })
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then(setMentions)
      .catch((e) => { if (e.name !== "AbortError") console.error(e); });

    fetch("/api/characters", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "getRelations", characterId: character.id }),
      signal: controller.signal,
    })
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then(setRelations)
      .catch((e) => { if (e.name !== "AbortError") console.error(e); });

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
      await onUpdate(character.id, { custom_attributes: updated as Record<string, unknown> });
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteAttribute = async (key: string) => {
    const updated = { ...attributes };
    delete updated[key];
    setAttributes(updated);
    try {
      await onUpdate(character.id, { custom_attributes: updated as Record<string, unknown> });
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
      await onUpdate(character.id, { custom_attributes: updated as Record<string, unknown> });
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
      await onUpdate(character.id, { aliases: updated });
    } catch (e) {
      console.error(e);
    }
  };

  const handleRemoveAlias = async (alias: string) => {
    const updated = aliases.filter((a) => a !== alias);
    setAliases(updated);
    try {
      await onUpdate(character.id, { aliases: updated });
    } catch (e) {
      console.error(e);
    }
  };

  // ── Tags ─────────────────────────────────────────────────────────────────

  const handleAddTag = async (tagId: string) => {
    try {
      const res = await fetch("/api/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "addToCharacter", characterId: character.id, tagId }),
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
        body: JSON.stringify({ action: "removeFromCharacter", characterId: character.id, tagId }),
      });
      if (!res.ok) throw new Error();
      setTagIds((prev) => prev.filter((id) => id !== tagId));
    } catch (e) {
      console.error(e);
    }
  };

  // ── Relations ────────────────────────────────────────────────────────────

  const handleAddRelation = async () => {
    if (!newRelationTarget || !newRelationType.trim()) return;
    try {
      const relation = await characterAction({
        action: "addRelation",
        fromCharacterId: character.id,
        toCharacterId: newRelationTarget,
        relationType: newRelationType.trim(),
      });
      setRelations((prev) => [...prev, relation]);
      setNewRelationTarget("");
      setNewRelationType("");
      setShowRelationPicker(false);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteRelation = async (id: string) => {
    try {
      await characterAction({ action: "deleteRelation", id });
      setRelations((prev) => prev.filter((r) => r.id !== id));
    } catch (e) {
      console.error(e);
    }
  };

  const getOtherCharacterName = (relation: CharacterRelation) => {
    const otherId =
      relation.from_character_id === character.id
        ? relation.to_character_id
        : relation.from_character_id;
    return allCharacters.find((c) => c.id === otherId)?.name ?? "Unknown";
  };

  // ── Progression (group mentions by chapter) ──────────────────────────────

  const chapterGroups = mentions.reduce<Record<string, { title: string; order: number; count: number }>>(
    (acc, m) => {
      if (!acc[m.chapterId]) {
        acc[m.chapterId] = { title: m.chapterTitle, order: m.chapterOrder, count: 0 };
      }
      acc[m.chapterId].count++;
      return acc;
    },
    {}
  );
  const sortedChapters = Object.entries(chapterGroups).sort(([, a], [, b]) => a.order - b.order);

  const avatarColor = getAvatarColor(character.name);
  const otherCharacters = allCharacters.filter((c) => c.id !== character.id);

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
                placeholder="Add alias or nickname"
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
              placeholder="Who is this character..."
            />
          </div>

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
                placeholder="Add field (e.g. Age, Motivation)"
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

          <div className="border-t border-border/60" />

          {/* Relations */}
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-widest text-muted-foreground/70">Relationships</label>
            <div className="space-y-1.5">
              {relations.map((r) => {
                const otherName = getOtherCharacterName(r);
                const otherColor = getAvatarColor(otherName);
                return (
                  <div key={r.id} className="group flex items-center gap-2 rounded-lg border border-border bg-muted/20 px-3 py-2">
                    <div
                      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold"
                      style={{ backgroundColor: otherColor.bg, color: otherColor.text }}
                    >
                      {otherName.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-xs font-semibold text-foreground">{otherName}</span>
                      {r.relation_type && (
                        <span className="ml-1.5 text-xs text-muted-foreground">· {r.relation_type}</span>
                      )}
                    </div>
                    <button
                      onClick={() => handleDeleteRelation(r.id)}
                      className="shrink-0 rounded p-0.5 text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                );
              })}
            </div>

            {showRelationPicker ? (
              <div className="mt-2 rounded-lg border border-border bg-muted/20 p-3 space-y-2">
                <select
                  value={newRelationTarget}
                  onChange={(e) => setNewRelationTarget(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">Select character…</option>
                  {otherCharacters.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                <Input
                  value={newRelationType}
                  onChange={(e) => setNewRelationType(e.target.value)}
                  placeholder="Relationship type (e.g. Rival, Mentor)"
                  className="text-sm"
                  onKeyDown={(e) => { if (e.key === "Enter") handleAddRelation(); }}
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleAddRelation} disabled={!newRelationTarget || !newRelationType.trim()}>
                    Add
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => { setShowRelationPicker(false); setNewRelationTarget(""); setNewRelationType(""); }}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowRelationPicker(true)}
                className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-primary"
              >
                <Plus className="h-3.5 w-3.5" />
                Add relationship
              </button>
            )}
          </div>

          <div className="border-t border-border/60" />

          {/* Story Presence (progression) */}
          {sortedChapters.length > 0 && (
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-widest text-muted-foreground/70">Story Presence</label>
              <div className="flex flex-wrap gap-1.5">
                {sortedChapters.map(([chapterId, { title, count }]) => (
                  <span
                    key={chapterId}
                    className="inline-flex items-center gap-1 rounded-md bg-primary/8 px-2 py-0.5 text-[11px] font-medium text-primary"
                    title={`${count} scene${count !== 1 ? "s" : ""}`}
                  >
                    {title}
                    {count > 1 && <span className="text-primary/60">×{count}</span>}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Appears In */}
          <div>
            <button
              className="flex w-full items-center justify-between"
              onClick={() => setMentionsExpanded((v) => !v)}
            >
              <label className="cursor-pointer text-xs font-semibold uppercase tracking-widest text-muted-foreground/70">
                Appears In
                {mentions.length > 0 && (
                  <span className="ml-1.5 rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] text-primary">
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
                Link this character to scenes from the scene detail panel.
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

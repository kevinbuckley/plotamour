"use client";

import { useState } from "react";
import { Plus, User, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Character, Tag } from "@/lib/types/database";
import { CharacterDetail } from "./character-detail";

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
    { bg: "#f3e8ff", text: "#7e22ce" }, // purple
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) | 0;
  return COLORS[Math.abs(hash) % COLORS.length];
}

interface CharacterListProps {
  projectId: string;
  initialCharacters: Character[];
  initialTags: Tag[];
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

export function CharacterList({
  projectId,
  initialCharacters,
  initialTags,
}: CharacterListProps) {
  const [characters, setCharacters] = useState(initialCharacters);
  const [tags, setTags] = useState(initialTags);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selectedCharacter = characters.find((c) => c.id === selectedId) ?? null;

  const handleCreate = async () => {
    const character = await characterAction({
      action: "create",
      projectId,
      name: "New Character",
    });
    setCharacters((prev) => [...prev, character]);
    setSelectedId(character.id);
  };

  const handleUpdate = async (id: string, data: Partial<Character>) => {
    const updated = await characterAction({ action: "update", id, data });
    setCharacters((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updated } : c))
    );
  };

  const handleDelete = async (id: string) => {
    await characterAction({ action: "delete", id });
    setCharacters((prev) => prev.filter((c) => c.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  return (
    <div className="flex h-full">
      {/* List */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="mb-5 flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/60">
            {characters.length} Character{characters.length !== 1 ? "s" : ""}
          </p>
          <Button onClick={handleCreate} size="sm" className="gap-1.5">
            <Plus className="h-3.5 w-3.5" />
            New Character
          </Button>
        </div>

        {characters.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/8 shadow-inner">
              <User className="h-8 w-8 text-primary/60" />
            </div>
            <p className="text-base font-bold">No characters yet</p>
            <p className="mt-1.5 max-w-xs text-sm text-muted-foreground">
              Create your first character to start building your story bible.
            </p>
            <Button onClick={handleCreate} className="mt-5 gap-1.5">
              <Plus className="h-4 w-4" />
              New Character
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-4">
            {characters.map((character) => {
              const avatarColor = getAvatarColor(character.name);
              return (
                <button
                  key={character.id}
                  onClick={() => setSelectedId(character.id)}
                  className={`group relative rounded-xl border p-4 text-left transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md ${
                    selectedId === character.id
                      ? "border-primary bg-primary/5 shadow-sm ring-2 ring-primary/15"
                      : "border-border bg-card hover:border-primary/40 hover:shadow-sm"
                  }`}
                >
                  {/* Color avatar */}
                  <div
                    className="mb-3 flex h-12 w-12 items-center justify-center rounded-full text-lg font-bold shadow-sm ring-2 ring-white"
                    style={{ backgroundColor: avatarColor.bg, color: avatarColor.text }}
                  >
                    {character.name.charAt(0).toUpperCase()}
                  </div>
                  <h3 className="truncate text-sm font-semibold">{character.name}</h3>
                  {character.description ? (
                    <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                      {character.description}
                    </p>
                  ) : (
                    <p className="mt-1 text-xs italic text-muted-foreground/30">No description</p>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`Delete "${character.name}"?`)) {
                        handleDelete(character.id);
                      }
                    }}
                    className="absolute right-2 top-2 rounded-md p-1 text-muted-foreground opacity-0 transition-all hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Detail panel */}
      {selectedCharacter && (
        <CharacterDetail
          character={selectedCharacter}
          projectId={projectId}
          allTags={tags}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
          onClose={() => setSelectedId(null)}
          onTagCreated={(tag) => setTags((prev) => [...prev, tag])}
        />
      )}
    </div>
  );
}

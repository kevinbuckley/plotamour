"use client";

import { useState } from "react";
import { Plus, User, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Character, Tag } from "@/lib/types/database";
import { CharacterDetail } from "./character-detail";

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
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {characters.length} character{characters.length !== 1 ? "s" : ""}
          </p>
          <Button onClick={handleCreate} size="sm" className="gap-1.5">
            <Plus className="h-4 w-4" />
            New Character
          </Button>
        </div>

        {characters.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <User className="mb-3 h-10 w-10 text-muted-foreground/50" />
            <p className="text-lg font-semibold">No characters yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Create your first character to start building your story bible.
            </p>
            <Button onClick={handleCreate} className="mt-4 gap-1.5">
              <Plus className="h-4 w-4" />
              New Character
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-4">
            {characters.map((character) => (
              <button
                key={character.id}
                onClick={() => setSelectedId(character.id)}
                className={`group relative rounded-lg border p-4 text-left transition-all hover:shadow-md ${
                  selectedId === character.id
                    ? "border-primary bg-primary/5 shadow-sm"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
                  <User className="h-5 w-5" />
                </div>
                <h3 className="truncate font-medium">{character.name}</h3>
                {character.description && (
                  <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                    {character.description}
                  </p>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm(`Delete "${character.name}"?`)) {
                      handleDelete(character.id);
                    }
                  }}
                  className="absolute right-2 top-2 rounded-md p-1 text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </button>
            ))}
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

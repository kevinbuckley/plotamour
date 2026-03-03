"use client";

import { useState } from "react";
import { Plus, MapPin, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Place, Tag } from "@/lib/types/database";
import { PlaceDetail } from "./place-detail";

interface PlaceListProps {
  projectId: string;
  initialPlaces: Place[];
  initialTags: Tag[];
}

async function placeAction(body: Record<string, unknown>) {
  const res = await fetch("/api/places", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error("API call failed");
  return res.json();
}

export function PlaceList({
  projectId,
  initialPlaces,
  initialTags,
}: PlaceListProps) {
  const [places, setPlaces] = useState(initialPlaces);
  const [tags, setTags] = useState(initialTags);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selectedPlace = places.find((p) => p.id === selectedId) ?? null;

  const handleCreate = async () => {
    const place = await placeAction({
      action: "create",
      projectId,
      name: "New Place",
    });
    setPlaces((prev) => [...prev, place]);
    setSelectedId(place.id);
  };

  const handleUpdate = async (id: string, data: Partial<Place>) => {
    const updated = await placeAction({ action: "update", id, data });
    setPlaces((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updated } : p))
    );
  };

  const handleDelete = async (id: string) => {
    await placeAction({ action: "delete", id });
    setPlaces((prev) => prev.filter((p) => p.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  return (
    <div className="flex h-full">
      {/* List */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {places.length} place{places.length !== 1 ? "s" : ""}
          </p>
          <Button onClick={handleCreate} size="sm" className="gap-1.5">
            <Plus className="h-4 w-4" />
            New Place
          </Button>
        </div>

        {places.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <MapPin className="mb-3 h-10 w-10 text-muted-foreground/50" />
            <p className="text-lg font-semibold">No places yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Create your first place to start building your world.
            </p>
            <Button onClick={handleCreate} className="mt-4 gap-1.5">
              <Plus className="h-4 w-4" />
              New Place
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-4">
            {places.map((place) => (
              <button
                key={place.id}
                onClick={() => setSelectedId(place.id)}
                className={`group relative rounded-lg border p-4 text-left transition-all hover:shadow-md ${
                  selectedId === place.id
                    ? "border-primary bg-primary/5 shadow-sm"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
                  <MapPin className="h-5 w-5" />
                </div>
                <h3 className="truncate font-medium">{place.name}</h3>
                {place.description && (
                  <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                    {place.description}
                  </p>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm(`Delete "${place.name}"?`)) {
                      handleDelete(place.id);
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
      {selectedPlace && (
        <PlaceDetail
          place={selectedPlace}
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

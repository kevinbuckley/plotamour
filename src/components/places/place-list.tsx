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
    try {
      const place = await placeAction({
        action: "create",
        projectId,
        name: "New Place",
      });
      setPlaces((prev) => [...prev, place]);
      setSelectedId(place.id);
    } catch (e) {
      console.error("Failed to create place:", e);
    }
  };

  const handleUpdate = async (id: string, data: Partial<Place>) => {
    try {
      const updated = await placeAction({ action: "update", id, data });
      setPlaces((prev) =>
        prev.map((p) => (p.id === id ? { ...p, ...updated } : p))
      );
    } catch (e) {
      console.error("Failed to update place:", e);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await placeAction({ action: "delete", id });
      setPlaces((prev) => prev.filter((p) => p.id !== id));
      if (selectedId === id) setSelectedId(null);
    } catch (e) {
      console.error("Failed to delete place:", e);
    }
  };

  return (
    <div className="flex h-full">
      {/* List */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="mb-5 flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/60">
            {places.length} Place{places.length !== 1 ? "s" : ""}
          </p>
          <Button onClick={handleCreate} size="sm" className="gap-1.5">
            <Plus className="h-3.5 w-3.5" />
            New Place
          </Button>
        </div>

        {places.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-sky-50 shadow-inner">
              <MapPin className="h-8 w-8 text-sky-500/70" />
            </div>
            <p className="text-base font-bold">No places yet</p>
            <p className="mt-1.5 max-w-xs text-sm text-muted-foreground">
              Create your first place to start building your world.
            </p>
            <Button onClick={handleCreate} className="mt-5 gap-1.5">
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
                className={`group relative rounded-xl border bg-card p-4 text-left transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md ${
                  selectedId === place.id
                    ? "border-sky-400/60 bg-sky-50/50 shadow-sm ring-2 ring-sky-400/15"
                    : "border-border hover:border-sky-300/60 hover:shadow-sm"
                }`}
              >
                {/* Sky-themed place icon */}
                <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-sky-100">
                  <MapPin className="h-5 w-5 text-sky-600" />
                </div>
                <h3 className="truncate text-sm font-semibold">{place.name}</h3>
                {place.description ? (
                  <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                    {place.description}
                  </p>
                ) : (
                  <p className="mt-1 text-xs italic text-muted-foreground/40">No description</p>
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

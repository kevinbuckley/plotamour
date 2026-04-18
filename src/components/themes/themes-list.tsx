"use client";

import { useState } from "react";
import { Plus, Trash2, ChevronDown, ChevronUp, Palette } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import type { ThemeWithCount } from "@/lib/services/themes";
import type { SceneForTheme } from "@/lib/services/themes";

const PRESET_COLORS = [
  "#6366f1", "#8b5cf6", "#ec4899", "#ef4444",
  "#f97316", "#eab308", "#22c55e", "#14b8a6",
  "#3b82f6", "#6b7280",
];

interface ThemesListProps {
  projectId: string;
  initialThemes: ThemeWithCount[];
}

async function themeAction(body: Record<string, unknown>) {
  const res = await fetch("/api/themes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error("API call failed");
  return res.json();
}

export function ThemesList({ projectId, initialThemes }: ThemesListProps) {
  const [themes, setThemes] = useState<ThemeWithCount[]>(initialThemes);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState(PRESET_COLORS[0]);
  const [newDesc, setNewDesc] = useState("");
  const [saving, setSaving] = useState(false);
  const [expandedThemeId, setExpandedThemeId] = useState<string | null>(null);
  const [themeScenes, setThemeScenes] = useState<Record<string, SceneForTheme[]>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState("");
  const [editDesc, setEditDesc] = useState("");

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setSaving(true);
    try {
      const theme = await themeAction({
        action: "create",
        projectId,
        name: newName.trim(),
        color: newColor,
        description: newDesc.trim(),
      });
      setThemes((prev) => [...prev, { ...theme, scene_count: 0 }]);
      setNewName("");
      setNewColor(PRESET_COLORS[0]);
      setNewDesc("");
      setCreating(false);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this theme? Scenes tagged with it will be untagged.")) return;
    try {
      await themeAction({ action: "delete", id });
      setThemes((prev) => prev.filter((t) => t.id !== id));
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleExpand = async (themeId: string) => {
    if (expandedThemeId === themeId) {
      setExpandedThemeId(null);
      return;
    }
    setExpandedThemeId(themeId);
    if (!themeScenes[themeId]) {
      try {
        const scenes = await themeAction({ action: "getThemeScenes", themeId });
        setThemeScenes((prev) => ({ ...prev, [themeId]: scenes }));
      } catch (e) {
        console.error(e);
      }
    }
  };

  const startEdit = (theme: ThemeWithCount) => {
    setEditingId(theme.id);
    setEditName(theme.name);
    setEditColor(theme.color);
    setEditDesc(theme.description);
  };

  const handleSaveEdit = async (id: string) => {
    try {
      const updated = await themeAction({
        action: "update",
        id,
        data: { name: editName, color: editColor, description: editDesc },
      });
      setThemes((prev) =>
        prev.map((t) => (t.id === id ? { ...updated, scene_count: t.scene_count } : t))
      );
      setEditingId(null);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="flex h-full flex-col">
      {/* Header bar */}
      <div className="flex items-center justify-between border-b border-border/60 px-4 py-3 sm:px-6">
        <p className="text-sm text-muted-foreground">
          {themes.length} {themes.length === 1 ? "theme" : "themes"}
        </p>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setCreating((v) => !v)}
          className="gap-1.5"
        >
          <Plus className="h-3.5 w-3.5" />
          New Theme
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3">
        {/* Create form */}
        {creating && (
          <div className="rounded-xl border border-primary/30 bg-primary/4 p-4 space-y-3">
            <p className="text-sm font-semibold">New Theme</p>
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. Redemption, Power vs. Corruption"
              onKeyDown={(e) => { if (e.key === "Enter") handleCreate(); }}
              autoFocus
            />
            <Textarea
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              placeholder="Brief description (optional)"
              rows={2}
            />
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground/70">Color</p>
              <div className="flex flex-wrap gap-2">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setNewColor(c)}
                    className="h-6 w-6 rounded-full border-2 transition-transform hover:scale-110"
                    style={{
                      backgroundColor: c,
                      borderColor: newColor === c ? "white" : c,
                      outline: newColor === c ? `2px solid ${c}` : "none",
                      outlineOffset: "2px",
                    }}
                  />
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleCreate} disabled={!newName.trim() || saving}>
                {saving ? "Creating…" : "Create"}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => { setCreating(false); setNewName(""); setNewDesc(""); }}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Theme list */}
        {themes.length === 0 && !creating && (
          <div className="py-20 text-center text-sm text-muted-foreground">
            <Palette className="mx-auto mb-3 h-8 w-8 opacity-30" />
            <p>No themes yet.</p>
            <p className="text-xs mt-1">Track recurring motifs, symbols, and themes across your story.</p>
          </div>
        )}

        {themes.map((theme) => (
          <div
            key={theme.id}
            className="overflow-hidden rounded-xl border border-border bg-card shadow-sm"
          >
            {/* Theme header */}
            <div className="flex items-center gap-3 px-4 py-3">
              <div
                className="h-3 w-3 shrink-0 rounded-full"
                style={{ backgroundColor: theme.color }}
              />

              {editingId === theme.id ? (
                <div className="flex-1 space-y-2">
                  <div className="flex gap-2">
                    <Input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="text-sm font-semibold"
                      autoFocus
                    />
                    <div className="flex gap-1">
                      <Button size="sm" onClick={() => handleSaveEdit(theme.id)}>Save</Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>Cancel</Button>
                    </div>
                  </div>
                  <Textarea
                    value={editDesc}
                    onChange={(e) => setEditDesc(e.target.value)}
                    placeholder="Description"
                    rows={2}
                  />
                  <div className="flex flex-wrap gap-1.5">
                    {PRESET_COLORS.map((c) => (
                      <button
                        key={c}
                        onClick={() => setEditColor(c)}
                        className="h-5 w-5 rounded-full border-2"
                        style={{
                          backgroundColor: c,
                          borderColor: editColor === c ? "white" : c,
                          outline: editColor === c ? `2px solid ${c}` : "none",
                          outlineOffset: "1px",
                        }}
                      />
                    ))}
                  </div>
                </div>
              ) : (
                <>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold leading-tight">{theme.name}</p>
                    {theme.description && (
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                        {theme.description}
                      </p>
                    )}
                  </div>

                  <span
                    className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold text-white"
                    style={{ backgroundColor: theme.color }}
                  >
                    {theme.scene_count} {theme.scene_count === 1 ? "scene" : "scenes"}
                  </span>

                  <button
                    onClick={() => startEdit(theme)}
                    className="shrink-0 rounded-md p-1 text-muted-foreground/40 transition-colors hover:bg-muted hover:text-muted-foreground"
                  >
                    <Palette className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(theme.id)}
                    className="shrink-0 rounded-md p-1 text-muted-foreground/40 transition-colors hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                  {theme.scene_count > 0 && (
                    <button
                      onClick={() => handleToggleExpand(theme.id)}
                      className="shrink-0 rounded-md p-1 text-muted-foreground/40 transition-colors hover:bg-muted hover:text-muted-foreground"
                    >
                      {expandedThemeId === theme.id ? (
                        <ChevronUp className="h-3.5 w-3.5" />
                      ) : (
                        <ChevronDown className="h-3.5 w-3.5" />
                      )}
                    </button>
                  )}
                </>
              )}
            </div>

            {/* Expanded scene list */}
            {expandedThemeId === theme.id && themeScenes[theme.id] && (
              <div className="border-t border-border/60 p-3 space-y-1.5">
                {themeScenes[theme.id].length === 0 ? (
                  <p className="text-xs text-muted-foreground px-2">No scenes yet.</p>
                ) : (
                  themeScenes[theme.id].map((scene) => (
                    <div
                      key={scene.sceneId}
                      className="flex items-center gap-2 rounded-lg bg-muted/30 px-3 py-2"
                    >
                      <div
                        className="h-2 w-2 shrink-0 rounded-full"
                        style={{ backgroundColor: scene.plotlineColor }}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium truncate">{scene.sceneTitle}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {scene.chapterTitle} · {scene.plotlineTitle}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

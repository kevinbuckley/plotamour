"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { TemplateBrowser } from "@/components/templates/template-browser";
import type { TemplateDefinition } from "@/lib/data/templates";
import type { ProjectType } from "@/lib/types/database";

type Step = "details" | "template";

export default function NewProjectPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("details");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [projectType, setProjectType] = useState<ProjectType>("standalone");
  const [loading, setLoading] = useState(false);

  const handleDetailsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setStep("template");
  };

  const handleCreateProject = async (template?: TemplateDefinition) => {
    setLoading(true);
    try {
      // Create project
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          projectType,
        }),
      });

      if (!res.ok) throw new Error("Failed to create project");

      const { projectId, bookId } = await res.json();

      // Apply template if selected
      if (template) {
        await fetch("/api/templates", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "apply",
            bookId,
            templateId: template.id,
          }),
        });
      }

      router.push(`/project/${projectId}/timeline?bookId=${bookId}`);
    } catch {
      setLoading(false);
    }
  };

  if (step === "template") {
    return (
      <div className="mx-auto max-w-4xl p-8">
        {loading ? (
          <div className="flex flex-col items-center gap-3 py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <p className="text-sm text-muted-foreground">
              Creating your project...
            </p>
          </div>
        ) : (
          <TemplateBrowser
            onSelect={(template) => handleCreateProject(template)}
            onSkip={() => handleCreateProject()}
          />
        )}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg p-8">
      <h1 className="text-2xl font-bold tracking-tight">
        Create a new project
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Start planning your next story.
      </p>

      <form onSubmit={handleDetailsSubmit} className="mt-8 space-y-4">
        <div>
          <label
            htmlFor="title"
            className="mb-1.5 block text-sm font-medium"
          >
            Project title
          </label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="My Amazing Novel"
            required
            autoFocus
          />
        </div>

        <div>
          <label
            htmlFor="description"
            className="mb-1.5 block text-sm font-medium"
          >
            Description{" "}
            <span className="text-muted-foreground">(optional)</span>
          </label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="A brief description of your story..."
            rows={3}
          />
        </div>

        {/* Project type selector */}
        <div>
          <label className="mb-2 block text-sm font-medium">
            Project type
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setProjectType("standalone")}
              className={`rounded-lg border p-3 text-left transition-all ${
                projectType === "standalone"
                  ? "border-primary bg-primary/5 ring-1 ring-primary"
                  : "border-border hover:border-primary/50"
              }`}
            >
              <h3 className="text-sm font-medium">Standalone</h3>
              <p className="mt-0.5 text-xs text-muted-foreground">
                A single book
              </p>
            </button>
            <button
              type="button"
              onClick={() => setProjectType("series")}
              className={`rounded-lg border p-3 text-left transition-all ${
                projectType === "series"
                  ? "border-primary bg-primary/5 ring-1 ring-primary"
                  : "border-border hover:border-primary/50"
              }`}
            >
              <h3 className="text-sm font-medium">Series</h3>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Multiple books, shared world
              </p>
            </button>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <Button type="submit" disabled={!title.trim()}>
            Next: Choose Template
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => router.back()}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}

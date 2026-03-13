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
      {/* Page header with icon */}
      <div className="mb-8 flex items-center gap-4">
        <div className="relative">
          <div
            className="absolute inset-0 rounded-xl blur-lg"
            style={{ background: "oklch(0.488 0.183 274.376 / 0.15)" }}
          />
          <div className="relative flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 shadow-md ring-1 ring-primary/10">
            <svg className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
            </svg>
          </div>
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">New project</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Start planning your next story.
          </p>
        </div>
      </div>

      <form onSubmit={handleDetailsSubmit} className="space-y-5">
        <div>
          <label
            htmlFor="title"
            className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-muted-foreground/70"
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
            className="rounded-xl"
          />
        </div>

        <div>
          <label
            htmlFor="description"
            className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-muted-foreground/70"
          >
            Description{" "}
            <span className="normal-case font-normal tracking-normal text-muted-foreground/50">(optional)</span>
          </label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="A brief description of your story..."
            rows={3}
            className="rounded-xl resize-none"
          />
        </div>

        {/* Project type selector */}
        <div>
          <label className="mb-2 block text-xs font-semibold uppercase tracking-widest text-muted-foreground/70">
            Project type
          </label>
          <div className="grid grid-cols-2 gap-3">
            {([
              { value: "standalone", title: "Standalone", desc: "A single, self-contained book", emoji: "📖" },
              { value: "series", title: "Series", desc: "Multiple books, shared world", emoji: "📚" },
            ] as const).map(({ value, title: t, desc, emoji }) => (
              <button
                key={value}
                type="button"
                onClick={() => setProjectType(value)}
                className={`relative rounded-xl border bg-card p-4 text-left transition-all duration-150 ${
                  projectType === value
                    ? "border-primary bg-primary/5 ring-2 ring-primary/15 shadow-sm"
                    : "border-border hover:border-primary/40 hover:shadow-sm"
                }`}
              >
                {projectType === value && (
                  <div className="absolute right-3 top-3 flex h-4 w-4 items-center justify-center rounded-full bg-primary shadow-sm">
                    <svg className="h-2.5 w-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
                <div className="mb-2 text-xl">{emoji}</div>
                <h3 className="text-sm font-semibold">{t}</h3>
                <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                  {desc}
                </p>
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-3 pt-1">
          <Button type="submit" disabled={!title.trim()} className="gap-1.5">
            Next: Choose Template
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => router.back()}
            className="text-muted-foreground hover:text-foreground"
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}

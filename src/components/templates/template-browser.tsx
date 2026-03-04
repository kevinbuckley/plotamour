"use client";

import { useState } from "react";
import { BUILT_IN_TEMPLATES } from "@/lib/data/templates";
import type { TemplateDefinition } from "@/lib/data/templates";
import { TemplatePreview } from "./template-preview";

interface TemplateBrowserProps {
  onSelect: (template: TemplateDefinition) => void;
  onSkip: () => void;
}

export function TemplateBrowser({ onSelect, onSkip }: TemplateBrowserProps) {
  const [previewTemplate, setPreviewTemplate] =
    useState<TemplateDefinition | null>(null);

  if (previewTemplate) {
    return (
      <TemplatePreview
        template={previewTemplate}
        onApply={() => onSelect(previewTemplate)}
        onBack={() => setPreviewTemplate(null)}
      />
    );
  }

  return (
    <div>
      <h2 className="text-xl font-semibold tracking-tight">
        Choose a Story Structure
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Start with a proven plot framework, or skip to start from scratch.
      </p>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {BUILT_IN_TEMPLATES.map((template) => (
          <button
            key={template.id}
            onClick={() => setPreviewTemplate(template)}
            className="group rounded-lg border border-border bg-card p-4 text-left transition-all hover:border-primary hover:shadow-sm"
          >
            <h3 className="font-semibold group-hover:text-primary">
              {template.name}
            </h3>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {template.author}
            </p>
            <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
              {template.description}
            </p>
            <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
              <span>{template.chapters.length} chapters</span>
              <span>&middot;</span>
              <span>
                {template.plotlines.length} plotline
                {template.plotlines.length > 1 ? "s" : ""}
              </span>
            </div>
          </button>
        ))}
      </div>

      <div className="mt-6 flex justify-center">
        <button
          onClick={onSkip}
          className="text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          Skip — start with a blank timeline
        </button>
      </div>
    </div>
  );
}

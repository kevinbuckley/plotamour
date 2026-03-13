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
      <h2 className="text-2xl font-bold tracking-tight">
        Choose a Story Structure
      </h2>
      <p className="mt-1.5 text-sm text-muted-foreground">
        Start with a proven plot framework, or skip to begin with a blank timeline.
      </p>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {BUILT_IN_TEMPLATES.map((template) => (
          <button
            key={template.id}
            onClick={() => setPreviewTemplate(template)}
            className="group overflow-hidden rounded-xl border border-border bg-card text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-[0_8px_20px_oklch(0.488_0.183_274.376/0.08)]"
          >
            {/* Plotline color strip */}
            <div
              className="h-1 w-full"
              style={{
                background: template.plotlines.length > 0
                  ? `linear-gradient(90deg, ${template.plotlines.slice(0, 4).map((p) => p.color).join(", ")})`
                  : "oklch(0.888 0.006 285)",
              }}
            />
            <div className="p-4">
              <h3 className="font-semibold tracking-tight transition-colors group-hover:text-primary">
                {template.name}
              </h3>
              <p className="mt-0.5 text-xs font-medium text-muted-foreground/70">
                by {template.author}
              </p>
              <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                {template.description}
              </p>
              <div className="mt-3 flex items-center gap-2">
                <span className="rounded-full bg-primary/8 px-2 py-0.5 text-[11px] font-semibold text-primary">
                  {template.chapters.length} chapters
                </span>
                <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                  {template.plotlines.length} plotline{template.plotlines.length > 1 ? "s" : ""}
                </span>
              </div>
              {/* Mini plotline preview dots */}
              {template.plotlines.length > 0 && (
                <div className="mt-2.5 flex items-center gap-1.5">
                  {template.plotlines.slice(0, 6).map((p, i) => (
                    <div
                      key={i}
                      className="h-2 w-2 rounded-full shadow-sm"
                      style={{ backgroundColor: p.color }}
                      title={p.title}
                    />
                  ))}
                  {template.plotlines.length > 6 && (
                    <span className="text-[10px] text-muted-foreground/60">+{template.plotlines.length - 6}</span>
                  )}
                </div>
              )}
            </div>
          </button>
        ))}
      </div>

      <div className="mt-8 flex justify-center">
        <button
          onClick={onSkip}
          className="rounded-xl border border-dashed border-border px-6 py-2.5 text-sm text-muted-foreground transition-all hover:border-primary/40 hover:bg-primary/5 hover:text-foreground"
        >
          Skip — start with a blank timeline →
        </button>
      </div>
    </div>
  );
}

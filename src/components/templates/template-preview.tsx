"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import type { TemplateDefinition } from "@/lib/data/templates";

interface TemplatePreviewProps {
  template: TemplateDefinition;
  onApply: () => void;
  onBack: () => void;
}

export function TemplatePreview({
  template,
  onApply,
  onBack,
}: TemplatePreviewProps) {
  return (
    <div>
      <button
        onClick={onBack}
        className="mb-4 flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to templates
      </button>

      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">
            {template.name}
          </h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            by {template.author}
          </p>
        </div>
        <Button onClick={onApply}>Use this template</Button>
      </div>

      <p className="mt-3 text-sm text-muted-foreground">
        {template.description}
      </p>

      {/* Plotlines */}
      <div className="mt-6">
        <h3 className="mb-2 text-sm font-medium">
          Plotlines ({template.plotlines.length})
        </h3>
        <div className="flex flex-wrap gap-2">
          {template.plotlines.map((p, i) => (
            <div
              key={i}
              className="flex items-center gap-2 rounded-full border border-border px-3 py-1"
            >
              <div
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: p.color }}
              />
              <span className="text-sm">{p.title}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Timeline visual */}
      <div className="mt-6">
        <h3 className="mb-3 text-sm font-medium">
          Chapters ({template.chapters.length})
        </h3>
        <div className="space-y-2">
          {template.chapters.map((ch, i) => (
            <div
              key={i}
              className="rounded-lg border border-border bg-card p-3"
            >
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                  {i + 1}
                </span>
                <h4 className="text-sm font-medium">{ch.title}</h4>
              </div>
              <p className="mt-1.5 pl-8 text-sm text-muted-foreground">
                {ch.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 flex gap-3">
        <Button onClick={onApply}>Use this template</Button>
        <Button variant="ghost" onClick={onBack}>
          Back
        </Button>
      </div>
    </div>
  );
}

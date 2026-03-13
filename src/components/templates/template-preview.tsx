"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeft, Sparkles } from "lucide-react";
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
      {/* Back nav */}
      <button
        onClick={onBack}
        className="mb-5 inline-flex items-center gap-1.5 rounded-md px-1 py-0.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to templates
      </button>

      {/* Header card */}
      <div className="mb-6 overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <div
          className="h-1.5 w-full"
          style={{
            background: template.plotlines.length > 0
              ? `linear-gradient(90deg, ${template.plotlines.map((p) => p.color).join(", ")})`
              : "oklch(0.488 0.183 274.376)",
          }}
        />
        <div className="flex items-start justify-between p-5">
          <div>
            <h2 className="text-xl font-bold tracking-tight">{template.name}</h2>
            <p className="mt-0.5 text-xs font-medium text-muted-foreground/70">
              by {template.author}
            </p>
            <p className="mt-2.5 max-w-lg text-sm leading-relaxed text-muted-foreground">
              {template.description}
            </p>
          </div>
          <Button onClick={onApply} className="ml-4 shrink-0 gap-1.5">
            <Sparkles className="h-3.5 w-3.5" />
            Use this template
          </Button>
        </div>
      </div>

      {/* Plotlines */}
      <div className="mb-6">
        <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/60">
          Plotlines ({template.plotlines.length})
        </p>
        <div className="flex flex-wrap gap-2">
          {template.plotlines.map((p, i) => (
            <div
              key={i}
              className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1 shadow-sm"
              style={{ borderLeftColor: p.color, borderLeftWidth: "3px" }}
            >
              <div
                className="h-2 w-2 rounded-full shadow-sm"
                style={{ backgroundColor: p.color }}
              />
              <span className="text-sm font-medium">{p.title}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Chapters */}
      <div>
        <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/60">
          Chapters ({template.chapters.length})
        </p>
        <div className="space-y-2">
          {template.chapters.map((ch, i) => (
            <div
              key={i}
              className="flex items-start gap-3 rounded-xl border border-border bg-card p-3.5 shadow-sm transition-colors hover:bg-muted/30"
            >
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/12 text-[11px] font-bold text-primary">
                {i + 1}
              </span>
              <div>
                <h4 className="text-sm font-semibold leading-snug">{ch.title}</h4>
                {ch.description && (
                  <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                    {ch.description}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer CTA */}
      <div className="mt-8 flex gap-3">
        <Button onClick={onApply} className="gap-1.5">
          <Sparkles className="h-3.5 w-3.5" />
          Use this template
        </Button>
        <Button variant="ghost" onClick={onBack}>
          Back
        </Button>
      </div>
    </div>
  );
}

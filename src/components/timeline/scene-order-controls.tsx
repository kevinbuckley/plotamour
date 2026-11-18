"use client";

import { useEffect, useRef } from "react";
import { ArrowUp, ArrowDown } from "lucide-react";

interface SceneOrderControlsProps {
  title: string;
  first: boolean;
  last: boolean;
  pending: boolean;
  onMove: (direction: -1 | 1) => void;
}

export function SceneOrderControls({ title, first, last, pending, onMove }: SceneOrderControlsProps) {
  const container = useRef<HTMLDivElement>(null);
  const up = useRef<HTMLButtonElement>(null);
  const down = useRef<HTMLButtonElement>(null);
  const restoreFocus = useRef<-1 | 1 | null>(null);
  useEffect(() => {
    if (pending || restoreFocus.current === null) return;
    const preferred = restoreFocus.current === -1 ? up.current : down.current;
    const alternative = restoreFocus.current === -1 ? down.current : up.current;
    (preferred && !preferred.disabled ? preferred : alternative && !alternative.disabled ? alternative : container.current)?.focus();
    restoreFocus.current = null;
  }, [pending, first, last]);
  const move = (direction: -1 | 1) => {
    restoreFocus.current = direction;
    onMove(direction);
  };
  return (
    <div ref={container} tabIndex={-1} className="flex shrink-0 gap-0.5">
      <button ref={up} type="button" aria-label={`Move ${title} up`} disabled={first || pending}
        onClick={() => move(-1)}
        className="rounded p-1 text-muted-foreground hover:bg-muted focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-30">
        <ArrowUp className="h-3.5 w-3.5" />
      </button>
      <button ref={down} type="button" aria-label={`Move ${title} down`} disabled={last || pending}
        onClick={() => move(1)}
        className="rounded p-1 text-muted-foreground hover:bg-muted focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-30">
        <ArrowDown className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

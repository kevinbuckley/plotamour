"use client";

import { useDroppable } from "@dnd-kit/core";
import { cn } from "@/lib/utils/cn";

interface DroppableCellProps {
  chapterId: string;
  plotlineId: string;
  isOver: boolean;
  children: React.ReactNode;
}

export function DroppableCell({
  chapterId,
  plotlineId,
  children,
}: DroppableCellProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: `cell-${chapterId}-${plotlineId}`,
    data: {
      type: "cell",
      chapterId,
      plotlineId,
    },
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "group/cell flex min-h-[100px] flex-col gap-1 rounded-md border border-dashed p-1.5 transition-colors",
        isOver
          ? "border-primary/60 bg-primary/6 shadow-sm"
          : "border-transparent hover:border-border/60 hover:bg-muted/20"
      )}
    >
      {children}
    </div>
  );
}

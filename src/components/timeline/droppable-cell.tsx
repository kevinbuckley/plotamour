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
        "group/cell flex min-h-[100px] flex-col gap-1.5 rounded-xl border border-dashed p-1.5 transition-all duration-150",
        isOver
          ? "border-primary/50 bg-primary/8 shadow-[inset_0_0_0_1px_oklch(0.488_0.183_274.376/0.15)] shadow-sm"
          : "border-transparent hover:border-border/50 hover:bg-muted/25"
      )}
    >
      {children}
    </div>
  );
}

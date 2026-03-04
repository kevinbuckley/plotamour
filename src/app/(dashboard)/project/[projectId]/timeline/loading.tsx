import { TimelineSkeleton } from "@/components/shared/skeleton";

export default function TimelineLoading() {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-border px-6 py-3">
        <div>
          <div className="h-5 w-32 animate-pulse rounded bg-muted" />
          <div className="mt-1 h-3 w-16 animate-pulse rounded bg-muted" />
        </div>
      </div>
      <div className="flex-1 overflow-auto">
        <TimelineSkeleton />
      </div>
    </div>
  );
}

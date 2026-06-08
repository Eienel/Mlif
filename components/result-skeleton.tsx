// Skeleton shaped like a result card. Shown while identifying. No spinners.
export function ResultSkeleton() {
  return (
    <div className="overflow-hidden rounded-card border border-hairline bg-surface shadow-warm">
      <div className="flex flex-col gap-5 p-5 sm:flex-row sm:p-6">
        <div className="aspect-[2/3] w-28 shrink-0 animate-pulse rounded-input bg-surface-2 sm:w-36" />
        <div className="flex-1 space-y-3">
          <div className="h-6 w-2/3 animate-pulse rounded bg-surface-2" />
          <div className="h-4 w-full animate-pulse rounded bg-surface-2" />
          <div className="h-4 w-4/5 animate-pulse rounded bg-surface-2" />
          <div className="mt-5 flex gap-2">
            <div className="h-8 w-24 animate-pulse rounded-full bg-surface-2" />
            <div className="h-8 w-24 animate-pulse rounded-full bg-surface-2" />
            <div className="h-8 w-20 animate-pulse rounded-full bg-surface-2" />
          </div>
        </div>
      </div>
    </div>
  );
}

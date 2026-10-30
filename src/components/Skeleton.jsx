// Grey placeholder shapes shown while things load
export function CardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl bg-plum" aria-hidden="true">
      <div className="aspect-[2/3] animate-pulse bg-velvet" />
      <div className="space-y-2.5 p-3">
        <div className="h-5 w-3/4 animate-pulse rounded bg-velvet" />
        <div className="h-4 w-1/2 animate-pulse rounded bg-velvet/70" />
        <div className="h-4 w-2/3 animate-pulse rounded bg-velvet/70" />
        <div className="mt-3 h-10 animate-pulse rounded-full bg-velvet" />
      </div>
    </div>
  );
}

export function CardGridSkeleton({ count = 8 }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4" role="status" aria-label="Loading your list">
      {Array.from({ length: count }, (_, i) => <CardSkeleton key={i} />)}
    </div>
  );
}

export function Lines({ rows = 3 }) {
  const widths = ['w-full', 'w-11/12', 'w-2/3', 'w-5/6'];
  return (
    <div className="space-y-2.5" role="status" aria-label="Loading">
      {Array.from({ length: rows }, (_, i) => <div key={i} className={`h-3.5 animate-pulse rounded bg-velvet ${widths[i % widths.length]}`} />)}
    </div>
  );
}

export function EpisodeSkeleton({ rows = 3 }) {
  return (
    <div className="space-y-3 p-3" role="status" aria-label="Loading episodes">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex gap-3">
          <div className="h-[54px] w-24 shrink-0 animate-pulse rounded-lg bg-velvet" />
          <div className="flex-1 space-y-2 pt-1">
            <div className="h-3.5 w-1/2 animate-pulse rounded bg-velvet" />
            <div className="h-3 w-full animate-pulse rounded bg-velvet/70" />
          </div>
        </div>
      ))}
    </div>
  );
}

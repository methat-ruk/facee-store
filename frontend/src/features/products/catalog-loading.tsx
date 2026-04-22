export function CatalogLoading() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="overflow-hidden rounded-[1.75rem] border border-border bg-white/80 p-4 shadow-sm"
          >
            <div className="h-48 animate-pulse rounded-2xl bg-accent-soft/70" />
            <div className="mt-4 h-4 animate-pulse rounded bg-accent-soft/50" />
            <div className="mt-3 h-4 w-2/3 animate-pulse rounded bg-accent-soft/40" />
            <div className="mt-6 h-4 w-1/2 animate-pulse rounded bg-accent-soft/50" />
          </div>
        ))}
      </div>
    </div>
  );
}

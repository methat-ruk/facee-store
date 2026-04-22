import { Skeleton } from '@/components/ui/skeleton';

export function CatalogLoading() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <div
          key={index}
          className="overflow-hidden rounded-[1.75rem] border border-border bg-card/90 p-4 shadow-sm"
        >
          <Skeleton className="h-48 rounded-2xl" />
          <Skeleton className="mt-4 h-4 w-24" />
          <Skeleton className="mt-3 h-5 w-2/3" />
          <Skeleton className="mt-6 h-4 w-1/2" />
        </div>
      ))}
    </div>
  );
}

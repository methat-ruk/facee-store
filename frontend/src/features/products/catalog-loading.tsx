import { Skeleton } from '@/components/ui/skeleton';

export function CatalogLoading() {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {Array.from({ length: 12 }).map((_, index) => (
        <div
          key={index}
          className="overflow-hidden rounded-[1.25rem] border border-border/70 bg-card/92 p-3 shadow-sm"
        >
          <Skeleton className="aspect-[4/5] rounded-[1rem]" />
          <Skeleton className="mt-3 h-4 w-4/5" />
          <Skeleton className="mt-2 h-4 w-2/5" />
          <Skeleton className="mt-3 h-5 w-1/2" />
        </div>
      ))}
    </div>
  );
}

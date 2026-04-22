import { cn } from '@/lib/utils';

type BrandWordmarkProps = {
  className?: string;
  compact?: boolean;
};

export function BrandWordmark({
  className,
  compact = false,
}: BrandWordmarkProps) {
  return (
    <div className={cn('inline-flex items-end gap-2.5', className)}>
      <p
        className={cn(
          'text-[1.2rem] font-semibold uppercase tracking-[0.3em] text-foreground sm:text-[1.3rem]',
          compact && 'text-[1.02rem] sm:text-[1.08rem]',
        )}
      >
        Facee
      </p>
      <p
        className={cn(
          'pb-0.5 text-[0.62rem] font-medium uppercase tracking-[0.2em] text-muted-foreground',
          compact && 'text-[0.58rem]',
        )}
      >
        Skincare Store
      </p>
    </div>
  );
}

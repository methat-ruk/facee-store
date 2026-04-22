'use client';

import { useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

type ProductAvailabilityBadgeProps = {
  stock: number;
};

export function ProductAvailabilityBadge({
  stock,
}: ProductAvailabilityBadgeProps) {
  const t = useTranslations('products');

  if (stock === 0) {
    return (
      <Badge className="border-rose-200 bg-rose-100 text-rose-700 hover:bg-rose-100">
        {t('stockOut')}
      </Badge>
    );
  }

  return (
    <Badge
      className={cn(
        stock <= 10
          ? 'border-amber-200 bg-amber-100 text-amber-800 hover:bg-amber-100'
          : 'border-emerald-200 bg-emerald-100 text-emerald-800 hover:bg-emerald-100',
      )}
    >
      {stock <= 10 ? t('stockLow') : t('stockIn')}
    </Badge>
  );
}

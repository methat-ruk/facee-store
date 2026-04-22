'use client';

import { useTranslations } from 'next-intl';
import { Card, CardContent } from '@/components/ui/card';

type CatalogEmptyStateProps = {
  categoryLabel?: string;
};

export function CatalogEmptyState({ categoryLabel }: CatalogEmptyStateProps) {
  const t = useTranslations('products');

  return (
    <Card className="border-dashed bg-card/80 text-center shadow-sm">
      <CardContent className="px-6 py-14">
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-muted-foreground">
          {t('emptyEyebrow')}
        </p>
        <h2 className="mt-4 text-2xl font-semibold text-foreground">
          {t('emptyTitle')}
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-muted-foreground">
          {categoryLabel
            ? t('emptyCategory', { category: categoryLabel })
            : t('emptyDefault')}
        </p>
      </CardContent>
    </Card>
  );
}

'use client';

import { useTranslations } from 'next-intl';
import { Card, CardContent } from '@/components/ui/card';

type CatalogErrorStateProps = {
  message: string;
};

export function CatalogErrorState({ message }: CatalogErrorStateProps) {
  const t = useTranslations('products');

  return (
    <Card className="border-rose-200 bg-rose-50/85 shadow-sm dark:border-rose-900 dark:bg-rose-950/25">
      <CardContent className="px-6 py-10 text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-rose-500">
          {t('errorEyebrow')}
        </p>
        <p className="mt-4 text-sm leading-7 text-rose-700 dark:text-rose-200">
          {message}
        </p>
      </CardContent>
    </Card>
  );
}

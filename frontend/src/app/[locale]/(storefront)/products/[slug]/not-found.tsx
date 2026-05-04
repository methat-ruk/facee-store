import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';

export default async function ProductDetailNotFound() {
  const t = await getTranslations('products');

  return (
    <main className="mx-auto flex min-h-[calc(100svh-18rem)] w-full max-w-5xl items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="flex max-w-2xl flex-col items-center gap-6 text-center">
        <div className="space-y-3">
          <p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            {t('notFoundEyebrow')}
          </p>
          <h1 className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
            {t('notFoundTitle')}
          </h1>
          <p className="leading-8 text-muted-foreground">
            {t('notFoundDescription')}
          </p>
        </div>

        <Button asChild size="lg">
          <Link href="/products">{t('backToCatalog')}</Link>
        </Button>
      </div>
    </main>
  );
}

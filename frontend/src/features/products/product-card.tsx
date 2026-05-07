'use client';

import Image from 'next/image';
import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { ProductAvailabilityBadge } from '@/components/shared/product-availability-badge';
import { Card, CardContent } from '@/components/ui/card';
import { formatOrderPrice } from '@/features/orders/ui';
import { shouldBypassNextImageOptimization } from '@/lib/image';
import { getLocalizedProduct } from './localized-content';
import type { Product } from './schemas';

type ProductCardProps = {
  product: Product;
  eagerImage?: boolean;
};

export function ProductCard({ product, eagerImage = false }: ProductCardProps) {
  const locale = useLocale();
  const t = useTranslations('products');
  const localizedProduct = getLocalizedProduct(product, locale);
  const hasDiscount =
    localizedProduct.compareAtPrice !== null &&
    localizedProduct.compareAtPrice > localizedProduct.price;

  return (
    <Card className="group h-full gap-0 overflow-hidden border-border/80 bg-card/92 py-0 shadow-[0_24px_70px_rgba(132,83,60,0.1)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_30px_90px_rgba(132,83,60,0.16)]">
      <Link
        href={`/products/${localizedProduct.slug}`}
        className="relative block h-76 cursor-pointer overflow-hidden bg-[linear-gradient(180deg,#fff3ea_0%,#f7ddd0_100%)]"
      >
        {localizedProduct.isFlashSale ? (
          <div className="absolute top-3 left-3 z-10 rounded-full bg-[#9f2f24] px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-white shadow-[0_12px_30px_rgba(159,47,36,0.28)]">
            {t('flashSale')}
          </div>
        ) : null}
        {localizedProduct.imageUrl ? (
          <Image
            src={localizedProduct.imageUrl}
            alt={localizedProduct.name}
            fill
            priority={eagerImage}
            unoptimized={shouldBypassNextImageOptimization(
              localizedProduct.imageUrl,
            )}
            sizes="(min-width: 1280px) 360px, (min-width: 640px) calc(50vw - 2.5rem), calc(100vw - 3rem)"
            className="cursor-pointer object-cover object-top transition duration-500 group-hover:scale-[1.04]"
          />
        ) : (
          <div className="flex h-full items-center justify-center px-8 text-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-muted-foreground">
                {t('brandFallback')}
              </p>
              <p className="mt-3 text-lg font-semibold text-foreground">
                {t('imageSoon')}
              </p>
            </div>
          </div>
        )}
      </Link>

      <CardContent className="flex flex-1 flex-col space-y-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">
                {localizedProduct.category.name}
              </p>
            </div>
            <Link
              href={`/products/${localizedProduct.slug}`}
              className="inline-block"
            >
              <h2 className="mt-2 cursor-pointer text-lg font-semibold text-foreground transition-colors hover:text-[#8c5a46]">
                {localizedProduct.name}
              </h2>
            </Link>
          </div>
          <ProductAvailabilityBadge stock={localizedProduct.stock} />
        </div>

        <p className="line-clamp-3 text-sm leading-7 text-muted-foreground">
          {localizedProduct.description}
        </p>

        <div className="mt-auto flex items-center justify-between pt-2">
          <div className="flex flex-col items-start">
            {hasDiscount ? (
              <span className="text-sm text-muted-foreground line-through decoration-muted-foreground/80">
                {formatOrderPrice(localizedProduct.compareAtPrice ?? 0, locale)}
              </span>
            ) : null}
            <span className="text-xl font-semibold text-foreground">
              {formatOrderPrice(localizedProduct.price, locale)}
            </span>
          </div>
          <span className="text-sm text-muted-foreground">
            {t('availableCount', { count: localizedProduct.stock })}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

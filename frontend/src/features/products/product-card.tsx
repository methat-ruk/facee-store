'use client';

import Image from 'next/image';
import { useLocale, useTranslations } from 'next-intl';
import { useState } from 'react';
import { Link } from '@/i18n/navigation';
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
  const [currentTimestamp] = useState(() => Date.now());
  const localizedProduct = getLocalizedProduct(product, locale);
  const hasDiscount =
    localizedProduct.compareAtPrice !== null &&
    localizedProduct.compareAtPrice > localizedProduct.price;
  const isNewArrival =
    currentTimestamp - new Date(localizedProduct.createdAt).getTime() <
    14 * 24 * 60 * 60 * 1000;
  const soldCountLabel =
    localizedProduct.soldCount > 0
      ? t('soldCount', {
          count: new Intl.NumberFormat(locale, {
            notation:
              localizedProduct.soldCount >= 1000 ? 'compact' : 'standard',
            maximumFractionDigits: localizedProduct.soldCount >= 1000 ? 1 : 0,
          }).format(localizedProduct.soldCount),
        })
      : null;

  return (
    <article className="group self-start overflow-hidden rounded-[1.1rem] border border-border/70 bg-card/95 shadow-[0_16px_42px_rgba(132,83,60,0.08)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_22px_55px_rgba(132,83,60,0.14)]">
      <Link
        href={`/products/${localizedProduct.slug}`}
        className="relative block aspect-[4/5] cursor-pointer overflow-hidden bg-[linear-gradient(180deg,#fff3ea_0%,#f7ddd0_100%)]"
      >
        <div className="absolute top-2 left-2 z-10 flex flex-col items-start gap-1.5">
          {localizedProduct.isFlashSale ? (
            <div className="rounded-full bg-[#9f2f24] px-2.5 py-1 text-[0.58rem] font-semibold uppercase tracking-[0.16em] text-white shadow-[0_10px_24px_rgba(159,47,36,0.24)]">
              {t('flashSale')}
            </div>
          ) : null}
          {isNewArrival ? (
            <div className="rounded-full border border-[#fff1e8]/80 bg-[linear-gradient(135deg,#ff935f_0%,#ef6b3d_100%)] px-2.5 py-1 text-[0.62rem] font-bold uppercase tracking-[0.18em] text-white shadow-[0_12px_28px_rgba(239,107,61,0.34)] ring-1 ring-white/12">
              {t('newBadge')}
            </div>
          ) : null}
        </div>
        {localizedProduct.imageUrl ? (
          <Image
            src={localizedProduct.imageUrl}
            alt={localizedProduct.name}
            fill
            priority={eagerImage}
            unoptimized={shouldBypassNextImageOptimization(
              localizedProduct.imageUrl,
            )}
            sizes="(min-width: 1536px) 240px, (min-width: 1280px) 20vw, (min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
            className="cursor-pointer object-cover object-top transition duration-500 group-hover:scale-[1.04]"
          />
        ) : (
          <div className="flex aspect-[4/5] items-center justify-center px-6 text-center">
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

      <div className="space-y-2.5 p-3">
        <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
          {localizedProduct.category.name}
        </p>

        <Link href={`/products/${localizedProduct.slug}`} className="block">
          <h2 className="line-clamp-2 cursor-pointer text-sm font-medium leading-5 text-foreground transition-colors hover:text-[#8c5a46] sm:text-[0.95rem]">
            {localizedProduct.name}
          </h2>
        </Link>

        <p
          title={localizedProduct.description}
          className="line-clamp-1 text-xs leading-5 text-muted-foreground transition-all hover:line-clamp-none hover:text-foreground/78"
        >
          {localizedProduct.description}
        </p>

        <div className="flex flex-col items-start">
          {hasDiscount ? (
            <span className="text-xs text-muted-foreground line-through decoration-muted-foreground/80">
              {formatOrderPrice(localizedProduct.compareAtPrice ?? 0, locale)}
            </span>
          ) : null}
          <div className="flex w-full items-end justify-between gap-3">
            <span className="text-base font-semibold text-foreground sm:text-lg">
              {formatOrderPrice(localizedProduct.price, locale)}
            </span>
            {soldCountLabel ? (
              <span className="shrink-0 text-[0.72rem] font-medium text-muted-foreground">
                {soldCountLabel}
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </article>
  );
}

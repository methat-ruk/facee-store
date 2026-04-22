'use client';

import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { ProductAvailabilityBadge } from '@/components/shared/product-availability-badge';
import { Card, CardContent } from '@/components/ui/card';
import type { Product } from './schemas';

type ProductCardProps = {
  product: Product;
  eagerImage?: boolean;
};

export function ProductCard({ product, eagerImage = false }: ProductCardProps) {
  const t = useTranslations('products');

  return (
    <Card className="group h-full gap-0 overflow-hidden border-border/80 bg-card/92 py-0 shadow-[0_24px_70px_rgba(132,83,60,0.1)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_30px_90px_rgba(132,83,60,0.16)]">
      <div className="relative h-[19rem] cursor-pointer overflow-hidden bg-[linear-gradient(180deg,#fff3ea_0%,#f7ddd0_100%)]">
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            loading={eagerImage ? 'eager' : 'lazy'}
            fetchPriority={eagerImage ? 'high' : 'auto'}
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
      </div>

      <CardContent className="flex flex-1 flex-col space-y-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">
              {product.category.name}
            </p>
            <h2 className="mt-2 cursor-pointer text-lg font-semibold text-foreground transition-colors hover:text-[#8c5a46]">
              {product.name}
            </h2>
          </div>
          <ProductAvailabilityBadge stock={product.stock} />
        </div>

        <p className="line-clamp-3 text-sm leading-7 text-muted-foreground">
          {product.description}
        </p>

        <div className="mt-auto flex items-center justify-between pt-2">
          <span className="text-xl font-semibold text-foreground">
            THB {product.price.toFixed(2)}
          </span>
          <span className="text-sm text-muted-foreground">
            {t('availableCount', { count: product.stock })}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

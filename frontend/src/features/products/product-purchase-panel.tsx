'use client';

import { CheckIcon, MinusIcon, PlusIcon, ShoppingCartIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { ProductAvailabilityBadge } from '@/components/shared/product-availability-badge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatOrderPrice } from '@/features/orders/ui';
import { useCartStore } from '@/store/use-cart-store';
import { animateAddToCartFlight } from './cart-fly-animation';
import type { ProductDetail } from './schemas';

type ProductPurchasePanelProps = {
  product: ProductDetail;
};

export function ProductPurchasePanel({ product }: ProductPurchasePanelProps) {
  const locale = useLocale();
  const t = useTranslations('products');
  const addItem = useCartStore((state) => state.addItem);
  const [quantity, setQuantity] = useState(1);
  const [isAdded, setIsAdded] = useState(false);
  const hasDiscount =
    product.compareAtPrice !== null && product.compareAtPrice > product.price;

  useEffect(() => {
    if (!isAdded) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setIsAdded(false);
    }, 2400);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [isAdded]);

  const isOutOfStock = product.stock === 0;

  return (
    <Card className="border-border/80 bg-card/96 shadow-[0_24px_70px_rgba(132,83,60,0.08)]">
      <CardHeader className="gap-3 border-b border-border/70">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-sm uppercase tracking-[0.24em] text-muted-foreground">
            {t('purchasePanelTitle')}
          </CardTitle>
          <ProductAvailabilityBadge stock={product.stock} />
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-5 pt-5">
        <div className="flex items-end justify-between gap-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm text-muted-foreground">
                {t('detailPriceLabel')}
              </p>
              {product.isFlashSale ? (
                <Badge className="border-[#9f2f24]/30 bg-[#9f2f24] text-white hover:bg-[#9f2f24]">
                  {t('flashSale')}
                </Badge>
              ) : null}
            </div>
            <div className="space-y-1">
              {hasDiscount ? (
                <p className="text-base text-muted-foreground line-through decoration-muted-foreground/80">
                  {formatOrderPrice(product.compareAtPrice ?? 0, locale)}
                </p>
              ) : null}
              <p className="text-3xl font-semibold tracking-tight text-foreground">
                {formatOrderPrice(product.price, locale)}
              </p>
            </div>
          </div>
          <Badge variant="outline" className="h-7 px-3 text-sm">
            {t('availableCount', { count: product.stock })}
          </Badge>
        </div>

        <div className="flex flex-col gap-3">
          <p className="text-sm font-medium text-foreground">{t('quantity')}</p>
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label={t('decreaseQuantity')}
              disabled={quantity <= 1 || isOutOfStock}
              onClick={() => setQuantity((current) => Math.max(1, current - 1))}
            >
              <MinusIcon />
            </Button>
            <div className="flex h-10 min-w-16 items-center justify-center rounded-xl border border-border bg-background px-4 text-base font-semibold text-foreground">
              {quantity}
            </div>
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label={t('increaseQuantity')}
              disabled={isOutOfStock || quantity >= product.stock}
              onClick={() =>
                setQuantity((current) => Math.min(product.stock, current + 1))
              }
            >
              <PlusIcon />
            </Button>
          </div>
        </div>

        <Button
          type="button"
          size="lg"
          disabled={isOutOfStock}
          className={`relative isolate overflow-hidden transition-transform ${
            isAdded
              ? 'motion-safe:animate-[cart-confirm-pop_420ms_ease-out]'
              : ''
          }`}
          onClick={(event) => {
            addItem({
              id: product.id,
              slug: product.slug,
              name: product.name,
              imageUrl: product.imageUrl,
              price: product.price,
              stock: product.stock,
              quantity,
            });
            animateAddToCartFlight(event.currentTarget);
            setIsAdded(true);
          }}
        >
          <span
            aria-hidden="true"
            className={`pointer-events-none absolute top-1/2 left-1/2 size-24 rounded-full bg-primary-foreground/35 ${
              isAdded
                ? 'motion-safe:animate-[cart-confirm-ripple_620ms_ease-out]'
                : 'opacity-0'
            }`}
          />
          <span
            className={`relative z-1 inline-flex items-center gap-1.5 ${
              isAdded
                ? 'motion-safe:animate-[cart-confirm-icon_380ms_ease-out]'
                : ''
            }`}
          >
            {isAdded ? (
              <CheckIcon data-icon="inline-start" />
            ) : (
              <ShoppingCartIcon data-icon="inline-start" />
            )}
            {isAdded ? t('addedToCart') : t('addToCart')}
          </span>
        </Button>

        <p className="text-sm leading-7 text-muted-foreground">
          {isOutOfStock ? t('outOfStockHelper') : t('addToCartHelper')}
        </p>
      </CardContent>
    </Card>
  );
}

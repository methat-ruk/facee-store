'use client';

import { CheckIcon, MinusIcon, PlusIcon, ShoppingBagIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { ProductAvailabilityBadge } from '@/components/shared/product-availability-badge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useCartStore } from '@/store/use-cart-store';
import type { ProductDetail } from './schemas';

type ProductPurchasePanelProps = {
  product: ProductDetail;
};

export function ProductPurchasePanel({ product }: ProductPurchasePanelProps) {
  const t = useTranslations('products');
  const addItem = useCartStore((state) => state.addItem);
  const [quantity, setQuantity] = useState(1);
  const [isAdded, setIsAdded] = useState(false);

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
            <p className="text-sm text-muted-foreground">
              {t('detailPriceLabel')}
            </p>
            <p className="text-3xl font-semibold tracking-tight text-foreground">
              THB {product.price.toFixed(2)}
            </p>
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
          onClick={() => {
            addItem({
              id: product.id,
              slug: product.slug,
              name: product.name,
              imageUrl: product.imageUrl,
              price: product.price,
              quantity,
            });
            setIsAdded(true);
          }}
        >
          {isAdded ? (
            <CheckIcon data-icon="inline-start" />
          ) : (
            <ShoppingBagIcon data-icon="inline-start" />
          )}
          {isAdded ? t('addedToCart') : t('addToCart')}
        </Button>

        <p className="text-sm leading-7 text-muted-foreground">
          {isOutOfStock ? t('outOfStockHelper') : t('addToCartHelper')}
        </p>
      </CardContent>
    </Card>
  );
}

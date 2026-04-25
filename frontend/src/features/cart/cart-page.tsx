'use client';

import {
  AlertTriangleIcon,
  ArrowLeftIcon,
  MinusIcon,
  PlusIcon,
  ShoppingCartIcon,
  Trash2Icon,
} from 'lucide-react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Link } from '@/i18n/navigation';
import { useCartView } from '@/features/cart/use-cart-view';

function formatPrice(value: number) {
  return `THB ${value.toFixed(2)}`;
}

const cartCtaClassName =
  'bg-[#9f604b] !text-[#fffaf6] hover:bg-[#884d3b] hover:!text-[#fffaf6] [&_svg]:!text-[#fffaf6] dark:bg-[#5a2f26] dark:!text-[#fffaf6] dark:hover:bg-[#4a261f]';

export function CartPage() {
  const t = useTranslations('cart');
  const {
    items,
    viewItems,
    itemCount,
    subtotal,
    shipping,
    total,
    isRefreshing,
    hasRefreshError,
    hasSnapshotItems,
    hasAdjustedItems,
    hasUnavailableItems,
    updateItemQuantity,
    removeItem,
    clearCart,
  } = useCartView();
  const canContinue = items.length > 0 && !hasUnavailableItems;

  if (items.length === 0) {
    return (
      <main className="mx-auto flex min-h-[calc(100svh-16rem)] w-full max-w-7xl items-center px-4 py-10 sm:px-6 lg:px-8">
        <section className="mx-auto flex w-full max-w-2xl flex-col items-center gap-6 text-center">
          <div className="flex size-16 items-center justify-center rounded-full border border-border bg-card text-foreground shadow-[0_18px_50px_rgba(132,83,60,0.08)]">
            <ShoppingCartIcon />
          </div>
          <div className="flex flex-col gap-3">
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              {t('emptyEyebrow')}
            </p>
            <h1 className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
              {t('emptyTitle')}
            </h1>
            <p className="mx-auto max-w-xl text-base leading-8 text-muted-foreground">
              {t('emptyDescription')}
            </p>
          </div>
          <Button asChild size="lg" className={cartCtaClassName}>
            <Link href="/products">
              <ArrowLeftIcon data-icon="inline-start" />
              {t('continueShopping')}
            </Link>
          </Button>
        </section>
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-12">
      <section className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-3">
          <Link
            href="/products"
            className="inline-flex w-fit items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeftIcon className="size-4" />
            {t('continueShopping')}
          </Link>
          <div className="flex flex-col gap-3">
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              {t('eyebrow')}
            </p>
            <h1 className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
              {t('title')}
            </h1>
            <p className="max-w-2xl text-base leading-8 text-muted-foreground">
              {t('description')}
            </p>
          </div>
        </div>
        <Badge variant="outline" className="w-fit px-3 py-1 text-sm">
          {t('itemCount', { count: itemCount })}
        </Badge>
      </section>

      {hasRefreshError || hasSnapshotItems ? (
        <div className="flex items-start gap-3 rounded-2xl border border-border bg-card/80 px-4 py-3 text-sm leading-7 text-muted-foreground">
          <AlertTriangleIcon className="mt-1 shrink-0" />
          <p>{t('snapshotNotice')}</p>
        </div>
      ) : null}

      {hasAdjustedItems ? (
        <div className="flex items-start gap-3 rounded-2xl border border-border bg-card/80 px-4 py-3 text-sm leading-7 text-muted-foreground">
          <AlertTriangleIcon className="mt-1 shrink-0" />
          <p>{t('adjustedNotice')}</p>
        </div>
      ) : null}

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_24rem] lg:items-start">
        <div className="flex flex-col gap-4">
          {viewItems.map((item) => (
            <Card
              key={item.id}
              className="border-border/80 bg-card/95 shadow-[0_20px_60px_rgba(132,83,60,0.08)]"
            >
              <CardContent className="grid gap-5 p-4 sm:grid-cols-[7rem_minmax(0,1fr)] sm:p-5">
                <Link
                  href={`/products/${item.slug}`}
                  className="relative aspect-square overflow-hidden rounded-2xl border border-border bg-muted"
                >
                  {item.imageUrl ? (
                    <Image
                      src={item.imageUrl}
                      alt={item.name}
                      fill
                      sizes="112px"
                      className="object-cover object-top"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center px-3 text-center text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                      Facee
                    </div>
                  )}
                </Link>

                <div className="flex min-w-0 flex-col gap-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <Link
                        href={`/products/${item.slug}`}
                        className="inline-block max-w-full"
                      >
                        <h2 className="truncate text-lg font-semibold text-foreground transition-colors hover:text-primary">
                          {item.name}
                        </h2>
                      </Link>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {formatPrice(item.price)}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {isRefreshing ? (
                        <Badge variant="secondary">{t('refreshing')}</Badge>
                      ) : null}
                      {item.isUnavailable ? (
                        <Badge variant="destructive">{t('unavailable')}</Badge>
                      ) : item.stock !== null ? (
                        <Badge variant="outline">
                          {t('stockCount', { count: item.stock })}
                        </Badge>
                      ) : null}
                    </div>
                  </div>

                  <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div className="flex items-center gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        aria-label={t('decreaseQuantity')}
                        disabled={item.quantity <= 1 || item.isUnavailable}
                        onClick={() =>
                          updateItemQuantity(item.id, item.quantity - 1)
                        }
                      >
                        <MinusIcon />
                      </Button>
                      <div className="flex h-10 min-w-16 items-center justify-center rounded-xl border border-border bg-background px-4 text-base font-semibold text-foreground">
                        {item.quantity}
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        aria-label={t('increaseQuantity')}
                        disabled={
                          item.isUnavailable ||
                          (item.stock !== null && item.quantity >= item.stock)
                        }
                        onClick={() =>
                          updateItemQuantity(item.id, item.quantity + 1)
                        }
                      >
                        <PlusIcon />
                      </Button>
                    </div>

                    <div className="flex items-center justify-between gap-4 sm:flex-col sm:items-end sm:gap-2">
                      <p className="text-lg font-semibold text-foreground">
                        {formatPrice(item.lineTotal)}
                      </p>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-muted-foreground hover:text-destructive"
                        onClick={() => removeItem(item.id)}
                      >
                        <Trash2Icon data-icon="inline-start" />
                        {t('remove')}
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="border-border/80 bg-card/95 shadow-[0_24px_70px_rgba(132,83,60,0.08)] lg:sticky lg:top-28">
          <CardHeader className="gap-3">
            <CardTitle>{t('summaryTitle')}</CardTitle>
            <p className="text-sm leading-7 text-muted-foreground">
              {hasUnavailableItems
                ? t('summaryBlocked')
                : t('summaryDescription')}
            </p>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex items-center justify-between gap-4 text-sm">
              <span className="text-muted-foreground">{t('subtotal')}</span>
              <span className="font-medium text-foreground">
                {formatPrice(subtotal)}
              </span>
            </div>
            <div className="flex items-center justify-between gap-4 text-sm">
              <span className="text-muted-foreground">{t('shipping')}</span>
              <span className="font-medium text-foreground">
                {shipping === 0
                  ? t('shippingPlaceholder')
                  : formatPrice(shipping)}
              </span>
            </div>
            <Separator />
            <div className="flex items-center justify-between gap-4">
              <span className="font-medium text-foreground">{t('total')}</span>
              <span className="text-2xl font-semibold text-foreground">
                {formatPrice(total)}
              </span>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-3 bg-transparent">
            {canContinue ? (
              <Button
                asChild
                size="lg"
                className={`w-full ${cartCtaClassName}`}
              >
                <Link href="/checkout">
                  <ShoppingCartIcon data-icon="inline-start" />
                  {t('continueToCheckout')}
                </Link>
              </Button>
            ) : (
              <Button
                type="button"
                size="lg"
                className={`w-full ${cartCtaClassName}`}
                disabled
              >
                <ShoppingCartIcon data-icon="inline-start" />
                {t('resolveCart')}
              </Button>
            )}
            <Button
              type="button"
              variant="ghost"
              className="w-full text-muted-foreground"
              onClick={clearCart}
            >
              {t('clearCart')}
            </Button>
          </CardFooter>
        </Card>
      </section>
    </main>
  );
}

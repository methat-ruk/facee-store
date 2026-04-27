'use client';

import {
  AlertTriangleIcon,
  ArrowLeftIcon,
  CheckCircle2Icon,
  ClipboardListIcon,
  ShoppingCartIcon,
} from 'lucide-react';
import Image from 'next/image';
import { useEffect, useState } from 'react';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Link, useRouter } from '@/i18n/navigation';
import { buildAuthNoticeHref } from '@/features/auth/auth-routing';
import { useCartView } from '@/features/cart/use-cart-view';
import { useAuthStore } from '@/store/use-auth-store';

const checkoutCtaClassName =
  'bg-[#9f604b] !text-[#fffaf6] hover:bg-[#884d3b] hover:!text-[#fffaf6] [&_svg]:!text-[#fffaf6] dark:bg-[#5a2f26] dark:!text-[#fffaf6] dark:hover:bg-[#4a261f]';

function formatPrice(value: number) {
  return `THB ${value.toFixed(2)}`;
}

export function CheckoutPage() {
  const t = useTranslations('checkout');
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const isAuthInitialized = useAuthStore((state) => state.isInitialized);
  const isRestoringProfile = useAuthStore((state) => state.isRestoringProfile);
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
  } = useCartView();
  const [showComingSoon, setShowComingSoon] = useState(false);

  useEffect(() => {
    if (!isAuthInitialized || user) {
      return;
    }

    router.replace(buildAuthNoticeHref('/login', 'auth-required', '/checkout'));
  }, [isAuthInitialized, router, user]);

  if (!isAuthInitialized || isRestoringProfile) {
    return (
      <main className="mx-auto flex min-h-[calc(100svh-16rem)] w-full max-w-7xl items-center justify-center px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex size-14 items-center justify-center rounded-full border border-border bg-card text-foreground shadow-[0_18px_50px_rgba(132,83,60,0.08)]">
            <ShoppingCartIcon />
          </div>
          <p className="text-sm font-medium text-muted-foreground">
            {t('checkingSession')}
          </p>
        </div>
      </main>
    );
  }

  if (!user) {
    return null;
  }

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
          <Button asChild size="lg" className={checkoutCtaClassName}>
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
            href="/cart"
            className="inline-flex w-fit items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeftIcon className="size-4" />
            {t('backToCart')}
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

      {hasUnavailableItems ? (
        <div className="flex items-start gap-3 rounded-2xl border border-border bg-card/80 px-4 py-3 text-sm leading-7 text-muted-foreground">
          <AlertTriangleIcon className="mt-1 shrink-0" />
          <div className="flex flex-col gap-2">
            <p>{t('unavailableNotice')}</p>
            <Button asChild variant="outline" size="sm" className="w-fit">
              <Link href="/cart">{t('fixCart')}</Link>
            </Button>
          </div>
        </div>
      ) : null}

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_24rem] lg:items-start">
        <Card className="border-border/80 bg-card/95 shadow-[0_24px_70px_rgba(132,83,60,0.08)]">
          <CardHeader className="gap-3">
            <CardTitle>{t('contactTitle')}</CardTitle>
            <p className="text-sm leading-7 text-muted-foreground">
              {t('contactDescription')}
            </p>
          </CardHeader>
          <CardContent className="grid gap-5 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="checkout-name">{t('fullName')}</Label>
              <Input id="checkout-name" placeholder={t('fullName')} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="checkout-email">{t('email')}</Label>
              <Input
                id="checkout-email"
                type="email"
                placeholder={t('email')}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="checkout-phone">{t('phone')}</Label>
              <Input id="checkout-phone" type="tel" placeholder={t('phone')} />
            </div>
            <div className="flex flex-col gap-2 sm:col-span-2">
              <Label htmlFor="checkout-address">{t('addressLine')}</Label>
              <Input id="checkout-address" placeholder={t('addressLine')} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="checkout-city">{t('city')}</Label>
              <Input id="checkout-city" placeholder={t('city')} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="checkout-postal-code">{t('postalCode')}</Label>
              <Input id="checkout-postal-code" placeholder={t('postalCode')} />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/80 bg-card/95 shadow-[0_24px_70px_rgba(132,83,60,0.08)] lg:sticky lg:top-28">
          <CardHeader className="gap-3">
            <CardTitle>{t('reviewTitle')}</CardTitle>
            <p className="text-sm leading-7 text-muted-foreground">
              {hasUnavailableItems
                ? t('reviewBlocked')
                : t('reviewDescription')}
            </p>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex max-h-80 flex-col gap-3 overflow-auto pr-1">
              {viewItems.map((item) => (
                <div key={item.id} className="flex gap-3">
                  <Link
                    href={`/products/${item.slug}`}
                    className="relative size-16 shrink-0 overflow-hidden rounded-xl border border-border bg-muted"
                  >
                    {item.imageUrl ? (
                      <Image
                        src={item.imageUrl}
                        alt={item.name}
                        fill
                        sizes="64px"
                        className="object-cover object-top"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                        Facee
                      </div>
                    )}
                  </Link>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <Link href={`/products/${item.slug}`} className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground">
                          {item.name}
                        </p>
                      </Link>
                      <p className="shrink-0 text-sm font-medium text-foreground">
                        {formatPrice(item.lineTotal)}
                      </p>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <span>{t('quantity', { count: item.quantity })}</span>
                      {item.isUnavailable ? (
                        <Badge variant="destructive">{t('unavailable')}</Badge>
                      ) : item.stock !== null ? (
                        <Badge variant="outline">
                          {t('stockCount', { count: item.stock })}
                        </Badge>
                      ) : null}
                      {isRefreshing ? (
                        <Badge variant="secondary">{t('refreshing')}</Badge>
                      ) : null}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <Separator />

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
            {showComingSoon ? (
              <div className="flex items-start gap-3 rounded-2xl border border-border bg-muted/60 px-4 py-3 text-sm leading-7 text-muted-foreground">
                <CheckCircle2Icon className="mt-1 shrink-0" />
                <p>{t('comingSoonNotice')}</p>
              </div>
            ) : null}
            {hasUnavailableItems ? (
              <Button asChild size="lg" className="w-full">
                <Link href="/cart">
                  <AlertTriangleIcon data-icon="inline-start" />
                  {t('fixCart')}
                </Link>
              </Button>
            ) : (
              <Button
                type="button"
                size="lg"
                className={`w-full ${checkoutCtaClassName}`}
                onClick={() => setShowComingSoon(true)}
              >
                <ClipboardListIcon data-icon="inline-start" />
                {t('placeOrder')}
              </Button>
            )}
          </CardFooter>
        </Card>
      </section>
    </main>
  );
}

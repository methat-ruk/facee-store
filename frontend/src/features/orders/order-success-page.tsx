'use client';

import {
  AlertTriangleIcon,
  ArrowLeftIcon,
  CheckCircle2Icon,
  ShoppingCartIcon,
} from 'lucide-react';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
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
import { buildAuthNoticeHref } from '@/features/auth/auth-routing';
import {
  checkoutPrimaryButtonClassName,
  FREE_SHIPPING_THRESHOLD,
} from '@/features/checkout/checkout-ui';
import type { OrderDetail } from '@/features/orders/schemas';
import { formatOrderDate, formatOrderPrice } from '@/features/orders/ui';
import { Link, useRouter } from '@/i18n/navigation';
import { isApiError } from '@/services/api-error';
import { getOrderDetail } from '@/services/orders';
import { useAuthStore } from '@/store/use-auth-store';

type CheckoutSuccessPageProps = {
  orderNo: string;
};

export function CheckoutSuccessPage({ orderNo }: CheckoutSuccessPageProps) {
  const locale = useLocale();
  const t = useTranslations('checkoutSuccess');
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const isAuthInitialized = useAuthStore((state) => state.isInitialized);
  const isRestoringProfile = useAuthStore((state) => state.isRestoringProfile);
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorState, setErrorState] = useState<'not-found' | 'generic' | null>(
    null,
  );

  useEffect(() => {
    if (!isAuthInitialized || isRestoringProfile) {
      return;
    }

    if (!user) {
      router.replace(
        buildAuthNoticeHref(
          '/login',
          'auth-required',
          `/checkout/success/${orderNo}`,
        ),
      );
      return;
    }

    let isCancelled = false;

    void getOrderDetail(orderNo)
      .then((response) => {
        if (isCancelled) {
          return;
        }

        setOrder(response);
        setIsLoading(false);
      })
      .catch((error) => {
        if (isCancelled) {
          return;
        }

        if (isApiError(error) && error.code === 'ORDER_NOT_FOUND') {
          setErrorState('not-found');
        } else {
          setErrorState('generic');
        }

        setIsLoading(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [isAuthInitialized, isRestoringProfile, orderNo, router, user]);

  if (!isAuthInitialized || isRestoringProfile || isLoading) {
    return (
      <main className="mx-auto flex min-h-[calc(100svh-16rem)] w-full max-w-7xl items-center justify-center px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex size-14 items-center justify-center rounded-full border border-border bg-card text-foreground shadow-[0_18px_50px_rgba(132,83,60,0.08)]">
            <ShoppingCartIcon />
          </div>
          <p className="text-sm font-medium text-muted-foreground">
            {t('loading')}
          </p>
        </div>
      </main>
    );
  }

  if (!user) {
    return null;
  }

  if (errorState === 'not-found') {
    return (
      <main className="mx-auto flex min-h-[calc(100svh-16rem)] w-full max-w-7xl items-center px-4 py-10 sm:px-6 lg:px-8">
        <section className="mx-auto flex w-full max-w-2xl flex-col items-center gap-6 text-center">
          <div className="flex size-16 items-center justify-center rounded-full border border-border bg-card text-foreground shadow-[0_18px_50px_rgba(132,83,60,0.08)]">
            <AlertTriangleIcon />
          </div>
          <div className="flex flex-col gap-3">
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              {t('missingEyebrow')}
            </p>
            <h1 className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
              {t('missingTitle')}
            </h1>
            <p className="mx-auto max-w-xl text-base leading-8 text-muted-foreground">
              {t('missingDescription')}
            </p>
          </div>
          <Button asChild size="lg">
            <Link href="/products">
              <ArrowLeftIcon data-icon="inline-start" />
              {t('backToProducts')}
            </Link>
          </Button>
        </section>
      </main>
    );
  }

  if (errorState === 'generic' || !order) {
    return (
      <main className="mx-auto flex min-h-[calc(100svh-16rem)] w-full max-w-7xl items-center px-4 py-10 sm:px-6 lg:px-8">
        <section className="mx-auto flex w-full max-w-2xl flex-col items-center gap-6 text-center">
          <div className="flex size-16 items-center justify-center rounded-full border border-border bg-card text-foreground shadow-[0_18px_50px_rgba(132,83,60,0.08)]">
            <AlertTriangleIcon />
          </div>
          <div className="flex flex-col gap-3">
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              {t('errorEyebrow')}
            </p>
            <h1 className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
              {t('errorTitle')}
            </h1>
            <p className="mx-auto max-w-xl text-base leading-8 text-muted-foreground">
              {t('errorDescription')}
            </p>
          </div>
          <Button asChild size="lg">
            <Link href="/products">
              <ArrowLeftIcon data-icon="inline-start" />
              {t('backToProducts')}
            </Link>
          </Button>
        </section>
      </main>
    );
  }

  return (
    <main className="mx-auto flex h-full w-full max-w-7xl flex-1 flex-col gap-8 px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-12">
      <section className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-3">
          <Link
            href="/products"
            className="inline-flex w-fit items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeftIcon className="size-4" />
            {t('backToProducts')}
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
          {t('orderNumberValue', { orderNo: order.orderNo })}
        </Badge>
      </section>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_24rem] lg:items-start">
        <Card className="border-border/80 bg-card/95 shadow-[0_24px_70px_rgba(132,83,60,0.08)]">
          <CardHeader className="gap-3">
            <div className="flex items-center gap-3">
              <div className="flex size-12 items-center justify-center rounded-full border border-border bg-muted text-foreground">
                <CheckCircle2Icon />
              </div>
              <div className="flex flex-col gap-1">
                <CardTitle>{t('summaryTitle')}</CardTitle>
                <p className="text-sm leading-7 text-muted-foreground">
                  {t('summaryDescription')}
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-border bg-background/70 p-4">
                <p className="text-sm font-medium text-foreground">
                  {t('orderNumberLabel')}
                </p>
                <p className="mt-2 text-sm leading-7 text-muted-foreground">
                  {order.orderNo}
                </p>
              </div>
              <div className="rounded-2xl border border-border bg-background/70 p-4">
                <p className="text-sm font-medium text-foreground">
                  {t('createdAtLabel')}
                </p>
                <p className="mt-2 text-sm leading-7 text-muted-foreground">
                  {formatOrderDate(order.createdAt, locale)}
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-background/70 p-4">
              <p className="text-sm font-medium text-foreground">
                {t('contactTitle')}
              </p>
              <div className="mt-3 grid gap-2 text-sm leading-7 text-muted-foreground sm:grid-cols-2">
                <p>{order.contact.fullName}</p>
                <p>{order.contact.email}</p>
                <p>{order.contact.phone}</p>
                <p>{order.contact.postalCode}</p>
                <p className="sm:col-span-2">
                  {order.contact.addressLine}, {order.contact.city}
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <p className="text-sm font-medium text-foreground">
                {t('itemsTitle')}
              </p>
              <div className="flex flex-col gap-3">
                {order.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex gap-3 rounded-2xl border border-border bg-background/70 p-3"
                  >
                    <div className="relative size-16 shrink-0 overflow-hidden rounded-xl border border-border bg-muted">
                      {item.productImageUrl ? (
                        <Image
                          src={item.productImageUrl}
                          alt={item.productName}
                          fill
                          sizes="64px"
                          className="object-cover object-top"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                          Facee
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-foreground">
                            {item.productName}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {t('quantityValue', { count: item.quantity })}
                          </p>
                        </div>
                        <p className="shrink-0 text-sm font-medium text-foreground">
                          {formatOrderPrice(item.lineTotal, locale)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/80 bg-card/95 shadow-[0_24px_70px_rgba(132,83,60,0.08)] lg:sticky lg:top-28">
          <CardHeader className="gap-3">
            <CardTitle>{t('totalsTitle')}</CardTitle>
            <p className="text-sm leading-7 text-muted-foreground">
              {t('totalsDescription')}
            </p>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex items-center justify-between gap-4 text-sm">
              <span className="text-muted-foreground">{t('subtotal')}</span>
              <span className="font-medium text-foreground">
                {formatOrderPrice(order.subtotal, locale)}
              </span>
            </div>
            <div className="flex items-center justify-between gap-4 text-sm">
              <span className="text-muted-foreground">{t('shipping')}</span>
              <span className="font-medium text-foreground">
                {formatOrderPrice(order.shippingTotal, locale)}
              </span>
            </div>
            <p className="text-xs leading-6 text-muted-foreground">
              {order.shippingTotal === 0
                ? t('shippingFreeThreshold', {
                    threshold: formatOrderPrice(
                      FREE_SHIPPING_THRESHOLD,
                      locale,
                    ),
                  })
                : t('shippingFlatRate', {
                    amount: formatOrderPrice(order.shippingTotal, locale),
                    threshold: formatOrderPrice(
                      FREE_SHIPPING_THRESHOLD,
                      locale,
                    ),
                  })}
            </p>
            <Separator />
            <div className="flex items-center justify-between gap-4">
              <span className="font-medium text-foreground">{t('total')}</span>
              <span className="text-2xl font-semibold text-foreground">
                {formatOrderPrice(order.total, locale)}
              </span>
            </div>
          </CardContent>
          <CardFooter className="bg-transparent">
            <Button
              asChild
              size="lg"
              className={`w-full ${checkoutPrimaryButtonClassName}`}
            >
              <Link href="/products">
                <ArrowLeftIcon data-icon="inline-start" />
                {t('continueShopping')}
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </section>
    </main>
  );
}

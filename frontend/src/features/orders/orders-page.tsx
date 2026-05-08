'use client';

import {
  ArrowRightIcon,
  PackageSearchIcon,
  SearchIcon,
  XIcon,
} from 'lucide-react';
import Image from 'next/image';
import { useDeferredValue, useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { buildAuthNoticeHref } from '@/features/auth/auth-routing';
import { checkoutPrimaryButtonClassName } from '@/features/checkout/checkout-ui';
import type { OrderListItem } from '@/features/orders/schemas';
import {
  formatOrderDate,
  formatOrderPrice,
  getOrderStatusBadgeClassName,
  getOrderStatusBadgeVariant,
} from '@/features/orders/ui';
import { Link, useRouter } from '@/i18n/navigation';
import { shouldBypassNextImageOptimization } from '@/lib/image';
import { listOrders } from '@/services/orders';
import { useAuthStore } from '@/store/use-auth-store';

export function OrdersPage() {
  const locale = useLocale();
  const t = useTranslations('orders');
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const isAuthInitialized = useAuthStore((state) => state.isInitialized);
  const isRestoringProfile = useAuthStore((state) => state.isRestoringProfile);
  const [orders, setOrders] = useState<OrderListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const deferredSearchValue = useDeferredValue(searchValue);

  const hasPendingPayment = (order: OrderListItem) =>
    order.status === 'PENDING' && order.paymentDemoStatus === 'NOT_STARTED';

  const normalizedSearchValue = deferredSearchValue.trim().toLocaleLowerCase();
  const filteredOrders = orders.filter((order) => {
    if (!normalizedSearchValue) {
      return true;
    }

    const matchesOrderNo = order.orderNo
      .toLocaleLowerCase()
      .includes(normalizedSearchValue);
    const matchesProductName = order.previewItems.some((item) =>
      item.productName.toLocaleLowerCase().includes(normalizedSearchValue),
    );

    return matchesOrderNo || matchesProductName;
  });

  const loadOrders = async () => {
    setHasError(false);
    setIsLoading(true);

    try {
      const response = await listOrders();
      setOrders(response.items);
    } catch {
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthInitialized || user) {
      return;
    }

    router.replace(buildAuthNoticeHref('/login', 'auth-required', '/orders'));
  }, [isAuthInitialized, router, user]);

  useEffect(() => {
    if (!user) {
      return;
    }

    let isCancelled = false;

    void listOrders()
      .then((response) => {
        if (isCancelled) {
          return;
        }

        setOrders(response.items);
        setIsLoading(false);
      })
      .catch(() => {
        if (isCancelled) {
          return;
        }

        setHasError(true);
        setIsLoading(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [user]);

  if (!isAuthInitialized || isRestoringProfile || isLoading) {
    return (
      <main className="mx-auto flex min-h-[calc(100svh-16rem)] w-full max-w-7xl items-center justify-center px-4 py-10 sm:px-6 lg:px-8">
        <p className="text-sm font-medium text-muted-foreground">
          {t('loading')}
        </p>
      </main>
    );
  }

  if (!user) {
    return null;
  }

  if (hasError) {
    return (
      <main className="mx-auto flex min-h-[calc(100svh-16rem)] w-full max-w-7xl items-center px-4 py-10 sm:px-6 lg:px-8">
        <Card className="mx-auto w-full max-w-2xl border-border/80 bg-card/95 shadow-[0_24px_70px_rgba(132,83,60,0.08)]">
          <CardHeader className="text-center">
            <CardTitle>{t('errorLoadFailed')}</CardTitle>
            <CardDescription>{t('errorLoadDescription')}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button type="button" onClick={() => void loadOrders()}>
              {t('retryLoad')}
            </Button>
            <Button asChild variant="outline">
              <Link href="/products">{t('browseProducts')}</Link>
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="mx-auto flex h-full w-full max-w-7xl flex-1 flex-col gap-8 px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-12">
      <section className="flex flex-col gap-3">
        <p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
          {t('eyebrow')}
        </p>
        <h1 className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
          {t('title')}
        </h1>
        <p className="max-w-3xl text-base leading-8 text-muted-foreground">
          {t('description')}
        </p>
      </section>

      {orders.length > 0 ? (
        <Card className="border-border/80 bg-card/95 shadow-[0_24px_70px_rgba(132,83,60,0.08)]">
          <CardContent className="flex flex-col gap-4 p-5 sm:p-6">
            <div className="flex flex-col gap-2">
              <p className="text-sm font-semibold text-foreground">
                {t('searchLabel')}
              </p>
              <p className="text-sm leading-6 text-muted-foreground">
                {t('searchHint')}
              </p>
            </div>

            <div className="relative">
              <SearchIcon className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchValue}
                onChange={(event) => setSearchValue(event.target.value)}
                placeholder={t('searchPlaceholder')}
                className="h-12 rounded-full border-border/80 bg-background/60 pl-11 pr-12"
                aria-label={t('searchLabel')}
              />
              {searchValue ? (
                <button
                  type="button"
                  onClick={() => setSearchValue('')}
                  className="absolute right-4 top-1/2 inline-flex size-7 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground"
                  aria-label={t('clearSearch')}
                >
                  <XIcon className="size-4" />
                </button>
              ) : null}
            </div>
          </CardContent>
        </Card>
      ) : null}

      {orders.length === 0 ? (
        <Card className="border-border/80 bg-card/95 shadow-[0_24px_70px_rgba(132,83,60,0.08)]">
          <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
            <div className="flex size-14 items-center justify-center rounded-full border border-border bg-muted text-foreground">
              <PackageSearchIcon />
            </div>
            <div className="flex flex-col gap-2">
              <p className="text-lg font-medium text-foreground">
                {t('emptyTitle')}
              </p>
              <p className="max-w-xl text-sm leading-7 text-muted-foreground">
                {t('emptyDescription')}
              </p>
            </div>
            <Button asChild>
              <Link href="/products">{t('browseProducts')}</Link>
            </Button>
          </CardContent>
        </Card>
      ) : filteredOrders.length === 0 ? (
        <Card className="border-border/80 bg-card/95 shadow-[0_24px_70px_rgba(132,83,60,0.08)]">
          <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
            <div className="flex size-14 items-center justify-center rounded-full border border-border bg-muted text-foreground">
              <SearchIcon />
            </div>
            <div className="flex flex-col gap-2">
              <p className="text-lg font-medium text-foreground">
                {t('searchEmptyTitle')}
              </p>
              <p className="max-w-xl text-sm leading-7 text-muted-foreground">
                {t('searchEmptyDescription')}
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() => setSearchValue('')}
            >
              {t('clearSearch')}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredOrders.map((order) => (
            <Card
              key={order.orderNo}
              className="border-border/80 bg-card/95 shadow-[0_24px_70px_rgba(132,83,60,0.08)]"
            >
              <CardContent className="grid gap-5 p-5 sm:p-6 lg:grid-cols-[minmax(0,1.4fr)_auto] lg:items-center">
                <div className="flex min-w-0 flex-col gap-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <CardTitle className="text-xl">
                      {t('orderNumber', { orderNo: order.orderNo })}
                    </CardTitle>
                    <Badge
                      variant={getOrderStatusBadgeVariant(order.status)}
                      className={getOrderStatusBadgeClassName(order.status)}
                    >
                      {t(`status.${order.status}`)}
                    </Badge>
                    {order.hasPendingCancellationRequest ? (
                      <Badge
                        variant="outline"
                        className="border-amber-300 bg-amber-100 text-amber-900 dark:border-amber-400/30 dark:bg-amber-400/15 dark:text-amber-100"
                      >
                        {t('pendingCancellation')}
                      </Badge>
                    ) : null}
                  </div>

                  <div className="grid gap-4 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center">
                    <div className="flex flex-wrap items-center gap-2">
                      {order.previewItems.map((item) => (
                        <div
                          key={item.id}
                          className="relative size-12 overflow-hidden rounded-xl border border-border bg-muted"
                          title={item.productName}
                        >
                          {item.productImageUrl ? (
                            <Image
                              src={item.productImageUrl}
                              alt={item.productName}
                              fill
                              unoptimized={shouldBypassNextImageOptimization(
                                item.productImageUrl,
                              )}
                              sizes="48px"
                              className="object-cover object-top"
                            />
                          ) : (
                            <div className="flex size-full items-center justify-center text-[0.65rem] font-medium text-muted-foreground">
                              {item.productName.slice(0, 1)}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    <div className="min-w-0 text-sm leading-7 text-muted-foreground">
                      <p>{formatOrderDate(order.createdAt, locale)}</p>
                    </div>

                    <div className="flex flex-col gap-1 text-sm sm:items-end">
                      <p className="text-lg font-semibold text-foreground">
                        {formatOrderPrice(order.total, locale)}
                      </p>
                      <p className="text-muted-foreground">
                        {t('itemCount', { count: order.itemCount })}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap justify-start gap-2 lg:justify-end">
                  {hasPendingPayment(order) ? (
                    <Button asChild className={checkoutPrimaryButtonClassName}>
                      <Link href={`/checkout/payment/${order.orderNo}`}>
                        {t('continuePayment')}
                        <ArrowRightIcon data-icon="inline-end" />
                      </Link>
                    </Button>
                  ) : null}
                  <Button asChild variant="outline">
                    <Link href={`/orders/${order.orderNo}`}>
                      {t('viewDetails')}
                      <ArrowRightIcon data-icon="inline-end" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </main>
  );
}

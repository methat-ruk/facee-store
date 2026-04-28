'use client';

import { ArrowRightIcon, PackageSearchIcon } from 'lucide-react';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardTitle } from '@/components/ui/card';
import { buildAuthNoticeHref } from '@/features/auth/auth-routing';
import type { OrderListItem } from '@/features/orders/schemas';
import {
  formatOrderPrice,
  getOrderStatusBadgeClassName,
  getOrderStatusBadgeVariant,
} from '@/features/orders/ui';
import { Link, useRouter } from '@/i18n/navigation';
import { listOrders } from '@/services/orders';
import { useAuthStore } from '@/store/use-auth-store';

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

export function OrdersPage() {
  const t = useTranslations('orders');
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const isAuthInitialized = useAuthStore((state) => state.isInitialized);
  const isRestoringProfile = useAuthStore((state) => state.isRestoringProfile);
  const [orders, setOrders] = useState<OrderListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

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
      <main className="mx-auto flex min-h-[calc(100svh-16rem)] w-full max-w-7xl items-center justify-center px-4 py-10 sm:px-6 lg:px-8">
        <p className="text-sm font-medium text-destructive">
          {t('errorLoadFailed')}
        </p>
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
      ) : (
        <div className="grid gap-4">
          {orders.map((order) => (
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
                      <p>{formatDate(order.createdAt)}</p>
                      <p>{order.contact.fullName}</p>
                      <p className="truncate">{order.contact.addressLine}</p>
                      <p>
                        {order.contact.city} {order.contact.postalCode}
                      </p>
                    </div>

                    <div className="flex flex-col gap-1 text-sm sm:items-end">
                      <p className="text-lg font-semibold text-foreground">
                        {formatOrderPrice(order.total)}
                      </p>
                      <p className="text-muted-foreground">
                        {t('itemCount', { count: order.itemCount })}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-start lg:justify-end">
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

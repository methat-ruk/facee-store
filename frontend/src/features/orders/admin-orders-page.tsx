'use client';

import { ArrowRightIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { buildAuthNoticeHref } from '@/features/auth/auth-routing';
import type { OrderListItem } from '@/features/orders/schemas';
import {
  formatOrderPrice,
  getOrderStatusBadgeVariant,
} from '@/features/orders/ui';
import { Link, useRouter } from '@/i18n/navigation';
import { listAdminOrders } from '@/services/orders';
import { useAuthStore } from '@/store/use-auth-store';

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

export function AdminOrdersPage() {
  const t = useTranslations('adminOrders');
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const isAuthInitialized = useAuthStore((state) => state.isInitialized);
  const isRestoringProfile = useAuthStore((state) => state.isRestoringProfile);
  const [orders, setOrders] = useState<OrderListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isAuthInitialized) {
      return;
    }

    if (!user) {
      router.replace(
        buildAuthNoticeHref('/login', 'auth-required', '/admin/orders'),
      );
      return;
    }

    if (user.role !== 'ADMIN') {
      router.replace(buildAuthNoticeHref('/login', 'access-denied'));
      return;
    }

    let isCancelled = false;

    void listAdminOrders().then((response) => {
      if (isCancelled) {
        return;
      }

      setOrders(response.items);
      setIsLoading(false);
    });

    return () => {
      isCancelled = true;
    };
  }, [isAuthInitialized, router, user]);

  if (!isAuthInitialized || isRestoringProfile || isLoading) {
    return (
      <main className="mx-auto flex min-h-[calc(100svh-16rem)] w-full max-w-7xl items-center justify-center px-4 py-10 sm:px-6 lg:px-8">
        <p className="text-sm font-medium text-muted-foreground">
          {t('loading')}
        </p>
      </main>
    );
  }

  if (!user || user.role !== 'ADMIN') {
    return null;
  }

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-12">
      <section className="flex flex-col gap-3">
        <p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
          {t('eyebrow')}
        </p>
        <h1 className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
          {t('title')}
        </h1>
      </section>

      <div className="grid gap-4">
        {orders.map((order) => (
          <Card key={order.orderNo} className="border-border/80 bg-card/95">
            <CardHeader className="gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex flex-col gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <CardTitle>{order.orderNo}</CardTitle>
                  <Badge variant={getOrderStatusBadgeVariant(order.status)}>
                    {t(`status.${order.status}`)}
                  </Badge>
                  {order.hasPendingCancellationRequest ? (
                    <Badge variant="outline">{t('pendingCancellation')}</Badge>
                  ) : null}
                </div>
                <p className="text-sm text-muted-foreground">
                  {formatDate(order.createdAt)}
                </p>
              </div>
              <div className="flex flex-col items-start gap-1 text-sm sm:items-end">
                <p className="font-medium text-foreground">
                  {formatOrderPrice(order.total)}
                </p>
                <p className="text-muted-foreground">
                  {order.contact.fullName}
                </p>
              </div>
            </CardHeader>
            <CardContent className="flex justify-end">
              <Button asChild variant="outline">
                <Link href={`/admin/orders/${order.orderNo}`}>
                  {t('viewOrder')}
                  <ArrowRightIcon data-icon="inline-end" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </main>
  );
}

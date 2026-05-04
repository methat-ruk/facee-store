'use client';

import { ArrowRightIcon } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardTitle } from '@/components/ui/card';
import type { OrderListItem } from '@/features/orders/schemas';
import {
  getOrderStatusBadgeClassName,
  getOrderStatusBadgeVariant,
} from '@/features/orders/ui';
import { Link } from '@/i18n/navigation';
import { listAdminOrders } from '@/services/orders';
import { useNotificationsStore } from '@/store/use-notifications-store';

export function AdminOrdersPage() {
  const t = useTranslations('adminOrders');
  const shellT = useTranslations('admin');
  const locale = useLocale();
  const searchParams = useSearchParams();
  const [orders, setOrders] = useState<OrderListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [activeStatus, setActiveStatus] = useState<
    'ALL' | OrderListItem['status']
  >('ALL');
  const [followUpOnly, setFollowUpOnly] = useState(false);
  const notifications = useNotificationsStore((state) => state.items);
  const query = searchParams.get('query')?.trim().toLowerCase() ?? '';
  const uiText =
    locale === 'th'
      ? {
          all: 'ทั้งหมด',
          followUp: 'ต้องติดตาม',
          shown: 'รายการที่แสดง',
          resultLabel: 'รายการออเดอร์ที่กรองแล้ว',
          allOrders: 'Orders',
          cleanDescription:
            'เปิดหน้าในเพื่อดูข้อมูลลูกค้า รายการสินค้า การชำระเงิน และราคารวมโดยละเอียด',
        }
      : {
          all: 'All',
          followUp: 'Needs follow-up',
          shown: 'orders shown',
          resultLabel: 'Filtered order list',
          allOrders: 'Orders',
          cleanDescription:
            'Open the detail view to review customer, payment, item, and pricing information.',
        };

  useEffect(() => {
    let isCancelled = false;

    void listAdminOrders()
      .then((response) => {
        if (isCancelled) {
          return;
        }

        setOrders(response.items);
        setHasError(false);
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
  }, []);

  const statusCounts = useMemo(() => {
    return orders.reduce<Record<string, number>>((counts, order) => {
      counts[order.status] = (counts[order.status] ?? 0) + 1;
      return counts;
    }, {});
  }, [orders]);

  const followUpCount = useMemo(
    () =>
      orders.filter(
        (order) =>
          order.status === 'PENDING' ||
          order.hasPendingCancellationRequest ||
          order.refundStatus === 'PENDING_MANUAL',
      ).length,
    [orders],
  );

  const unreadOrderNotifications = useMemo(() => {
    return notifications.reduce<Record<string, number>>((counts, item) => {
      if (!item.orderNo || item.isRead) {
        return counts;
      }

      counts[item.orderNo] = (counts[item.orderNo] ?? 0) + 1;
      return counts;
    }, {});
  }, [notifications]);

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const haystack = [
        order.orderNo,
        order.contact.fullName,
        order.contact.email,
        order.contact.phone,
        order.status,
        order.paymentMethod,
      ]
        .join(' ')
        .toLowerCase();

      const matchesQuery = !query || haystack.includes(query);
      const matchesStatus =
        activeStatus === 'ALL' || order.status === activeStatus;
      const needsFollowUp =
        order.status === 'PENDING' ||
        order.hasPendingCancellationRequest ||
        order.refundStatus === 'PENDING_MANUAL';

      return matchesQuery && matchesStatus && (!followUpOnly || needsFollowUp);
    });
  }, [activeStatus, followUpOnly, orders, query]);

  if (isLoading) {
    return (
      <main className="flex min-h-[32rem] items-center justify-center px-1 py-6">
        <p className="text-sm font-medium text-muted-foreground">
          {t('loading')}
        </p>
      </main>
    );
  }

  if (hasError) {
    return (
      <main className="px-1 py-6">
        <Card className="border-border/70 bg-[rgba(255,250,247,0.82)] shadow-[0_20px_50px_rgba(126,76,57,0.08)] dark:bg-[rgba(34,25,21,0.82)]">
          <CardContent className="flex flex-col items-start gap-4 p-6">
            <div className="space-y-2">
              <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                {shellT('errorEyebrow')}
              </p>
              <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                {shellT('errorTitle')}
              </h2>
              <p className="text-sm leading-6 text-muted-foreground">
                {shellT('errorDescription')}
              </p>
            </div>
            <Button type="button" onClick={() => window.location.reload()}>
              {shellT('retry')}
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="flex flex-col gap-6 px-1 pb-4">
      <section className="rounded-[2rem] border border-border/70 bg-[rgba(31,22,19,0.9)] p-6 shadow-[0_20px_50px_rgba(0,0,0,0.18)] sm:p-7">
        <div className="flex flex-col gap-5">
          <div className="space-y-3">
            <h2 className="font-serif text-[2.2rem] leading-none tracking-[0.01em] text-[#fbf1eb] sm:text-[2.75rem]">
              {uiText.allOrders}
            </h2>
            <p className="max-w-3xl text-sm leading-7 text-muted-foreground sm:text-base">
              {uiText.cleanDescription}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant={activeStatus === 'ALL' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveStatus('ALL')}
            >
              {`${uiText.all} (${orders.length})`}
            </Button>
            {(['PENDING', 'PAID', 'CANCELED'] as const).map((status) => (
              <Button
                key={status}
                type="button"
                variant={activeStatus === status ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveStatus(status)}
              >
                {`${t(`status.${status}`)} (${statusCounts[status] ?? 0})`}
              </Button>
            ))}
            <Button
              type="button"
              variant={followUpOnly ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFollowUpOnly((current) => !current)}
            >
              {`${uiText.followUp} (${followUpCount})`}
            </Button>
          </div>

          <div className="rounded-[1.5rem] border border-border/65 bg-background/72 px-4 py-3">
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              {uiText.resultLabel}
            </p>
            <p className="mt-2 text-sm text-foreground">
              {query || activeStatus !== 'ALL' || followUpOnly
                ? `${filteredOrders.length} ${uiText.shown}`
                : shellT('ordersSummary', { count: orders.length })}
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-[2rem] border border-border/70 bg-[rgba(31,22,19,0.9)] p-3 shadow-[0_20px_50px_rgba(0,0,0,0.18)] sm:p-4">
        <div className="grid gap-3">
          {filteredOrders.map((order) => (
            <Card
              key={order.orderNo}
              className="border-border/65 bg-background/68 shadow-none transition hover:border-[#c4917e] hover:bg-background/82"
            >
              <CardContent className="grid gap-4 p-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:p-5">
                <div className="flex min-w-0 flex-col gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <CardTitle className="text-lg font-semibold tracking-tight text-foreground sm:text-[1.1rem]">
                      {order.orderNo}
                    </CardTitle>
                    <Badge
                      variant={getOrderStatusBadgeVariant(order.status)}
                      className={getOrderStatusBadgeClassName(order.status)}
                    >
                      {t(`status.${order.status}`)}
                    </Badge>
                    {order.hasPendingCancellationRequest ? (
                      <Badge variant="outline">
                        {t('pendingCancellation')}
                      </Badge>
                    ) : null}
                    {unreadOrderNotifications[order.orderNo] ? (
                      <Badge
                        variant="outline"
                        className="border-[#b96f5a]/40 bg-[#b96f5a]/14 text-[#f0d2c4]"
                      >
                        {t('hasNotification', {
                          count: unreadOrderNotifications[order.orderNo],
                        })}
                      </Badge>
                    ) : null}
                  </div>
                </div>

                <div className="flex justify-start sm:justify-end">
                  <Button asChild variant="outline">
                    <Link href={`/admin/orders/${order.orderNo}`}>
                      {t('viewOrder')}
                      <ArrowRightIcon data-icon="inline-end" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}

          {filteredOrders.length === 0 ? (
            <Card className="border-border/70 bg-[rgba(255,250,247,0.82)] shadow-[0_20px_50px_rgba(126,76,57,0.08)] dark:bg-[rgba(34,25,21,0.82)]">
              <CardContent className="flex flex-col gap-2 p-6">
                <p className="text-lg font-semibold text-foreground">
                  {shellT('ordersEmptyTitle')}
                </p>
                <p className="text-sm leading-6 text-muted-foreground">
                  {shellT('ordersEmptyDescription')}
                </p>
              </CardContent>
            </Card>
          ) : null}
        </div>
      </section>
    </main>
  );
}

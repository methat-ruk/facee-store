'use client';

import { ArrowRightIcon, SearchIcon } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  getAdminOrdersPageText,
  getAdminOrdersTableColumns,
} from '@/features/admin-orders/messages';
import type { OrderListItem } from '@/features/orders/schemas';
import {
  formatOrderDate,
  formatOrderPrice,
  getOrderStatusBadgeClassName,
  getOrderStatusBadgeVariant,
} from '@/features/orders/ui';
import { Link, usePathname, useRouter } from '@/i18n/navigation';
import { listAdminOrders } from '@/services/orders';
import { useNotificationsStore } from '@/store/use-notifications-store';

const ROWS_PER_PAGE_OPTIONS = [12, 25, 50] as const;

export function AdminOrdersPage() {
  const t = useTranslations('adminOrders');
  const shellT = useTranslations('admin');
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [orders, setOrders] = useState<OrderListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [activeStatus, setActiveStatus] = useState<
    'ALL' | OrderListItem['status']
  >('ALL');
  const [followUpOnly, setFollowUpOnly] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const notifications = useNotificationsStore((state) => state.items);
  const requestedPage = Number(searchParams.get('page') ?? '1');
  const requestedLimit = Number(searchParams.get('limit') ?? '25');
  const limit = ROWS_PER_PAGE_OPTIONS.includes(requestedLimit as 12 | 25 | 50)
    ? (requestedLimit as (typeof ROWS_PER_PAGE_OPTIONS)[number])
    : 25;
  const pageText = getAdminOrdersPageText(locale);
  const columns = getAdminOrdersTableColumns(locale);

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

  const setParam = useCallback(
    (name: string, value?: string) => {
      const params = new URLSearchParams(searchParams.toString());

      if (!value) {
        params.delete(name);
      } else {
        params.set(name, value);
      }

      if (name !== 'page') {
        params.set('page', '1');
      }

      const nextQuery = params.toString();
      router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname);
    },
    [pathname, router, searchParams],
  );

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
        order.refundStatus,
      ]
        .join(' ')
        .toLowerCase();

      const matchesSearch = searchValue.trim()
        ? haystack.includes(searchValue.trim().toLowerCase())
        : true;

      const matchesStatus =
        activeStatus === 'ALL' || order.status === activeStatus;
      const matchesFollowUp = !followUpOnly
        ? true
        : order.status === 'PENDING' ||
          order.hasPendingCancellationRequest ||
          order.refundStatus === 'PENDING_MANUAL';

      return matchesSearch && matchesStatus && matchesFollowUp;
    });
  }, [activeStatus, followUpOnly, orders, searchValue]);

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / limit));
  const currentPage = Math.min(
    Math.max(1, Number.isFinite(requestedPage) ? requestedPage : 1),
    totalPages,
  );

  useEffect(() => {
    if (requestedPage !== currentPage) {
      setParam('page', String(currentPage));
    }
  }, [currentPage, requestedPage, setParam]);

  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * limit,
    currentPage * limit,
  );

  if (isLoading) {
    return (
      <main className="flex min-h-128 items-center justify-center px-1 py-6">
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
              {pageText.allOrders}
            </h2>
            <p className="max-w-3xl text-sm leading-7 text-muted-foreground sm:text-base">
              {pageText.cleanDescription}
            </p>
          </div>

          <div className="flex min-w-0 items-center gap-2 rounded-full border border-border/70 bg-background/72 px-4 py-2">
            <SearchIcon className="size-4 text-muted-foreground" />
            <Input
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
              placeholder={pageText.searchPlaceholder}
              className="border-none bg-transparent px-0 text-foreground shadow-none focus-visible:ring-0 dark:bg-transparent!"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant={activeStatus === 'ALL' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveStatus('ALL')}
            >
              {`${pageText.all} (${orders.length})`}
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
              {`${pageText.followUp} (${followUpCount})`}
            </Button>
          </div>
        </div>
      </section>

      <section className="rounded-[2rem] border border-border/70 bg-[rgba(31,22,19,0.9)] p-3 shadow-[0_20px_50px_rgba(0,0,0,0.18)] sm:p-4">
        <div className="grid gap-3">
          {paginatedOrders.length > 0 ? (
            <div className="overflow-x-auto rounded-[1.6rem] border border-border/65 bg-background/68">
              <table className="w-full min-w-[1120px] border-separate border-spacing-0">
                <thead>
                  <tr className="text-left">
                    <th className="px-4 py-3 text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground sm:px-5">
                      {columns.order}
                    </th>
                    <th className="px-4 py-3 text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      {columns.customer}
                    </th>
                    <th className="px-4 py-3 text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      {columns.createdAt}
                    </th>
                    <th className="px-4 py-3 text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      {columns.items}
                    </th>
                    <th className="px-4 py-3 text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      {columns.total}
                    </th>
                    <th className="px-4 py-3 text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      {columns.status}
                    </th>
                    <th className="px-4 py-3 text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      {columns.followUp}
                    </th>
                    <th className="px-4 py-3 text-right text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground sm:px-5">
                      {t('viewOrder')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedOrders.map((order) => (
                    <tr
                      key={order.orderNo}
                      className="transition hover:bg-[rgba(53,37,31,0.34)]"
                    >
                      <td className="border-t border-border/60 px-4 py-4 align-top sm:px-5">
                        <div className="min-w-0">
                          <CardTitle className="text-base font-semibold tracking-tight text-foreground">
                            {order.orderNo}
                          </CardTitle>
                          {unreadOrderNotifications[order.orderNo] ? (
                            <p className="mt-1 text-xs text-[#f0d2c4]">
                              {t('hasNotification', {
                                count: unreadOrderNotifications[order.orderNo],
                              })}
                            </p>
                          ) : null}
                        </div>
                      </td>
                      <td className="border-t border-border/60 px-4 py-4 align-top">
                        <p className="truncate text-sm font-medium text-foreground">
                          {order.contact.fullName}
                        </p>
                      </td>
                      <td className="border-t border-border/60 px-4 py-4 align-top text-sm text-muted-foreground">
                        {formatOrderDate(order.createdAt, locale)}
                      </td>
                      <td className="border-t border-border/60 px-4 py-4 align-top text-sm text-muted-foreground">
                        <p className="font-medium text-foreground">
                          {order.itemCount}
                        </p>
                      </td>
                      <td className="border-t border-border/60 px-4 py-4 align-top text-sm font-medium text-foreground">
                        {formatOrderPrice(order.total, locale)}
                      </td>
                      <td className="border-t border-border/60 px-4 py-4 align-top">
                        <Badge
                          variant={getOrderStatusBadgeVariant(order.status)}
                          className={getOrderStatusBadgeClassName(order.status)}
                        >
                          {t(`status.${order.status}`)}
                        </Badge>
                      </td>
                      <td className="border-t border-border/60 px-4 py-4 align-top">
                        {order.hasPendingCancellationRequest ? (
                          <Badge variant="outline">
                            {t('pendingCancellation')}
                          </Badge>
                        ) : (
                          <span className="text-sm text-muted-foreground">
                            —
                          </span>
                        )}
                      </td>
                      <td className="border-t border-border/60 px-4 py-4 text-right align-top sm:px-5">
                        <Button asChild variant="outline" size="sm">
                          <Link href={`/admin/orders/${order.orderNo}`}>
                            {t('viewOrder')}
                            <ArrowRightIcon data-icon="inline-end" />
                          </Link>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}

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

          {filteredOrders.length > 0 ? (
            <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground">
                  {pageText.rowsPerPage}
                </span>
                <Select
                  value={String(limit)}
                  onValueChange={(value) => setParam('limit', value)}
                >
                  <SelectTrigger className="w-26">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ROWS_PER_PAGE_OPTIONS.map((option) => (
                      <SelectItem key={option} value={String(option)}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between gap-3 sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  disabled={currentPage <= 1}
                  onClick={() => setParam('page', String(currentPage - 1))}
                >
                  {pageText.previous}
                </Button>
                <p className="text-sm text-muted-foreground">
                  {currentPage} / {totalPages}
                </p>
                <Button
                  type="button"
                  variant="outline"
                  disabled={currentPage >= totalPages}
                  onClick={() => setParam('page', String(currentPage + 1))}
                >
                  {pageText.next}
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      </section>
    </main>
  );
}

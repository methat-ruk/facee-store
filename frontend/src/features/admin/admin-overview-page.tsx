'use client';

import {
  ArrowRightIcon,
  BanknoteArrowUpIcon,
  BoxesIcon,
  CalendarRangeIcon,
  ChevronRightIcon,
  ShieldAlertIcon,
  ShoppingCartIcon,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import type { DateRange } from 'react-day-picker';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import type { AdminDashboard } from '@/features/admin/schemas';
import {
  formatOrderDate,
  formatOrderPrice,
  getOrderStatusBadgeClassName,
  getOrderStatusBadgeVariant,
} from '@/features/orders/ui';
import { Link } from '@/i18n/navigation';
import { getAdminDashboard } from '@/services/admin';

function getCurrentMonthRange(now = new Date()): DateRange {
  const from = new Date(now.getFullYear(), now.getMonth(), 1);
  const to = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  return { from, to };
}

function buildBangkokUtcIso(date: Date, includeNextDay = false) {
  const year = date.getFullYear();
  const month = date.getMonth();
  const day = date.getDate();
  const utcMs =
    Date.UTC(year, month, day + (includeNextDay ? 1 : 0), 0, 0, 0) -
    7 * 60 * 60 * 1000;

  return new Date(utcMs).toISOString();
}

function formatRangeLabel(
  locale: string,
  range: DateRange | undefined,
  fallback: string,
) {
  if (!range?.from || !range.to) {
    return fallback;
  }

  const formatter = new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return `${formatter.format(range.from)} - ${formatter.format(range.to)}`;
}

function KpiCard({
  label,
  value,
  note,
  icon: Icon,
}: {
  label: string;
  value: string;
  note: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Card className="border-border/70 bg-[rgba(31,22,19,0.9)] shadow-[0_20px_50px_rgba(0,0,0,0.18)]">
      <CardContent className="flex items-start justify-between gap-4 p-5">
        <div className="space-y-2">
          <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            {label}
          </p>
          <p className="text-3xl font-semibold tracking-tight text-foreground">
            {value}
          </p>
          <p className="text-sm leading-6 text-muted-foreground">{note}</p>
        </div>
        <span className="flex size-12 shrink-0 items-center justify-center rounded-full border border-border/60 bg-[rgba(62,41,34,0.72)] text-[#d59a83]">
          <Icon className="size-5" />
        </span>
      </CardContent>
    </Card>
  );
}

export function AdminOverviewPage() {
  const t = useTranslations('admin');
  const locale = useLocale();
  const [dashboard, setDashboard] = useState<AdminDashboard | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [selectedRange, setSelectedRange] = useState<DateRange | undefined>(
    () => getCurrentMonthRange(),
  );

  const uiText =
    locale === 'th'
      ? {
          greeting: 'สวัสดี แอดมิน',
          summary:
            'นี่คือภาพรวมงานคำสั่งซื้อ สต็อก และคำขอที่ต้องตัดสินใจในช่วงเวลาที่เลือก',
          rangeLabel: 'ช่วงเวลา',
          chooseRange: 'เลือกช่วงวันที่',
          resetMonth: 'เดือนนี้',
          reviewQueue: 'ดูคำขอทั้งหมด',
          reviewOrders: 'ดูออเดอร์ทั้งหมด',
          quickActions: 'ทางลัด',
          quickActionsDescription:
            'เข้าถึงงานหลักได้เร็วขึ้นโดยไม่ต้องออกจาก overview',
          openOrders: 'Review orders',
          openStorefront: 'Open storefront',
          restockFocus: 'Stock focus',
          pendingOrdersNote: 'ออเดอร์ที่ยังเปิดอยู่ภายในช่วงวันที่เลือก',
          pendingReviewsNote: 'คำขอยกเลิกที่ยังรอการอนุมัติในช่วงวันที่เลือก',
          lowStockNote: 'สินค้าที่เผยแพร่อยู่และมีสต็อก 10 ชิ้นหรือน้อยกว่า',
          revenueNote: 'ยอดชำระเงินสำเร็จในช่วงวันที่เลือก',
          queueTitle: 'คำขอยกเลิกที่ต้องตรวจสอบ',
          queueDescription:
            'รายการที่ชำระแล้วหรือกำลังแพ็กที่ยังต้องการการตัดสินใจจากแอดมิน',
          stockViewAll: 'ดูสินค้าคงเหลือต่ำ',
          currentMonth: 'เดือนปัจจุบัน',
        }
      : {
          greeting: 'Good morning, Admin',
          summary:
            "Here's what's happening across orders, payments, and stock in the selected range.",
          rangeLabel: 'Date range',
          chooseRange: 'Choose a range',
          resetMonth: 'This month',
          reviewQueue: 'View all reviews',
          reviewOrders: 'View all orders',
          quickActions: 'Quick actions',
          quickActionsDescription:
            'Move straight into the review surfaces that matter most today.',
          openOrders: 'Review orders',
          openStorefront: 'Open storefront',
          restockFocus: 'Stock focus',
          pendingOrdersNote: 'Orders still open inside the selected range.',
          pendingReviewsNote: 'Cancellation requests waiting for a decision.',
          lowStockNote: 'Current published inventory at 10 units or below.',
          revenueNote:
            'Completed payments captured inside this selected range.',
          queueTitle: 'Cancellation requests needing review',
          queueDescription:
            'Paid or packing orders waiting for a manual admin decision.',
          stockViewAll: 'View all stock alerts',
          currentMonth: 'Current month',
        };

  const resolvedRange = useMemo(() => {
    const currentMonth = getCurrentMonthRange();
    return selectedRange?.from && selectedRange.to
      ? selectedRange
      : currentMonth;
  }, [selectedRange]);

  const rangeLabel = useMemo(
    () => formatRangeLabel(locale, resolvedRange, uiText.currentMonth),
    [locale, resolvedRange, uiText.currentMonth],
  );

  async function requestDashboard(range: DateRange) {
    if (!range.from || !range.to) {
      return;
    }

    try {
      const response = await getAdminDashboard({
        preset: 'range',
        start: buildBangkokUtcIso(range.from),
        end: buildBangkokUtcIso(range.to, true),
      });
      setDashboard(response);
      setHasError(false);
    } catch {
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (!resolvedRange.from || !resolvedRange.to) {
      return;
    }

    const rangeFrom = resolvedRange.from;
    const rangeTo = resolvedRange.to;
    let isCancelled = false;

    void (async () => {
      try {
        const response = await getAdminDashboard({
          preset: 'range',
          start: buildBangkokUtcIso(rangeFrom),
          end: buildBangkokUtcIso(rangeTo, true),
        });

        if (isCancelled) {
          return;
        }

        setDashboard(response);
        setHasError(false);
      } catch {
        if (isCancelled) {
          return;
        }

        setHasError(true);
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    })();

    return () => {
      isCancelled = true;
    };
  }, [resolvedRange]);

  if (isLoading) {
    return (
      <main className="flex min-h-160 items-center justify-center px-4 py-8">
        <p className="text-sm font-medium text-muted-foreground">
          {t('loading')}
        </p>
      </main>
    );
  }

  if (hasError || !dashboard) {
    return (
      <main className="px-4 py-6 sm:px-1">
        <Card className="border-border/70 bg-[rgba(31,22,19,0.9)] shadow-[0_20px_50px_rgba(0,0,0,0.18)]">
          <CardContent className="flex flex-col items-start gap-4 p-6">
            <div className="space-y-2">
              <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                {t('errorEyebrow')}
              </p>
              <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                {t('errorTitle')}
              </h2>
              <p className="text-sm leading-6 text-muted-foreground">
                {t('errorDescription')}
              </p>
            </div>
            <Button
              type="button"
              onClick={() => {
                setIsLoading(true);
                setHasError(false);
                void requestDashboard(resolvedRange);
              }}
            >
              {t('retry')}
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  const summary = dashboard.summary;

  return (
    <main className="flex flex-col gap-5 px-1 pb-4">
      <section className="rounded-[2rem] border border-border/70 bg-[rgba(31,22,19,0.9)] p-5 shadow-[0_20px_50px_rgba(0,0,0,0.18)]">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div className="space-y-3">
            <h2 className="font-serif text-[2rem] leading-none tracking-[0.01em] text-[#fbf1eb] sm:text-[2.25rem]">
              {uiText.greeting}
            </h2>
            <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
              {uiText.summary}
            </p>
          </div>

          <div className="flex flex-col gap-3 xl:min-w-[20rem] xl:items-end">
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              {uiText.rangeLabel}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="min-w-[18rem] justify-between rounded-full"
                  >
                    <span className="flex items-center gap-2">
                      <CalendarRangeIcon data-icon="inline-start" />
                      {rangeLabel}
                    </span>
                    <ChevronRightIcon data-icon="inline-end" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  align="end"
                  className="w-auto rounded-[1.5rem] border border-border/70 bg-[rgba(27,19,17,0.98)] p-0"
                >
                  <Calendar
                    mode="range"
                    numberOfMonths={2}
                    defaultMonth={resolvedRange.from}
                    selected={resolvedRange}
                    onSelect={(range) => {
                      if (!range?.from || !range.to) {
                        setSelectedRange(range);
                        return;
                      }

                      setIsLoading(true);
                      setSelectedRange(range);
                      setIsCalendarOpen(false);
                    }}
                  />
                  <div className="flex items-center justify-between border-t border-border/60 px-4 py-3">
                    <p className="text-xs text-muted-foreground">
                      {uiText.chooseRange}
                    </p>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setIsLoading(true);
                        setSelectedRange(getCurrentMonthRange());
                        setIsCalendarOpen(false);
                      }}
                    >
                      {uiText.resetMonth}
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>

              <Button asChild>
                <Link href="/admin/orders">
                  {t('reviewOrders')}
                  <ArrowRightIcon data-icon="inline-end" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label={t('kpis.pendingOrders')}
          value={String(summary.pendingOrdersCount)}
          note={uiText.pendingOrdersNote}
          icon={ShoppingCartIcon}
        />
        <KpiCard
          label={t('kpis.cancellationReviews')}
          value={String(summary.pendingCancellationCount)}
          note={uiText.pendingReviewsNote}
          icon={ShieldAlertIcon}
        />
        <KpiCard
          label={t('kpis.lowStock')}
          value={String(summary.lowStockProductsCount)}
          note={uiText.lowStockNote}
          icon={BoxesIcon}
        />
        <KpiCard
          label={t('kpis.todayRevenue')}
          value={formatOrderPrice(summary.paidTodayRevenue, locale)}
          note={uiText.revenueNote}
          icon={BanknoteArrowUpIcon}
        />
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.45fr)_24rem]">
        <div className="grid gap-5">
          <Card className="border-border/70 bg-[rgba(31,22,19,0.9)] shadow-[0_20px_50px_rgba(0,0,0,0.18)]">
            <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
              <div className="space-y-2">
                <CardTitle className="text-xl">{uiText.queueTitle}</CardTitle>
                <p className="text-sm leading-6 text-muted-foreground">
                  {uiText.queueDescription}
                </p>
              </div>
              <Button asChild variant="ghost" size="sm">
                <Link href="/admin/orders">{uiText.reviewQueue}</Link>
              </Button>
            </CardHeader>
            <CardContent className="grid gap-3">
              {dashboard.pendingCancellationRequests.length > 0 ? (
                dashboard.pendingCancellationRequests.map((request) => (
                  <Link
                    key={request.requestId}
                    href={`/admin/orders/${request.orderNo}`}
                    className="grid gap-3 rounded-[1.5rem] border border-border/65 bg-background/74 p-4 transition hover:border-[#c4917e] hover:bg-background/92 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)_auto]"
                  >
                    <div className="space-y-1">
                      <p className="font-semibold text-foreground">
                        {request.orderNo}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {request.customerName}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <Badge variant="outline">
                        {t(`cancellationReasons.${request.reasonCode}`)}
                      </Badge>
                      <p className="text-sm text-muted-foreground">
                        {formatOrderDate(request.requestedAt, locale)}
                      </p>
                    </div>
                    <div className="flex items-center justify-between gap-3 lg:justify-end">
                      <span className="text-sm font-medium text-foreground">
                        {formatOrderPrice(request.orderTotal, locale)}
                      </span>
                      <Button variant="outline" size="sm">
                        {t('reviewOrders')}
                      </Button>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="rounded-[1.5rem] border border-dashed border-border/70 bg-background/68 p-5 text-sm leading-6 text-muted-foreground">
                  {t('queueEmpty')}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/70 bg-[rgba(31,22,19,0.9)] shadow-[0_20px_50px_rgba(0,0,0,0.18)]">
            <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
              <div className="space-y-2">
                <CardTitle className="text-xl">
                  {t('recentOrdersTitle')}
                </CardTitle>
                <p className="text-sm leading-6 text-muted-foreground">
                  {t('recentOrdersDescription')}
                </p>
              </div>
              <Button asChild variant="ghost" size="sm">
                <Link href="/admin/orders">{uiText.reviewOrders}</Link>
              </Button>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <table className="min-w-full border-separate border-spacing-y-3">
                <thead>
                  <tr className="text-left text-[0.72rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    <th className="pb-1 pr-4">{t('table.order')}</th>
                    <th className="pb-1 pr-4">{t('table.customer')}</th>
                    <th className="pb-1 pr-4">{t('table.status')}</th>
                    <th className="pb-1 pr-4">{t('table.payment')}</th>
                    <th className="pb-1 pr-4">{t('table.total')}</th>
                    <th className="pb-1 pr-4">{t('table.updated')}</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboard.recentOrders.map((order) => (
                    <tr
                      key={order.orderNo}
                      className="rounded-[1.4rem] bg-background/72"
                    >
                      <td className="rounded-l-[1.4rem] border-y border-l border-border/60 px-4 py-4">
                        <Link
                          href={`/admin/orders/${order.orderNo}`}
                          className="inline-flex border-b border-[#c4917e] pb-0.5 font-semibold leading-none text-foreground transition hover:border-[#a1604d] hover:text-[#a1604d]"
                        >
                          {order.orderNo}
                        </Link>
                      </td>
                      <td className="border-y border-border/60 px-4 py-4 text-sm text-muted-foreground">
                        {order.contact.fullName}
                      </td>
                      <td className="border-y border-border/60 px-4 py-4">
                        <Badge
                          variant={getOrderStatusBadgeVariant(order.status)}
                          className={getOrderStatusBadgeClassName(order.status)}
                        >
                          {t(`orderStatuses.${order.status}`)}
                        </Badge>
                      </td>
                      <td className="border-y border-border/60 px-4 py-4 text-sm text-muted-foreground">
                        {t(`paymentMethods.${order.paymentMethod}`)}
                      </td>
                      <td className="border-y border-border/60 px-4 py-4 text-sm font-medium text-foreground">
                        {formatOrderPrice(order.total, locale)}
                      </td>
                      <td className="rounded-r-[1.4rem] border-y border-r border-border/60 px-4 py-4 text-sm text-muted-foreground">
                        {formatOrderDate(order.createdAt, locale)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-5">
          <Card className="border-border/70 bg-[rgba(31,22,19,0.9)] shadow-[0_20px_50px_rgba(0,0,0,0.18)]">
            <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
              <div className="space-y-2">
                <CardTitle className="text-xl">
                  {t('stockAlertsTitle')}
                </CardTitle>
                <p className="text-sm leading-6 text-muted-foreground">
                  {t('stockAlertsDescription')}
                </p>
              </div>
              <Button asChild variant="ghost" size="sm">
                <Link href="/admin/orders">{uiText.stockViewAll}</Link>
              </Button>
            </CardHeader>
            <CardContent className="grid gap-3">
              {dashboard.stockAlerts.length > 0 ? (
                dashboard.stockAlerts.map((alert) => (
                  <div
                    key={alert.productId}
                    className="rounded-[1.45rem] border border-border/65 bg-background/74 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-foreground">
                          {alert.productName}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {alert.categoryName}
                        </p>
                      </div>
                      <Badge variant="secondary">
                        {t('stockLeft', { count: alert.stock })}
                      </Badge>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-[1.5rem] border border-dashed border-border/70 bg-background/68 p-5 text-sm leading-6 text-muted-foreground">
                  {t('stockAlertsEmpty')}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/70 bg-[rgba(31,22,19,0.9)] shadow-[0_20px_50px_rgba(0,0,0,0.18)]">
            <CardHeader className="space-y-2">
              <CardTitle className="text-xl">{uiText.quickActions}</CardTitle>
              <p className="text-sm leading-6 text-muted-foreground">
                {uiText.quickActionsDescription}
              </p>
            </CardHeader>
            <CardContent className="grid gap-3">
              <Button
                asChild
                variant="outline"
                className="justify-between rounded-[1.4rem]"
              >
                <Link href="/admin/orders">
                  {uiText.openOrders}
                  <ArrowRightIcon data-icon="inline-end" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="justify-between rounded-[1.4rem]"
              >
                <Link href="/products">
                  {uiText.openStorefront}
                  <ArrowRightIcon data-icon="inline-end" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="justify-between rounded-[1.4rem]"
              >
                <Link href="/admin/orders">
                  {uiText.restockFocus}
                  <ArrowRightIcon data-icon="inline-end" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  );
}

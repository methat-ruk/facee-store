'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import {
  CalendarClockIcon,
  CreditCardIcon,
  MapPinIcon,
  Package2Icon,
  PhoneIcon,
  ReceiptTextIcon,
  ScrollTextIcon,
  UserRoundIcon,
} from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { getAdminOrderDetailText } from '@/features/admin-orders/messages';
import type { OrderDetail } from '@/features/orders/schemas';
import {
  formatOrderDate,
  formatOrderPrice,
  getOrderStatusBadgeClassName,
  getOrderStatusBadgeVariant,
  getPaymentDemoStatusTranslationKey,
  getPaymentMethodTranslationKey,
} from '@/features/orders/ui';
import { Link } from '@/i18n/navigation';
import {
  confirmAdminQrPayment,
  getAdminOrderDetail,
  reviewCancellationRequest,
  updateOrderRefundStatus,
} from '@/services/orders';
import { useNotificationsStore } from '@/store/use-notifications-store';

type AdminOrderDetailPageProps = {
  orderNo: string;
};

export function AdminOrderDetailPage({ orderNo }: AdminOrderDetailPageProps) {
  const t = useTranslations('adminOrders');
  const ordersT = useTranslations('orders');
  const locale = useLocale();
  const detailText = getAdminOrderDetailText(locale);
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [reviewNote, setReviewNote] = useState('');
  const [refundStatus, setRefundStatus] = useState<
    'PENDING_MANUAL' | 'REFUNDED'
  >('PENDING_MANUAL');
  const [confirmAction, setConfirmAction] = useState<
    'approve' | 'reject' | 'save-refund' | 'confirm-qr' | null
  >(null);
  const markOrderAsRead = useNotificationsStore(
    (state) => state.markOrderAsRead,
  );

  useEffect(() => {
    let isCancelled = false;

    void getAdminOrderDetail(orderNo)
      .then((response) => {
        if (isCancelled) {
          return;
        }

        setOrder(response);
        setRefundStatus(
          response.refundStatus === 'REFUNDED' ? 'REFUNDED' : 'PENDING_MANUAL',
        );
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
  }, [orderNo]);

  useEffect(() => {
    void markOrderAsRead(orderNo);
  }, [markOrderAsRead, orderNo]);

  if (isLoading) {
    return (
      <main className="flex min-h-[32rem] items-center justify-center px-1 py-6">
        <p className="text-sm font-medium text-muted-foreground">
          {t('loading')}
        </p>
      </main>
    );
  }

  if (hasError || !order) {
    return (
      <main className="px-1 py-6">
        <Card className="border-border/70 bg-[rgba(31,22,19,0.9)] shadow-[0_20px_50px_rgba(0,0,0,0.18)]">
          <CardContent className="flex flex-col gap-4 p-6">
            <h2 className="text-2xl font-semibold tracking-tight text-foreground">
              {t('loading')}
            </h2>
            <p className="text-sm leading-6 text-muted-foreground">
              Unable to load this admin order right now.
            </p>
          </CardContent>
        </Card>
      </main>
    );
  }

  const latestRequest = order.latestCancellationRequest;
  const canConfirmQrPayment =
    order.status === 'PENDING' &&
    order.paymentMethod === 'QR_PAYMENT' &&
    order.paymentDemoStatus === 'QR_SUBMITTED';
  const latestCancellationLabel = latestRequest
    ? t(`cancellationRequestStatus.${latestRequest.status}`)
    : t('noCancellationRequest');

  return (
    <main className="flex flex-col gap-5 px-1 pb-5">
      <Link
        href="/admin/orders"
        className="text-sm font-medium text-muted-foreground underline underline-offset-4"
      >
        {t('backToOrders')}
      </Link>

      <section className="overflow-hidden rounded-[2rem] border border-border/70 bg-[rgba(31,22,19,0.9)] p-6 shadow-[0_20px_50px_rgba(0,0,0,0.18)] sm:p-7">
        <div className="flex flex-col gap-5">
          <div className="self-start space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                {order.orderNo}
              </h2>
              <Badge
                variant={getOrderStatusBadgeVariant(order.status)}
                className={getOrderStatusBadgeClassName(order.status)}
              >
                {t(`status.${order.status}`)}
              </Badge>
              <Badge
                variant="outline"
                className="border-border bg-background/70"
              >
                {t(`refundStatus.${order.refundStatus}`)}
              </Badge>
            </div>
            <p className="max-w-3xl text-sm leading-7 text-muted-foreground">
              {detailText.intro}
            </p>
            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <CalendarClockIcon className="size-4 text-[#d59a83]" />
              <span>{formatOrderDate(order.createdAt, locale)}</span>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <HeroStat
              label={ordersT('itemsTitle')}
              value={String(order.items.length)}
              note={ordersT('itemQuantity', {
                count: order.items.reduce(
                  (sum, item) => sum + item.quantity,
                  0,
                ),
              })}
              icon={<Package2Icon className="size-4" />}
            />
            <HeroStat
              label={ordersT('total')}
              value={formatOrderPrice(order.total, locale)}
              note={ordersT('subtotal')}
              icon={<ReceiptTextIcon className="size-4" />}
            />
            <HeroStat
              label={ordersT('paymentStatusLabel')}
              value={ordersT(
                getPaymentDemoStatusTranslationKey(order.paymentDemoStatus),
              )}
              note={ordersT(
                getPaymentMethodTranslationKey(order.paymentMethod),
              )}
              icon={<CreditCardIcon className="size-4" />}
            />
            <HeroStat
              label={t('cancellationPanelTitle')}
              value={latestCancellationLabel}
              note={
                latestRequest
                  ? formatOrderDate(latestRequest.createdAt, locale)
                  : t('noCancellationRequest')
              }
              icon={<ScrollTextIcon className="size-4" />}
            />
          </div>
        </div>
      </section>

      <div className="grid gap-5 2xl:grid-cols-[minmax(0,1.45fr)_minmax(22rem,0.9fr)]">
        <div className="grid gap-5">
          <div className="grid gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.85fr)]">
            <Card className="border-border/70 bg-[rgba(31,22,19,0.9)] shadow-[0_20px_50px_rgba(0,0,0,0.18)]">
              <CardHeader className="pb-4">
                <CardTitle>{t('customerSnapshot')}</CardTitle>
                <CardDescription>{order.contact.fullName}</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <InfoField
                  icon={<UserRoundIcon className="size-4" />}
                  label={detailText.customerLabel}
                  value={order.contact.fullName}
                />
                <InfoField
                  icon={<PhoneIcon className="size-4" />}
                  label={detailText.phoneLabel}
                  value={order.contact.phone}
                />
                <InfoField
                  icon={<MailBadge />}
                  label="Email"
                  value={order.contact.email}
                />
                <InfoField
                  icon={<MapPinIcon className="size-4" />}
                  label={detailText.cityPostalLabel}
                  value={`${order.contact.city} ${order.contact.postalCode}`}
                />
                <div className="sm:col-span-2">
                  <InfoField
                    icon={<MapPinIcon className="size-4" />}
                    label={detailText.deliveryAddressLabel}
                    value={order.contact.addressLine}
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/70 bg-[rgba(31,22,19,0.9)] shadow-[0_20px_50px_rgba(0,0,0,0.18)]">
              <CardHeader className="pb-4">
                <CardTitle>{ordersT('totalsTitle')}</CardTitle>
                <CardDescription>
                  {detailText.totalsDescription}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-[1.35rem] border border-border bg-background/70 p-4">
                  <div className="flex items-center justify-between py-2 text-sm text-muted-foreground">
                    <span>{ordersT('subtotal')}</span>
                    <span className="font-medium text-foreground">
                      {formatOrderPrice(order.subtotal, locale)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2 text-sm text-muted-foreground">
                    <span>{ordersT('shipping')}</span>
                    <span className="font-medium text-foreground">
                      {formatOrderPrice(order.shippingTotal, locale)}
                    </span>
                  </div>
                  <Separator className="my-2 bg-border" />
                  <div className="flex items-end justify-between gap-4 py-2">
                    <span className="text-sm font-medium text-muted-foreground">
                      {ordersT('total')}
                    </span>
                    <span className="text-2xl font-semibold tracking-tight text-foreground">
                      {formatOrderPrice(order.total, locale)}
                    </span>
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
                  <InlineStat
                    label={detailText.orderStatusLabel}
                    value={t(`status.${order.status}`)}
                  />
                  <InlineStat
                    label={t('refundStatusLabel')}
                    value={t(`refundStatus.${order.refundStatus}`)}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="border-border/70 bg-[rgba(31,22,19,0.9)] shadow-[0_20px_50px_rgba(0,0,0,0.18)]">
            <CardHeader className="pb-4">
              <CardTitle>{ordersT('paymentTitle')}</CardTitle>
              <CardDescription>{ordersT('paymentDescription')}</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.8fr)]">
              <div className="grid gap-3 sm:grid-cols-2">
                <InfoField
                  icon={<CreditCardIcon className="size-4" />}
                  label={ordersT('paymentMethodLabel')}
                  value={ordersT(
                    getPaymentMethodTranslationKey(order.paymentMethod),
                  )}
                />
                <InfoField
                  icon={<ReceiptTextIcon className="size-4" />}
                  label={ordersT('paymentStatusLabel')}
                  value={ordersT(
                    getPaymentDemoStatusTranslationKey(order.paymentDemoStatus),
                  )}
                />
                {order.paymentSubmittedAt ? (
                  <InfoField
                    icon={<CalendarClockIcon className="size-4" />}
                    label={ordersT('paymentSubmittedAtLabel')}
                    value={formatOrderDate(order.paymentSubmittedAt, locale)}
                  />
                ) : null}
                {order.paymentCompletedAt ? (
                  <InfoField
                    icon={<CalendarClockIcon className="size-4" />}
                    label={ordersT('paymentCompletedAtLabel')}
                    value={formatOrderDate(order.paymentCompletedAt, locale)}
                  />
                ) : null}
              </div>

              <div className="rounded-[1.4rem] border border-border bg-background/70 p-4">
                <div className="flex h-full flex-col gap-3">
                  <p className="text-sm font-medium text-foreground">
                    {ordersT('paymentTitle')}
                  </p>
                  <p className="text-sm leading-6 text-muted-foreground">
                    {canConfirmQrPayment
                      ? t('qrAwaitingAdminConfirmation')
                      : ordersT('paymentDescription')}
                  </p>
                  <div className="mt-auto flex items-center justify-between border-t border-border pt-4">
                    <span className="text-sm text-muted-foreground">
                      {ordersT('total')}
                    </span>
                    <span className="text-xl font-semibold text-foreground">
                      {formatOrderPrice(order.total, locale)}
                    </span>
                  </div>
                  {canConfirmQrPayment ? (
                    <Button
                      type="button"
                      className="mt-1"
                      onClick={() => setConfirmAction('confirm-qr')}
                    >
                      {t('confirmQrPayment')}
                    </Button>
                  ) : null}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/70 bg-[rgba(31,22,19,0.9)] shadow-[0_20px_50px_rgba(0,0,0,0.18)]">
            <CardHeader className="pb-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <CardTitle>{ordersT('itemsTitle')}</CardTitle>
                  <CardDescription>
                    {ordersT('itemQuantity', {
                      count: order.items.reduce(
                        (sum, item) => sum + item.quantity,
                        0,
                      ),
                    })}
                  </CardDescription>
                </div>
                <Badge
                  variant="outline"
                  className="border-border bg-background/70"
                >
                  {formatOrderPrice(order.total, locale)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="grid gap-3">
              {order.items.map((item) => (
                <div
                  key={item.id}
                  className="grid gap-4 rounded-[1.5rem] border border-border bg-background/70 p-4 sm:grid-cols-[4.5rem_minmax(0,1fr)_auto] sm:items-center"
                >
                  <div className="relative size-[4.5rem] overflow-hidden rounded-[1.2rem] border border-border bg-background/80">
                    {item.productImageUrl ? (
                      <Image
                        src={item.productImageUrl}
                        alt={item.productName}
                        fill
                        sizes="72px"
                        className="object-cover object-top"
                      />
                    ) : (
                      <div className="flex size-full items-center justify-center text-xs font-medium text-muted-foreground">
                        {item.productName.slice(0, 1)}
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 space-y-1.5">
                    <p className="truncate text-base font-semibold text-foreground">
                      {item.productName}
                    </p>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                      <span>
                        {ordersT('itemQuantity', { count: item.quantity })}
                      </span>
                      <span>
                        {formatOrderPrice(item.unitPrice, locale)}{' '}
                        {detailText.each}
                      </span>
                    </div>
                  </div>

                  <div className="text-left sm:text-right">
                    <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                      {ordersT('total')}
                    </p>
                    <p className="mt-1 text-lg font-semibold text-foreground">
                      {formatOrderPrice(item.lineTotal, locale)}
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-5">
          <Card className="border-border/70 bg-[rgba(31,22,19,0.9)] shadow-[0_20px_50px_rgba(0,0,0,0.18)]">
            <CardHeader className="pb-3">
              <CardTitle>{t('cancellationPanelTitle')}</CardTitle>
              <CardDescription>
                {latestRequest
                  ? formatOrderDate(latestRequest.createdAt, locale)
                  : t('noCancellationRequest')}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {latestRequest ? (
                <>
                  <div className="rounded-[1.35rem] border border-border bg-background/70 p-3.5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="space-y-2">
                        <p className="text-base font-semibold text-foreground">
                          {t(
                            `cancellationRequestStatus.${latestRequest.status}`,
                          )}
                        </p>
                        <p className="text-sm leading-6 text-muted-foreground">
                          {latestRequest.reasonCode === 'OTHER' &&
                          latestRequest.details?.trim()
                            ? latestRequest.details
                            : t(
                                `cancellationReason.${latestRequest.reasonCode}`,
                              )}
                        </p>
                      </div>
                      <Badge
                        variant="outline"
                        className="border-border bg-background/80 text-foreground"
                      >
                        {formatOrderDate(latestRequest.createdAt, locale)}
                      </Badge>
                    </div>
                    {latestRequest.reasonCode !== 'OTHER' &&
                    latestRequest.details ? (
                      <div className="mt-3 border-t border-border pt-3 text-sm leading-6 text-muted-foreground">
                        {latestRequest.details}
                      </div>
                    ) : null}
                    {latestRequest.reviewNote ? (
                      <div className="mt-3 rounded-[1.1rem] border border-border bg-background/80 p-3">
                        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                          {t('reviewNote')}
                        </p>
                        <p className="mt-2 text-sm leading-6 text-foreground">
                          {latestRequest.reviewNote}
                        </p>
                      </div>
                    ) : null}
                  </div>
                  {latestRequest.status === 'REQUESTED' ? (
                    <>
                      <div className="flex flex-col gap-2">
                        <Label htmlFor="admin-review-note">
                          {t('reviewNote')}
                        </Label>
                        <Textarea
                          id="admin-review-note"
                          className="min-h-24 border-border bg-background/80"
                          value={reviewNote}
                          onChange={(event) =>
                            setReviewNote(event.target.value)
                          }
                        />
                      </div>
                      <div className="grid gap-2.5 sm:grid-cols-2">
                        <Button
                          type="button"
                          className="h-10 w-full"
                          onClick={() => setConfirmAction('approve')}
                        >
                          {t('approveCancellation')}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          className="h-10 w-full border-border bg-transparent"
                          onClick={() => setConfirmAction('reject')}
                        >
                          {t('rejectCancellation')}
                        </Button>
                      </div>
                    </>
                  ) : null}
                </>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {t('noCancellationRequest')}
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/70 bg-[rgba(31,22,19,0.9)] shadow-[0_20px_50px_rgba(0,0,0,0.18)]">
            <CardHeader className="pb-4">
              <CardTitle>{t('refundPanelTitle')}</CardTitle>
              <CardDescription>
                {t(`refundStatus.${order.refundStatus}`)}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="rounded-[1.3rem] border border-border bg-background/70 p-4">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm text-muted-foreground">
                    {ordersT('total')}
                  </span>
                  <span className="text-xl font-semibold text-foreground">
                    {formatOrderPrice(order.total, locale)}
                  </span>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="refund-status">{t('refundStatusLabel')}</Label>
                <Select
                  value={refundStatus}
                  onValueChange={(value) =>
                    setRefundStatus(value as 'PENDING_MANUAL' | 'REFUNDED')
                  }
                >
                  <SelectTrigger
                    id="refund-status"
                    className="w-full border-border bg-background/80"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="PENDING_MANUAL">
                        {t('refundStatus.PENDING_MANUAL')}
                      </SelectItem>
                      <SelectItem value="REFUNDED">
                        {t('refundStatus.REFUNDED')}
                      </SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
              <Button
                type="button"
                variant="outline"
                className="w-full border-border bg-transparent"
                onClick={() => setConfirmAction('save-refund')}
              >
                {t('saveRefundStatus')}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <ConfirmDialog
        open={confirmAction === 'approve'}
        title={t('confirmApproveTitle')}
        description={t('confirmApproveDescription')}
        confirmLabel={t('approveCancellation')}
        cancelLabel={t('cancelConfirm')}
        destructive
        onClose={() => setConfirmAction(null)}
        onConfirm={async () => {
          if (!latestRequest) {
            return;
          }

          const nextOrder = await reviewCancellationRequest(latestRequest.id, {
            decision: 'APPROVE',
            reviewNote,
          });
          setOrder(nextOrder);
          setConfirmAction(null);
        }}
      />
      <ConfirmDialog
        open={confirmAction === 'reject'}
        title={t('confirmRejectTitle')}
        description={t('confirmRejectDescription')}
        confirmLabel={t('rejectCancellation')}
        cancelLabel={t('cancelConfirm')}
        onClose={() => setConfirmAction(null)}
        onConfirm={async () => {
          if (!latestRequest) {
            return;
          }

          const nextOrder = await reviewCancellationRequest(latestRequest.id, {
            decision: 'REJECT',
            reviewNote,
          });
          setOrder(nextOrder);
          setConfirmAction(null);
        }}
      />
      <ConfirmDialog
        open={confirmAction === 'save-refund'}
        title={t('confirmRefundTitle')}
        description={t('confirmRefundDescription')}
        confirmLabel={t('saveRefundStatus')}
        cancelLabel={t('cancelConfirm')}
        onClose={() => setConfirmAction(null)}
        onConfirm={async () => {
          const nextOrder = await updateOrderRefundStatus(order.orderNo, {
            refundStatus,
          });
          setOrder(nextOrder);
          setConfirmAction(null);
        }}
      />
      <ConfirmDialog
        open={confirmAction === 'confirm-qr'}
        title={t('confirmQrPaymentTitle')}
        description={t('confirmQrPaymentDescription')}
        confirmLabel={t('confirmQrPayment')}
        cancelLabel={t('cancelConfirm')}
        onClose={() => setConfirmAction(null)}
        onConfirm={async () => {
          const nextOrder = await confirmAdminQrPayment(order.orderNo);
          setOrder(nextOrder);
          setConfirmAction(null);
        }}
      />
    </main>
  );
}

function HeroStat({
  label,
  value,
  note,
  icon,
}: {
  label: string;
  value: string;
  note: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-[1.35rem] border border-border bg-background/70 p-4">
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
          {label}
        </span>
        <span className="flex size-8 items-center justify-center rounded-full border border-border bg-[rgba(62,41,34,0.72)] text-[#d59a83]">
          {icon}
        </span>
      </div>
      <p className="mt-3 text-lg font-semibold leading-6 text-foreground">
        {value}
      </p>
      <p className="mt-1 text-sm leading-5 text-muted-foreground">{note}</p>
    </div>
  );
}

function InlineStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.1rem] border border-border bg-background/70 p-3">
      <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 text-sm font-medium text-foreground">{value}</p>
    </div>
  );
}

function InfoField({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[1.2rem] border border-border bg-background/70 p-4">
      <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-muted-foreground">
        <span className="text-[#d59a83]">{icon}</span>
        <span>{label}</span>
      </div>
      <p className="mt-3 text-sm leading-6 text-foreground">{value}</p>
    </div>
  );
}

function MailBadge() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="size-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3.5" y="5.5" width="17" height="13" rx="2.5" />
      <path d="m5.5 8 6.5 5 6.5-5" />
    </svg>
  );
}

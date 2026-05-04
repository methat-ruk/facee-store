'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
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
  const uiText =
    locale === 'th'
      ? {
          intro:
            'ตรวจสอบสินค้า การชำระเงิน สถานะการยกเลิก และการคืนเงินได้จากหน้าเดียว',
          each: 'ต่อชิ้น',
        }
      : {
          intro:
            'Review order items, payment snapshot, cancellation state, and refund handling from one place.',
          each: 'each',
        };
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

  return (
    <main className="flex flex-col gap-6 px-1 pb-4">
      <Link
        href="/admin/orders"
        className="text-sm font-medium text-muted-foreground underline underline-offset-4"
      >
        {t('backToOrders')}
      </Link>

      <section className="rounded-[2rem] border border-border/70 bg-[rgba(31,22,19,0.9)] p-6 shadow-[0_20px_50px_rgba(0,0,0,0.18)] sm:p-7">
        <div className="flex flex-col gap-3">
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
            <Badge variant="outline">
              {t(`refundStatus.${order.refundStatus}`)}
            </Badge>
            <span className="text-sm text-muted-foreground">
              {formatOrderDate(order.createdAt, locale)}
            </span>
          </div>
          <p className="text-sm leading-7 text-muted-foreground">
            {uiText.intro}
          </p>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_24rem]">
        <div className="grid gap-6">
          <Card className="border-border/70 bg-[rgba(31,22,19,0.9)] shadow-[0_20px_50px_rgba(0,0,0,0.18)]">
            <CardHeader>
              <CardTitle>{t('customerSnapshot')}</CardTitle>
              <CardDescription>{order.contact.fullName}</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-2 text-sm leading-7 text-muted-foreground sm:grid-cols-2">
              <p>{order.contact.email}</p>
              <p>{order.contact.phone}</p>
              <p>{order.contact.postalCode}</p>
              <p>{order.contact.city}</p>
              <p className="sm:col-span-2">{order.contact.addressLine}</p>
            </CardContent>
          </Card>

          <Card className="border-border/70 bg-[rgba(31,22,19,0.9)] shadow-[0_20px_50px_rgba(0,0,0,0.18)]">
            <CardHeader>
              <CardTitle>{ordersT('itemsTitle')}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3">
              {order.items.map((item) => (
                <div
                  key={item.id}
                  className="grid gap-3 rounded-2xl border border-border/65 bg-background/72 p-4 sm:grid-cols-[4.5rem_minmax(0,1fr)_auto]"
                >
                  <div className="relative size-[4.5rem] overflow-hidden rounded-2xl border border-border/70 bg-background/70">
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

                  <div className="min-w-0">
                    <p className="truncate text-base font-semibold text-foreground">
                      {item.productName}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {ordersT('itemQuantity', { count: item.quantity })}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {formatOrderPrice(item.unitPrice, locale)} {uiText.each}
                    </p>
                  </div>

                  <div className="text-left sm:text-right">
                    <p className="text-base font-semibold text-foreground">
                      {formatOrderPrice(item.lineTotal, locale)}
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6">
          <Card className="border-border/70 bg-[rgba(31,22,19,0.9)] shadow-[0_20px_50px_rgba(0,0,0,0.18)]">
            <CardHeader>
              <CardTitle>{ordersT('paymentTitle')}</CardTitle>
              <CardDescription>{ordersT('paymentDescription')}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 text-sm leading-7 text-muted-foreground">
              <p>
                {ordersT('paymentMethodLabel')}:{' '}
                <span className="font-medium text-foreground">
                  {ordersT(getPaymentMethodTranslationKey(order.paymentMethod))}
                </span>
              </p>
              <p>
                {ordersT('paymentStatusLabel')}:{' '}
                <span className="font-medium text-foreground">
                  {ordersT(
                    getPaymentDemoStatusTranslationKey(order.paymentDemoStatus),
                  )}
                </span>
              </p>
              {order.paymentSubmittedAt ? (
                <p>
                  {ordersT('paymentSubmittedAtLabel')}:{' '}
                  <span className="font-medium text-foreground">
                    {formatOrderDate(order.paymentSubmittedAt, locale)}
                  </span>
                </p>
              ) : null}
              {order.paymentCompletedAt ? (
                <p>
                  {ordersT('paymentCompletedAtLabel')}:{' '}
                  <span className="font-medium text-foreground">
                    {formatOrderDate(order.paymentCompletedAt, locale)}
                  </span>
                </p>
              ) : null}
              <Separator />
              <div className="flex items-center justify-between">
                <span>{ordersT('total')}</span>
                <span className="text-xl font-semibold text-foreground">
                  {formatOrderPrice(order.total, locale)}
                </span>
              </div>
              {canConfirmQrPayment ? (
                <>
                  <Separator />
                  <div className="flex flex-col gap-3">
                    <p className="text-sm text-muted-foreground">
                      {t('qrAwaitingAdminConfirmation')}
                    </p>
                    <Button
                      type="button"
                      onClick={() => setConfirmAction('confirm-qr')}
                    >
                      {t('confirmQrPayment')}
                    </Button>
                  </div>
                </>
              ) : null}
            </CardContent>
          </Card>

          <Card className="border-border/70 bg-[rgba(31,22,19,0.9)] shadow-[0_20px_50px_rgba(0,0,0,0.18)]">
            <CardHeader>
              <CardTitle>{t('cancellationPanelTitle')}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {latestRequest ? (
                <>
                  <div className="rounded-2xl border border-border bg-background/70 p-4 text-sm leading-7 text-muted-foreground">
                    <p className="font-medium text-foreground">
                      {t(`cancellationRequestStatus.${latestRequest.status}`)}
                    </p>
                    <p>{t(`cancellationReason.${latestRequest.reasonCode}`)}</p>
                    <p>{formatOrderDate(latestRequest.createdAt, locale)}</p>
                    {latestRequest.details ? (
                      <p>{latestRequest.details}</p>
                    ) : null}
                    {latestRequest.reviewNote ? (
                      <p>{latestRequest.reviewNote}</p>
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
                          value={reviewNote}
                          onChange={(event) =>
                            setReviewNote(event.target.value)
                          }
                        />
                      </div>
                      <div className="flex flex-wrap gap-3">
                        <Button
                          type="button"
                          onClick={() => setConfirmAction('approve')}
                        >
                          {t('approveCancellation')}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
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
            <CardHeader>
              <CardTitle>{t('refundPanelTitle')}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="refund-status">{t('refundStatusLabel')}</Label>
                <Select
                  value={refundStatus}
                  onValueChange={(value) =>
                    setRefundStatus(value as 'PENDING_MANUAL' | 'REFUNDED')
                  }
                >
                  <SelectTrigger id="refund-status" className="w-full">
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

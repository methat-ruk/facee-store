'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
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
import { Textarea } from '@/components/ui/textarea';
import { buildAuthNoticeHref } from '@/features/auth/auth-routing';
import type { OrderDetail } from '@/features/orders/schemas';
import {
  formatOrderPrice,
  getOrderStatusBadgeVariant,
} from '@/features/orders/ui';
import { Link, useRouter } from '@/i18n/navigation';
import {
  getAdminOrderDetail,
  reviewCancellationRequest,
  updateOrderRefundStatus,
} from '@/services/orders';
import { useAuthStore } from '@/store/use-auth-store';

type AdminOrderDetailPageProps = {
  orderNo: string;
};

export function AdminOrderDetailPage({ orderNo }: AdminOrderDetailPageProps) {
  const t = useTranslations('adminOrders');
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const isAuthInitialized = useAuthStore((state) => state.isInitialized);
  const isRestoringProfile = useAuthStore((state) => state.isRestoringProfile);
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [reviewNote, setReviewNote] = useState('');
  const [refundStatus, setRefundStatus] = useState<
    'PENDING_MANUAL' | 'REFUNDED'
  >('PENDING_MANUAL');
  const [confirmAction, setConfirmAction] = useState<
    'approve' | 'reject' | 'save-refund' | null
  >(null);

  useEffect(() => {
    if (!isAuthInitialized) {
      return;
    }

    if (!user) {
      router.replace(
        buildAuthNoticeHref(
          '/login',
          'auth-required',
          `/admin/orders/${orderNo}`,
        ),
      );
      return;
    }

    if (user.role !== 'ADMIN') {
      router.replace(buildAuthNoticeHref('/login', 'access-denied'));
      return;
    }

    let isCancelled = false;

    void getAdminOrderDetail(orderNo).then((response) => {
      if (isCancelled) {
        return;
      }

      setOrder(response);
      setRefundStatus(
        response.refundStatus === 'REFUNDED' ? 'REFUNDED' : 'PENDING_MANUAL',
      );
      setIsLoading(false);
    });

    return () => {
      isCancelled = true;
    };
  }, [isAuthInitialized, orderNo, router, user]);

  if (!isAuthInitialized || isRestoringProfile || isLoading) {
    return (
      <main className="mx-auto flex min-h-[calc(100svh-16rem)] w-full max-w-7xl items-center justify-center px-4 py-10 sm:px-6 lg:px-8">
        <p className="text-sm font-medium text-muted-foreground">
          {t('loading')}
        </p>
      </main>
    );
  }

  if (!user || user.role !== 'ADMIN' || !order) {
    return null;
  }

  const latestRequest = order.latestCancellationRequest;

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-12">
      <Link
        href="/admin/orders"
        className="text-sm font-medium text-muted-foreground underline underline-offset-4"
      >
        {t('backToOrders')}
      </Link>

      <section className="flex flex-wrap items-center gap-3">
        <h1 className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
          {order.orderNo}
        </h1>
        <Badge variant={getOrderStatusBadgeVariant(order.status)}>
          {t(`status.${order.status}`)}
        </Badge>
        <Badge variant="outline">
          {t(`refundStatus.${order.refundStatus}`)}
        </Badge>
      </section>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_24rem]">
        <Card className="border-border/80 bg-card/95">
          <CardHeader>
            <CardTitle>{t('customerSnapshot')}</CardTitle>
            <CardDescription>{order.contact.fullName}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 text-sm leading-7 text-muted-foreground">
            <p>{order.contact.email}</p>
            <p>{order.contact.phone}</p>
            <p>
              {order.contact.addressLine}, {order.contact.city}{' '}
              {order.contact.postalCode}
            </p>
            <p className="pt-2 font-medium text-foreground">
              {formatOrderPrice(order.total)}
            </p>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-6">
          <Card className="border-border/80 bg-card/95">
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
                    {latestRequest.details ? (
                      <p>{latestRequest.details}</p>
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

          <Card className="border-border/80 bg-card/95">
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
    </main>
  );
}

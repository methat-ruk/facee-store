'use client';

import {
  AlertTriangleIcon,
  ArrowLeftIcon,
  PackageCheckIcon,
  ShieldAlertIcon,
} from 'lucide-react';
import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
import { buildAuthNoticeHref } from '@/features/auth/auth-routing';
import { checkoutPrimaryButtonClassName } from '@/features/checkout/checkout-ui';
import {
  cancellationReasonCodeSchema,
  type CreateCancellationRequestInput,
  type OrderDetail,
} from '@/features/orders/schemas';
import {
  canDirectCancel,
  canRequestCancellation,
  formatOrderDate,
  formatOrderPrice,
  getPaymentDemoStatusTranslationKey,
  getPaymentMethodTranslationKey,
  getOrderStatusBadgeClassName,
  getOrderStatusBadgeVariant,
} from '@/features/orders/ui';
import { Link, useRouter } from '@/i18n/navigation';
import { isApiError } from '@/services/api-error';
import {
  cancelOrder,
  createCancellationRequest,
  getOrderDetail,
} from '@/services/orders';
import { useAuthStore } from '@/store/use-auth-store';

const cancellationReasonOptions = cancellationReasonCodeSchema.options;

type OrderDetailPageProps = {
  orderNo: string;
};

export function OrderDetailPage({ orderNo }: OrderDetailPageProps) {
  const locale = useLocale();
  const t = useTranslations('orders');
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const isAuthInitialized = useAuthStore((state) => state.isInitialized);
  const isRestoringProfile = useAuthStore((state) => state.isRestoringProfile);
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorState, setErrorState] = useState<'not-found' | 'generic' | null>(
    null,
  );
  const [actionError, setActionError] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isRequestingCancellation, setIsRequestingCancellation] =
    useState(false);
  const [confirmAction, setConfirmAction] = useState<
    'cancel' | 'request-cancellation' | null
  >(null);
  const [cancellationForm, setCancellationForm] =
    useState<CreateCancellationRequestInput>({
      reasonCode: 'WRONG_ADDRESS',
      details: '',
    });

  const latestRequest = order?.latestCancellationRequest ?? null;
  const hasPendingRequest = latestRequest?.status === 'REQUESTED';
  const shouldRequireDetails = cancellationForm.reasonCode === 'OTHER';
  const hasPendingPayment =
    order?.status === 'PENDING' && order.paymentDemoStatus === 'NOT_STARTED';

  const loadOrder = async () => {
    setErrorState(null);
    setIsLoading(true);

    try {
      const response = await getOrderDetail(orderNo);
      setOrder(response);
    } catch (error) {
      setErrorState(
        isApiError(error) && error.code === 'ORDER_NOT_FOUND'
          ? 'not-found'
          : 'generic',
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthInitialized || user) {
      return;
    }

    router.replace(
      buildAuthNoticeHref('/login', 'auth-required', `/orders/${orderNo}`),
    );
  }, [isAuthInitialized, orderNo, router, user]);

  useEffect(() => {
    if (!user) {
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

        setErrorState(
          isApiError(error) && error.code === 'ORDER_NOT_FOUND'
            ? 'not-found'
            : 'generic',
        );
        setIsLoading(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [orderNo, user]);

  const cancellationNotice = useMemo(() => {
    if (!latestRequest) {
      return null;
    }

    return t(`cancellationRequestStatus.${latestRequest.status}`);
  }, [latestRequest, t]);

  const handleDirectCancel = async () => {
    if (!order) {
      return;
    }

    setIsCancelling(true);
    setActionError(null);

    try {
      const nextOrder = await cancelOrder(order.orderNo);
      setOrder(nextOrder);
      setActionError(null);
    } catch {
      setActionError('errorCancelFailed');
    } finally {
      setIsCancelling(false);
      setConfirmAction(null);
    }
  };

  const handleRequestCancellation = async () => {
    if (!order) {
      return;
    }

    if (shouldRequireDetails && !cancellationForm.details?.trim()) {
      setActionError('errorCancellationDetailsRequired');
      return;
    }

    setIsRequestingCancellation(true);
    setActionError(null);

    try {
      const nextOrder = await createCancellationRequest(
        order.orderNo,
        cancellationForm,
      );
      setOrder(nextOrder);
      setActionError(null);
      setCancellationForm({
        reasonCode: 'WRONG_ADDRESS',
        details: '',
      });
    } catch (error) {
      setActionError(
        isApiError(error) && error.code === 'CANCELLATION_REQUEST_EXISTS'
          ? 'errorCancellationAlreadyRequested'
          : 'errorCancellationRequestFailed',
      );
    } finally {
      setIsRequestingCancellation(false);
      setConfirmAction(null);
    }
  };

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

  if (errorState) {
    return (
      <main className="mx-auto flex min-h-[calc(100svh-16rem)] w-full max-w-7xl items-center px-4 py-10 sm:px-6 lg:px-8">
        <Card className="mx-auto w-full max-w-2xl border-border/80 bg-card/95 shadow-[0_24px_70px_rgba(132,83,60,0.08)]">
          <CardHeader className="text-center">
            <CardTitle>
              {t(
                errorState === 'not-found'
                  ? 'errorNotFound'
                  : 'errorLoadFailed',
              )}
            </CardTitle>
            <CardDescription>
              {t(
                errorState === 'not-found'
                  ? 'errorNotFoundDescription'
                  : 'errorLoadDescription',
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            {errorState === 'generic' ? (
              <Button type="button" onClick={() => void loadOrder()}>
                {t('retryLoad')}
              </Button>
            ) : null}
            <Button asChild variant="outline">
              <Link href="/orders">{t('backToOrders')}</Link>
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  if (!order) {
    return null;
  }

  return (
    <main className="mx-auto flex h-full w-full max-w-7xl flex-1 flex-col gap-8 px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-12">
      <section className="flex flex-col gap-4">
        <Link
          href="/orders"
          className="inline-flex w-fit items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeftIcon className="size-4" />
          {t('backToOrders')}
        </Link>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex flex-col gap-3">
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              {t('detailEyebrow')}
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
                {t('orderNumber', { orderNo: order.orderNo })}
              </h1>
              <Badge
                variant={getOrderStatusBadgeVariant(order.status)}
                className={getOrderStatusBadgeClassName(order.status)}
              >
                {t(`status.${order.status}`)}
              </Badge>
              {order.refundStatus !== 'NONE' ? (
                <Badge variant="outline">
                  {t(`refundStatus.${order.refundStatus}`)}
                </Badge>
              ) : null}
            </div>
            <p className="text-base leading-8 text-muted-foreground">
              {formatOrderDate(order.createdAt, locale)}
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_24rem] lg:items-start">
        <div className="flex flex-col gap-6">
          <Card className="border-border/80 bg-card/95 shadow-[0_24px_70px_rgba(132,83,60,0.08)]">
            <CardHeader>
              <CardTitle>{t('contactSnapshotTitle')}</CardTitle>
              <CardDescription>
                {t('contactSnapshotDescription')}
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-2 text-sm leading-7 text-muted-foreground sm:grid-cols-2">
              <p>{order.contact.fullName}</p>
              <p>{order.contact.email}</p>
              <p>{order.contact.phone}</p>
              <p>{order.contact.postalCode}</p>
              <p className="sm:col-span-2">
                {order.contact.addressLine}, {order.contact.city}
              </p>
            </CardContent>
            <CardFooter>
              <p className="text-sm leading-7 text-muted-foreground">
                {t('addressSnapshotNote')}
              </p>
            </CardFooter>
          </Card>

          <Card className="border-border/80 bg-card/95 shadow-[0_24px_70px_rgba(132,83,60,0.08)]">
            <CardHeader>
              <CardTitle>{t('itemsTitle')}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
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
                    ) : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        {item.productSlug ? (
                          <Link
                            href={`/products/${item.productSlug}`}
                            className="truncate text-sm font-medium text-foreground underline-offset-4 hover:underline"
                          >
                            {item.productName}
                          </Link>
                        ) : (
                          <p className="truncate text-sm font-medium text-foreground">
                            {item.productName}
                          </p>
                        )}
                        <p className="mt-1 text-xs text-muted-foreground">
                          {t('itemQuantity', { count: item.quantity })}
                        </p>
                      </div>
                      <p className="shrink-0 text-sm font-medium text-foreground">
                        {formatOrderPrice(item.lineTotal, locale)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-6 lg:sticky lg:top-28">
          <Card className="border-border/80 bg-card/95 shadow-[0_24px_70px_rgba(132,83,60,0.08)]">
            <CardHeader>
              <CardTitle>{t('totalsTitle')}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{t('subtotal')}</span>
                <span className="font-medium text-foreground">
                  {formatOrderPrice(order.subtotal, locale)}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{t('shipping')}</span>
                <span className="font-medium text-foreground">
                  {formatOrderPrice(order.shippingTotal, locale)}
                </span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="font-medium text-foreground">
                  {t('total')}
                </span>
                <span className="text-2xl font-semibold text-foreground">
                  {formatOrderPrice(order.total, locale)}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/80 bg-card/95 shadow-[0_24px_70px_rgba(132,83,60,0.08)]">
            <CardHeader>
              <CardTitle>{t('paymentTitle')}</CardTitle>
              <CardDescription>{t('paymentDescription')}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 text-sm leading-7 text-muted-foreground">
              <p>
                {t('paymentMethodLabel')}:{' '}
                <span className="font-medium text-foreground">
                  {t(getPaymentMethodTranslationKey(order.paymentMethod))}
                </span>
              </p>
              <p>
                {t('paymentStatusLabel')}:{' '}
                <span className="font-medium text-foreground">
                  {t(
                    getPaymentDemoStatusTranslationKey(order.paymentDemoStatus),
                  )}
                </span>
              </p>
              {order.paymentSubmittedAt ? (
                <p>
                  {t('paymentSubmittedAtLabel')}:{' '}
                  <span className="font-medium text-foreground">
                    {formatOrderDate(order.paymentSubmittedAt, locale)}
                  </span>
                </p>
              ) : null}
              {order.paymentCompletedAt ? (
                <p>
                  {t('paymentCompletedAtLabel')}:{' '}
                  <span className="font-medium text-foreground">
                    {formatOrderDate(order.paymentCompletedAt, locale)}
                  </span>
                </p>
              ) : null}
              <p>{t(`paymentMethodNote.${order.paymentMethod}`)}</p>
              {hasPendingPayment ? (
                <div className="rounded-2xl border border-amber-300 bg-amber-100/70 px-4 py-3 text-sm leading-7 text-amber-950 dark:border-amber-400/30 dark:bg-amber-400/15 dark:text-amber-100">
                  <p className="font-medium">{t('pendingPaymentTitle')}</p>
                  <p>{t('pendingPaymentDescription')}</p>
                </div>
              ) : null}
            </CardContent>
            {hasPendingPayment ? (
              <CardFooter className="bg-transparent">
                <Button
                  asChild
                  className={`w-full ${checkoutPrimaryButtonClassName}`}
                >
                  <Link href={`/checkout/payment/${order.orderNo}`}>
                    {t('continuePayment')}
                  </Link>
                </Button>
              </CardFooter>
            ) : null}
          </Card>

          <Card className="border-border/80 bg-card/95 shadow-[0_24px_70px_rgba(132,83,60,0.08)]">
            <CardHeader>
              <CardTitle>{t('cancellationTitle')}</CardTitle>
              <CardDescription>{t('cancellationDescription')}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {latestRequest ? (
                <div className="rounded-2xl border border-border bg-background/70 p-4 text-sm leading-7 text-muted-foreground">
                  <p className="font-medium text-foreground">
                    {cancellationNotice}
                  </p>
                  <p>
                    {t('requestedAtLabel')}:{' '}
                    {formatOrderDate(latestRequest.createdAt, locale)}
                  </p>
                  <p>{t(`cancellationReason.${latestRequest.reasonCode}`)}</p>
                  {latestRequest.details ? (
                    <p>{latestRequest.details}</p>
                  ) : null}
                  {latestRequest.reviewedAt ? (
                    <p>
                      {t('reviewedAtLabel')}:{' '}
                      {formatOrderDate(latestRequest.reviewedAt, locale)}
                    </p>
                  ) : null}
                  {latestRequest.reviewNote ? (
                    <p>
                      {t('reviewNoteLabel')}: {latestRequest.reviewNote}
                    </p>
                  ) : null}
                </div>
              ) : null}

              {actionError ? (
                <div className="flex items-start gap-3 rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                  <AlertTriangleIcon className="mt-0.5 shrink-0" />
                  <p>{t(actionError)}</p>
                </div>
              ) : null}

              {canDirectCancel(order.status) ? (
                <Button
                  type="button"
                  disabled={isCancelling}
                  onClick={() => setConfirmAction('cancel')}
                >
                  <ShieldAlertIcon data-icon="inline-start" />
                  {isCancelling ? t('cancelling') : t('cancelOrder')}
                </Button>
              ) : null}

              {canRequestCancellation(order.status) ? (
                <>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="cancellation-reason">
                      {t('cancellationReasonLabel')}
                    </Label>
                    <Select
                      value={cancellationForm.reasonCode}
                      onValueChange={(value) =>
                        setCancellationForm((current) => ({
                          ...current,
                          reasonCode:
                            value as CreateCancellationRequestInput['reasonCode'],
                          details: value === 'OTHER' ? current.details : '',
                        }))
                      }
                    >
                      <SelectTrigger
                        id="cancellation-reason"
                        className="w-full"
                      >
                        <SelectValue
                          placeholder={t('cancellationReasonPlaceholder')}
                        />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          {cancellationReasonOptions.map((reasonCode) => (
                            <SelectItem key={reasonCode} value={reasonCode}>
                              {t(`cancellationReason.${reasonCode}`)}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="cancellation-details">
                      {t('cancellationDetailsLabel')}
                    </Label>
                    <Textarea
                      id="cancellation-details"
                      value={cancellationForm.details ?? ''}
                      placeholder={t('cancellationDetailsPlaceholder')}
                      onChange={(event) =>
                        setCancellationForm((current) => ({
                          ...current,
                          details: event.target.value,
                        }))
                      }
                    />
                  </div>
                  <Button
                    type="button"
                    disabled={isRequestingCancellation || hasPendingRequest}
                    onClick={() => setConfirmAction('request-cancellation')}
                  >
                    <PackageCheckIcon data-icon="inline-start" />
                    {isRequestingCancellation
                      ? t('sendingCancellationRequest')
                      : hasPendingRequest
                        ? t('cancellationAlreadyRequested')
                        : t('requestCancellation')}
                  </Button>
                </>
              ) : null}

              {order.status === 'CANCELED' ? (
                <div className="rounded-2xl border border-emerald-300 bg-emerald-100/70 px-4 py-3 text-sm leading-7 text-emerald-900 dark:border-emerald-400/30 dark:bg-emerald-400/15 dark:text-emerald-100">
                  <p className="font-medium">
                    {t('cancellationCompletedTitle')}
                  </p>
                  <p>{t('cancellationCompletedDescription')}</p>
                </div>
              ) : null}

              {!canDirectCancel(order.status) &&
              !canRequestCancellation(order.status) &&
              order.status !== 'CANCELED' ? (
                <p className="text-sm leading-7 text-muted-foreground">
                  {t('cancellationUnavailable')}
                </p>
              ) : null}
            </CardContent>
          </Card>
        </div>
      </section>
      <ConfirmDialog
        open={confirmAction === 'cancel'}
        title={t('confirmCancelTitle')}
        description={t('confirmCancelDescription')}
        confirmLabel={t('confirmCancel')}
        cancelLabel={t('cancelConfirm')}
        destructive
        isPending={isCancelling}
        onClose={() => {
          if (!isCancelling) {
            setConfirmAction(null);
          }
        }}
        onConfirm={handleDirectCancel}
      />
      <ConfirmDialog
        open={confirmAction === 'request-cancellation'}
        title={t('confirmRequestCancellationTitle')}
        description={t('confirmRequestCancellationDescription')}
        confirmLabel={t('confirmRequestCancellation')}
        cancelLabel={t('cancelConfirm')}
        destructive
        isPending={isRequestingCancellation}
        onClose={() => {
          if (!isRequestingCancellation) {
            setConfirmAction(null);
          }
        }}
        onConfirm={handleRequestCancellation}
      />
    </main>
  );
}

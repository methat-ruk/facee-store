'use client';

import {
  ArrowLeftIcon,
  CheckCircle2Icon,
  CreditCardIcon,
  QrCodeIcon,
  ShoppingCartIcon,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { buildAuthNoticeHref } from '@/features/auth/auth-routing';
import { checkoutPrimaryButtonClassName } from '@/features/checkout/checkout-ui';
import type { OrderDetail } from '@/features/orders/schemas';
import {
  formatOrderPrice,
  getPaymentDemoStatusTranslationKey,
  getPaymentMethodTranslationKey,
} from '@/features/orders/ui';
import { Link, useRouter } from '@/i18n/navigation';
import { isApiError } from '@/services/api-error';
import {
  confirmPaymentDemo,
  getOrderDetail,
  updateOrderPaymentMethod,
} from '@/services/orders';
import { useAuthStore } from '@/store/use-auth-store';

type CheckoutPaymentPageProps = {
  orderNo: string;
};

type CardFieldErrors = {
  cardholderName?: string;
  cardNumber?: string;
  expiryDate?: string;
  cvc?: string;
};

function formatExpiryDateInput(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 4);
  if (digits.length <= 2) {
    return digits;
  }

  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

function formatCardNumberInput(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 16);
  return digits.replace(/(\d{4})(?=\d)/g, '$1 ').trim();
}

function MockQrCode() {
  const cells = [
    1, 1, 1, 0, 1, 0, 1, 1, 1, 1, 0, 1, 0, 0, 1, 0, 0, 1, 1, 1, 1, 0, 1, 0, 1,
    1, 1, 0, 0, 0, 1, 0, 1, 0, 0, 0, 1, 0, 1, 1, 1, 1, 1, 0, 1, 0, 1, 0, 0, 1,
    0, 0, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 0, 0, 1, 0, 0, 1, 0, 1, 1, 1, 1,
    0, 1, 1, 1, 1, 1,
  ];

  return (
    <div className="rounded-[2rem] border border-border/80 bg-card/90 p-4 shadow-[0_24px_70px_rgba(132,83,60,0.12)]">
      <div className="grid grid-cols-9 gap-1 rounded-[1.5rem] bg-white p-4">
        {cells.map((cell, index) => (
          <div
            key={index}
            className={`aspect-square rounded-[0.28rem] ${
              cell ? 'bg-[#241712]' : 'bg-white'
            }`}
          />
        ))}
      </div>
    </div>
  );
}

export function CheckoutPaymentPage({ orderNo }: CheckoutPaymentPageProps) {
  const locale = useLocale();
  const t = useTranslations('checkoutPayment');
  const orderTranslations = useTranslations('orders');
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
  const [isConfirming, setIsConfirming] = useState(false);
  const [isUpdatingPaymentMethod, setIsUpdatingPaymentMethod] = useState(false);
  const [cardForm, setCardForm] = useState({
    cardholderName: '',
    cardNumber: '',
    expiryDate: '',
    cvc: '',
  });
  const [cardFieldErrors, setCardFieldErrors] = useState<CardFieldErrors>({});
  const cardholderInputRef = useRef<HTMLInputElement | null>(null);

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
    if (!isAuthInitialized || isRestoringProfile) {
      return;
    }

    if (!user) {
      router.replace(
        buildAuthNoticeHref(
          '/login',
          'auth-required',
          `/checkout/payment/${orderNo}`,
        ),
      );
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
  }, [isAuthInitialized, isRestoringProfile, orderNo, router, user]);

  const isAlreadyConfirmed =
    order?.paymentDemoStatus === 'QR_SUBMITTED' ||
    order?.paymentDemoStatus === 'CARD_COMPLETED';

  const paymentStatusKey = order
    ? getPaymentDemoStatusTranslationKey(order.paymentDemoStatus)
    : null;

  const paymentMethodKey = order
    ? getPaymentMethodTranslationKey(order.paymentMethod)
    : null;

  const qrSummaryReference = useMemo(
    () => orderNo.slice(-6).padStart(6, '0'),
    [orderNo],
  );

  const validateCardForm = () => {
    const nextErrors: CardFieldErrors = {};
    const digitsOnly = cardForm.cardNumber.replace(/\D/g, '');
    const expiryValue = cardForm.expiryDate.trim();
    const cvcDigits = cardForm.cvc.replace(/\D/g, '');

    if (!cardForm.cardholderName.trim()) {
      nextErrors.cardholderName = 'cardNameRequired';
    }

    if (digitsOnly.length < 12) {
      nextErrors.cardNumber = 'cardNumberInvalid';
    }

    if (!/^\d{2}\/\d{2}$/.test(expiryValue)) {
      nextErrors.expiryDate = 'cardExpiryInvalid';
    }

    if (cvcDigits.length < 3 || cvcDigits.length > 4) {
      nextErrors.cvc = 'cardCvcInvalid';
    }

    setCardFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSwitchPaymentMethod = async (
    paymentMethod: OrderDetail['paymentMethod'],
  ) => {
    if (!order || order.paymentMethod === paymentMethod || isAlreadyConfirmed) {
      return;
    }

    setIsUpdatingPaymentMethod(true);
    setActionError(null);

    try {
      const response = await updateOrderPaymentMethod(
        order.orderNo,
        paymentMethod,
      );
      setOrder(response);
      setCardFieldErrors({});
      if (paymentMethod === 'QR_PAYMENT') {
        setCardForm({
          cardholderName: '',
          cardNumber: '',
          expiryDate: '',
          cvc: '',
        });
        setCardFieldErrors({});
      } else {
        requestAnimationFrame(() => {
          cardholderInputRef.current?.focus();
        });
      }
    } catch {
      setActionError('switchPaymentMethodFailed');
    } finally {
      setIsUpdatingPaymentMethod(false);
    }
  };

  const handleConfirm = async () => {
    if (!order) {
      return;
    }

    if (order.paymentMethod === 'CARD' && !validateCardForm()) {
      return;
    }

    setIsConfirming(true);
    setActionError(null);

    try {
      const response = await confirmPaymentDemo(order.orderNo);
      setOrder(response);
      router.push(`/checkout/success/${order.orderNo}`);
    } catch (error) {
      setActionError(
        isApiError(error) &&
          error.code === 'ORDER_PAYMENT_DEMO_ALREADY_CONFIRMED'
          ? 'alreadyConfirmed'
          : 'confirmFailed',
      );
    } finally {
      setIsConfirming(false);
    }
  };

  if (!isAuthInitialized || isRestoringProfile || isLoading) {
    return (
      <main className="mx-auto flex min-h-[calc(100svh-16rem)] w-full max-w-7xl items-center justify-center px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex size-14 items-center justify-center rounded-full border border-border bg-card text-foreground shadow-[0_18px_50px_rgba(132,83,60,0.08)]">
            <ShoppingCartIcon />
          </div>
          <p className="text-sm font-medium text-muted-foreground">
            {t('loading')}
          </p>
        </div>
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
              {t(errorState === 'not-found' ? 'missingTitle' : 'errorTitle')}
            </CardTitle>
            <CardDescription>
              {t(
                errorState === 'not-found'
                  ? 'missingDescription'
                  : 'errorDescription',
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
              <Link href="/orders">{t('viewOrders')}</Link>
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
      <section className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-3">
          <Link
            href="/checkout"
            className="inline-flex w-fit items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeftIcon className="size-4" />
            {t('backToCheckout')}
          </Link>
          <div className="flex flex-col gap-3">
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              {t('eyebrow')}
            </p>
            <h1 className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
              {t('title')}
            </h1>
            <p className="max-w-2xl text-base leading-8 text-muted-foreground">
              {t('description')}
            </p>
          </div>
        </div>
        <Badge variant="outline" className="w-fit px-3 py-1 text-sm">
          {t('orderNumberValue', { orderNo: order.orderNo })}
        </Badge>
      </section>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_24rem] lg:items-start">
        <Card className="border-border/80 bg-card/95 shadow-[0_24px_70px_rgba(132,83,60,0.08)]">
          <CardHeader className="gap-3">
            <div className="flex items-center gap-3">
              <div className="flex size-12 items-center justify-center rounded-full border border-border bg-muted text-foreground">
                {order.paymentMethod === 'CARD' ? (
                  <CreditCardIcon />
                ) : (
                  <QrCodeIcon />
                )}
              </div>
              <div className="flex flex-col gap-1">
                <CardTitle>{t('paymentPanelTitle')}</CardTitle>
                <CardDescription>
                  {t('paymentPanelDescription')}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-border bg-background/70 p-4">
                <p className="text-sm font-medium text-foreground">
                  {t('methodLabel')}
                </p>
                <p className="mt-2 text-sm leading-7 text-muted-foreground">
                  {paymentMethodKey ? t(paymentMethodKey) : ''}
                </p>
              </div>
              <div className="rounded-2xl border border-border bg-background/70 p-4">
                <p className="text-sm font-medium text-foreground">
                  {t('statusLabel')}
                </p>
                <p className="mt-2 text-sm leading-7 text-muted-foreground">
                  {paymentStatusKey ? t(paymentStatusKey) : ''}
                </p>
              </div>
            </div>

            {!isAlreadyConfirmed ? (
              <div className="flex flex-col gap-3">
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {t('switchMethodTitle')}
                  </p>
                  <p className="mt-1 text-sm leading-7 text-muted-foreground">
                    {t('switchMethodDescription')}
                  </p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  {(['QR_PAYMENT', 'CARD'] as const).map((paymentMethod) => {
                    const isSelected = order.paymentMethod === paymentMethod;

                    return (
                      <button
                        key={paymentMethod}
                        type="button"
                        disabled={isUpdatingPaymentMethod}
                        className={`cursor-pointer rounded-2xl border px-4 py-4 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-70 ${
                          isSelected
                            ? 'border-foreground bg-background/90'
                            : 'border-border bg-background/70 hover:border-foreground/40 hover:bg-background/88'
                        }`}
                        onClick={() =>
                          void handleSwitchPaymentMethod(paymentMethod)
                        }
                      >
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-sm font-medium text-foreground">
                            {t(getPaymentMethodTranslationKey(paymentMethod))}
                          </p>
                          {isSelected ? (
                            <Badge variant="outline">
                              {t('selectedMethod')}
                            </Badge>
                          ) : null}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}

            {order.paymentMethod === 'QR_PAYMENT' ? (
              <div className="grid gap-6 lg:grid-cols-[18rem_minmax(0,1fr)] lg:items-start">
                <MockQrCode />
                <div className="flex flex-col gap-4 rounded-[1.75rem] border border-border bg-background/70 p-5">
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {t('qrTitle')}
                    </p>
                    <p className="mt-2 text-sm leading-7 text-muted-foreground">
                      {t('qrDescription')}
                    </p>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                        {t('qrBankLabel')}
                      </p>
                      <p className="mt-1 text-sm font-medium text-foreground">
                        FACEE DEMO BANK
                      </p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                        {t('qrReferenceLabel')}
                      </p>
                      <p className="mt-1 text-sm font-medium text-foreground">
                        #{qrSummaryReference}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                        {t('amountLabel')}
                      </p>
                      <p className="mt-1 text-sm font-medium text-foreground">
                        {formatOrderPrice(order.total, locale)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                        {t('orderStatusLabel')}
                      </p>
                      <p className="mt-1 text-sm font-medium text-foreground">
                        {orderTranslations(`status.${order.status}`)}
                      </p>
                    </div>
                  </div>
                  <div className="rounded-2xl border border-border px-4 py-3 text-sm leading-7 text-muted-foreground">
                    {t('sandboxNoticeQr')}
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-[1.75rem] border border-border bg-background/70 p-5">
                <div className="grid gap-5">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="demo-cardholder-name">
                      {t('cardholderName')}
                    </Label>
                    <Input
                      id="demo-cardholder-name"
                      ref={cardholderInputRef}
                      value={cardForm.cardholderName}
                      placeholder={t('cardholderNamePlaceholder')}
                      onChange={(event) =>
                        setCardForm((current) => ({
                          ...current,
                          cardholderName: event.target.value,
                        }))
                      }
                    />
                    {cardFieldErrors.cardholderName ? (
                      <p className="text-sm text-destructive">
                        {t(cardFieldErrors.cardholderName)}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="demo-card-number">{t('cardNumber')}</Label>
                    <Input
                      id="demo-card-number"
                      inputMode="numeric"
                      value={cardForm.cardNumber}
                      placeholder={t('cardNumberPlaceholder')}
                      onChange={(event) =>
                        setCardForm((current) => ({
                          ...current,
                          cardNumber: formatCardNumberInput(event.target.value),
                        }))
                      }
                    />
                    {cardFieldErrors.cardNumber ? (
                      <p className="text-sm text-destructive">
                        {t(cardFieldErrors.cardNumber)}
                      </p>
                    ) : null}
                  </div>
                  <div className="grid gap-5 sm:grid-cols-2">
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="demo-expiry-date">
                        {t('expiryDate')}
                      </Label>
                      <Input
                        id="demo-expiry-date"
                        inputMode="numeric"
                        value={cardForm.expiryDate}
                        placeholder={t('expiryDatePlaceholder')}
                        onChange={(event) =>
                          setCardForm((current) => ({
                            ...current,
                            expiryDate: formatExpiryDateInput(
                              event.target.value,
                            ),
                          }))
                        }
                      />
                      {cardFieldErrors.expiryDate ? (
                        <p className="text-sm text-destructive">
                          {t(cardFieldErrors.expiryDate)}
                        </p>
                      ) : null}
                    </div>
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="demo-cvc">{t('cvc')}</Label>
                      <Input
                        id="demo-cvc"
                        inputMode="numeric"
                        value={cardForm.cvc}
                        placeholder={t('cvcPlaceholder')}
                        onChange={(event) =>
                          setCardForm((current) => ({
                            ...current,
                            cvc: event.target.value
                              .replace(/\D/g, '')
                              .slice(0, 4),
                          }))
                        }
                      />
                      {cardFieldErrors.cvc ? (
                        <p className="text-sm text-destructive">
                          {t(cardFieldErrors.cvc)}
                        </p>
                      ) : null}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-border px-4 py-3 text-sm leading-7 text-muted-foreground">
                    {t('sandboxNoticeCard')}
                  </div>
                </div>
              </div>
            )}

            {actionError ? (
              <div className="rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {t(actionError)}
              </div>
            ) : null}

            {isAlreadyConfirmed ? (
              <div className="flex items-start gap-3 rounded-2xl border border-emerald-300 bg-emerald-100/70 px-4 py-3 text-sm leading-7 text-emerald-900 dark:border-emerald-400/30 dark:bg-emerald-400/15 dark:text-emerald-100">
                <CheckCircle2Icon className="mt-0.5 shrink-0" />
                <p>{t('alreadyConfirmedDescription')}</p>
              </div>
            ) : null}
          </CardContent>
          <CardFooter className="bg-transparent">
            {isAlreadyConfirmed ? (
              <Button
                asChild
                size="lg"
                className={`w-full ${checkoutPrimaryButtonClassName}`}
              >
                <Link href={`/checkout/success/${order.orderNo}`}>
                  <CheckCircle2Icon data-icon="inline-start" />
                  {t('continueToConfirmation')}
                </Link>
              </Button>
            ) : (
              <Button
                type="button"
                size="lg"
                className={`w-full ${checkoutPrimaryButtonClassName}`}
                disabled={isConfirming || isUpdatingPaymentMethod}
                onClick={handleConfirm}
              >
                {order.paymentMethod === 'CARD' ? (
                  <CreditCardIcon data-icon="inline-start" />
                ) : (
                  <QrCodeIcon data-icon="inline-start" />
                )}
                {isConfirming
                  ? t('confirmingPayment')
                  : order.paymentMethod === 'CARD'
                    ? t('confirmCardPayment')
                    : t('confirmQrPayment')}
              </Button>
            )}
          </CardFooter>
        </Card>

        <Card className="border-border/80 bg-card/95 shadow-[0_24px_70px_rgba(132,83,60,0.08)] lg:sticky lg:top-28">
          <CardHeader className="gap-3">
            <CardTitle>{t('summaryTitle')}</CardTitle>
            <CardDescription>{t('summaryDescription')}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex items-center justify-between gap-4 text-sm">
              <span className="text-muted-foreground">
                {t('orderStatusLabel')}
              </span>
              <span className="font-medium text-foreground">
                {orderTranslations(`status.${order.status}`)}
              </span>
            </div>
            <div className="flex items-center justify-between gap-4 text-sm">
              <span className="text-muted-foreground">{t('amountLabel')}</span>
              <span className="font-medium text-foreground">
                {formatOrderPrice(order.total, locale)}
              </span>
            </div>
            <Separator />
            <div className="flex items-center justify-between gap-4 text-sm">
              <span className="text-muted-foreground">{t('methodLabel')}</span>
              <span className="font-medium text-foreground">
                {paymentMethodKey ? t(paymentMethodKey) : ''}
              </span>
            </div>
            <div className="flex items-center justify-between gap-4 text-sm">
              <span className="text-muted-foreground">{t('statusLabel')}</span>
              <span className="font-medium text-foreground">
                {paymentStatusKey ? t(paymentStatusKey) : ''}
              </span>
            </div>
          </CardContent>
          <CardFooter className="bg-transparent">
            <Button asChild variant="outline" size="lg" className="w-full">
              <Link href={`/orders/${order.orderNo}`}>
                <ArrowLeftIcon data-icon="inline-start" />
                {t('viewOrder')}
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </section>
    </main>
  );
}

'use client';

import {
  AlertTriangleIcon,
  ArrowLeftIcon,
  ClipboardListIcon,
  ShoppingCartIcon,
} from 'lucide-react';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Link, useRouter } from '@/i18n/navigation';
import { buildAuthNoticeHref } from '@/features/auth/auth-routing';
import { useCartView } from '@/features/cart/use-cart-view';
import {
  checkoutPrimaryButtonClassName,
  FREE_SHIPPING_THRESHOLD,
  normalizePhoneInput,
} from '@/features/checkout/checkout-ui';
import { isApiError } from '@/services/api-error';
import { createOrder } from '@/services/orders';
import { useAuthStore } from '@/store/use-auth-store';

function formatPrice(value: number) {
  return `THB ${value.toFixed(2)}`;
}

type CheckoutField =
  | 'fullName'
  | 'email'
  | 'phone'
  | 'addressLine'
  | 'city'
  | 'postalCode';

type CheckoutFieldMessageKey =
  | 'errorFullNameRequired'
  | 'errorEmailRequired'
  | 'errorEmailInvalid'
  | 'errorEmailExists'
  | 'errorPhoneRequired'
  | 'errorPhoneInvalid'
  | 'errorAddressLineRequired'
  | 'errorCityRequired'
  | 'errorPostalCodeRequired';

type CheckoutFieldErrors = Partial<
  Record<CheckoutField, CheckoutFieldMessageKey>
>;

type CheckoutFormState = Record<CheckoutField, string>;

const initialFormState: CheckoutFormState = {
  fullName: '',
  email: '',
  phone: '',
  addressLine: '',
  city: '',
  postalCode: '',
};

export function CheckoutPage() {
  const t = useTranslations('checkout');
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const isAuthInitialized = useAuthStore((state) => state.isInitialized);
  const isRestoringProfile = useAuthStore((state) => state.isRestoringProfile);
  const refreshProfile = useAuthStore((state) => state.refreshProfile);
  const {
    items,
    viewItems,
    itemCount,
    subtotal,
    shipping,
    total,
    isRefreshing,
    hasRefreshError,
    hasSnapshotItems,
    hasAdjustedItems,
    hasUnavailableItems,
    refreshCart,
    clearCart,
  } = useCartView();
  const [formState, setFormState] =
    useState<CheckoutFormState>(initialFormState);
  const [fieldErrors, setFieldErrors] = useState<CheckoutFieldErrors>({});
  const [formErrorKey, setFormErrorKey] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isAuthInitialized || user) {
      return;
    }

    router.replace(buildAuthNoticeHref('/login', 'auth-required', '/checkout'));
  }, [isAuthInitialized, router, user]);

  useEffect(() => {
    if (!user) {
      return;
    }

    let isCancelled = false;

    window.queueMicrotask(() => {
      if (isCancelled) {
        return;
      }

      setFormState({
        fullName: user.fullName,
        email: user.email,
        phone: user.phone ?? '',
        addressLine: user.addressLine ?? '',
        city: user.city ?? '',
        postalCode: user.postalCode ?? '',
      });
    });

    return () => {
      isCancelled = true;
    };
  }, [user]);

  const updateField = (field: CheckoutField, value: string) => {
    setFormState((current) => ({
      ...current,
      [field]: value,
    }));
    setFieldErrors((current) => {
      if (!current[field]) {
        return current;
      }

      const nextErrors = { ...current };
      delete nextErrors[field];

      return nextErrors;
    });
    setFormErrorKey(null);
  };

  const validateForm = (): CheckoutFieldErrors => {
    const nextErrors: CheckoutFieldErrors = {};

    if (!formState.fullName.trim()) {
      nextErrors.fullName = 'errorFullNameRequired';
    }

    if (!formState.email.trim()) {
      nextErrors.email = 'errorEmailRequired';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formState.email.trim())) {
      nextErrors.email = 'errorEmailInvalid';
    }

    if (!formState.phone.trim()) {
      nextErrors.phone = 'errorPhoneRequired';
    } else if (!/^\d{1,10}$/.test(formState.phone.trim())) {
      nextErrors.phone = 'errorPhoneInvalid';
    }

    if (!formState.addressLine.trim()) {
      nextErrors.addressLine = 'errorAddressLineRequired';
    }

    if (!formState.city.trim()) {
      nextErrors.city = 'errorCityRequired';
    }

    if (!formState.postalCode.trim()) {
      nextErrors.postalCode = 'errorPostalCodeRequired';
    }

    return nextErrors;
  };

  const getCheckoutFieldErrors = (error: unknown): CheckoutFieldErrors => {
    if (!isApiError(error)) {
      return {};
    }

    const nextErrors: CheckoutFieldErrors = {};

    for (const [field, codes] of Object.entries(error.fieldErrors ?? {})) {
      if (
        field !== 'fullName' &&
        field !== 'email' &&
        field !== 'phone' &&
        field !== 'addressLine' &&
        field !== 'city' &&
        field !== 'postalCode'
      ) {
        continue;
      }

      if (codes.includes('AUTH_EMAIL_ALREADY_EXISTS')) {
        nextErrors[field] = 'errorEmailExists';
        continue;
      }

      if (codes.includes('INVALID_EMAIL')) {
        nextErrors[field] = 'errorEmailInvalid';
        continue;
      }

      if (codes.includes('REQUIRED')) {
        nextErrors[field] =
          field === 'fullName'
            ? 'errorFullNameRequired'
            : field === 'email'
              ? 'errorEmailRequired'
              : field === 'phone'
                ? 'errorPhoneRequired'
                : field === 'addressLine'
                  ? 'errorAddressLineRequired'
                  : field === 'city'
                    ? 'errorCityRequired'
                    : 'errorPostalCodeRequired';
        continue;
      }

      if (field === 'phone' && codes.includes('INVALID_PHONE')) {
        nextErrors.phone = 'errorPhoneInvalid';
      }
    }

    return nextErrors;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextFieldErrors = validateForm();
    setFieldErrors(nextFieldErrors);
    setFormErrorKey(null);

    if (Object.keys(nextFieldErrors).length > 0) {
      return;
    }

    if (hasUnavailableItems) {
      setFormErrorKey('errorUnavailableItems');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await createOrder({
        fullName: formState.fullName,
        email: formState.email,
        phone: formState.phone,
        addressLine: formState.addressLine,
        city: formState.city,
        postalCode: formState.postalCode,
        items: viewItems
          .filter((item) => !item.isUnavailable)
          .map((item) => ({
            productId: item.id,
            quantity: item.quantity,
          })),
      });

      clearCart();
      await refreshProfile();
      router.push(`/checkout/success/${response.orderNo}`);
    } catch (error) {
      const nextFieldErrorsFromApi = getCheckoutFieldErrors(error);
      setFieldErrors(nextFieldErrorsFromApi);

      if (isApiError(error)) {
        if (
          error.code === 'ORDER_STOCK_CHANGED' ||
          error.code === 'ORDER_UNAVAILABLE_ITEMS' ||
          error.code === 'ORDER_EMPTY'
        ) {
          setFormErrorKey(
            error.code === 'ORDER_STOCK_CHANGED'
              ? 'errorStockChanged'
              : error.code === 'ORDER_UNAVAILABLE_ITEMS'
                ? 'errorUnavailableItems'
                : 'errorEmptyOrder',
          );
          refreshCart();
        } else if (Object.keys(nextFieldErrorsFromApi).length === 0) {
          setFormErrorKey(
            error.code === 'AUTH_EMAIL_ALREADY_EXISTS'
              ? 'errorEmailExists'
              : 'errorSubmitFailed',
          );
        }
      } else {
        setFormErrorKey('errorSubmitFailed');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isAuthInitialized || isRestoringProfile) {
    return (
      <main className="mx-auto flex min-h-[calc(100svh-16rem)] w-full max-w-7xl items-center justify-center px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex size-14 items-center justify-center rounded-full border border-border bg-card text-foreground shadow-[0_18px_50px_rgba(132,83,60,0.08)]">
            <ShoppingCartIcon />
          </div>
          <p className="text-sm font-medium text-muted-foreground">
            {t('checkingSession')}
          </p>
        </div>
      </main>
    );
  }

  if (!user) {
    return null;
  }

  if (items.length === 0) {
    return (
      <main className="mx-auto flex min-h-[calc(100svh-16rem)] w-full max-w-7xl items-center px-4 py-10 sm:px-6 lg:px-8">
        <section className="mx-auto flex w-full max-w-2xl flex-col items-center gap-6 text-center">
          <div className="flex size-16 items-center justify-center rounded-full border border-border bg-card text-foreground shadow-[0_18px_50px_rgba(132,83,60,0.08)]">
            <ShoppingCartIcon />
          </div>
          <div className="flex flex-col gap-3">
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              {t('emptyEyebrow')}
            </p>
            <h1 className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
              {t('emptyTitle')}
            </h1>
            <p className="mx-auto max-w-xl text-base leading-8 text-muted-foreground">
              {t('emptyDescription')}
            </p>
          </div>
          <Button asChild size="lg" className={checkoutPrimaryButtonClassName}>
            <Link href="/products">
              <ArrowLeftIcon data-icon="inline-start" />
              {t('continueShopping')}
            </Link>
          </Button>
        </section>
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-12">
      <section className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-3">
          <Link
            href="/cart"
            className="inline-flex w-fit items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeftIcon className="size-4" />
            {t('backToCart')}
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
          {t('itemCount', { count: itemCount })}
        </Badge>
      </section>

      {hasRefreshError || hasSnapshotItems ? (
        <div className="flex items-start gap-3 rounded-2xl border border-border bg-card/80 px-4 py-3 text-sm leading-7 text-muted-foreground">
          <AlertTriangleIcon className="mt-1 shrink-0" />
          <p>{t('snapshotNotice')}</p>
        </div>
      ) : null}

      {hasAdjustedItems ? (
        <div className="flex items-start gap-3 rounded-2xl border border-border bg-card/80 px-4 py-3 text-sm leading-7 text-muted-foreground">
          <AlertTriangleIcon className="mt-1 shrink-0" />
          <p>{t('adjustedNotice')}</p>
        </div>
      ) : null}

      {hasUnavailableItems ? (
        <div className="flex items-start gap-3 rounded-2xl border border-border bg-card/80 px-4 py-3 text-sm leading-7 text-muted-foreground">
          <AlertTriangleIcon className="mt-1 shrink-0" />
          <div className="flex flex-col gap-2">
            <p>{t('unavailableNotice')}</p>
            <Button asChild variant="outline" size="sm" className="w-fit">
              <Link href="/cart">{t('fixCart')}</Link>
            </Button>
          </div>
        </div>
      ) : null}

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_24rem] lg:items-start">
        <Card className="border-border/80 bg-card/95 shadow-[0_24px_70px_rgba(132,83,60,0.08)]">
          <CardHeader className="gap-3">
            <CardTitle>{t('contactTitle')}</CardTitle>
            <p className="text-sm leading-7 text-muted-foreground">
              {t('contactDescription')}
            </p>
          </CardHeader>
          <CardContent>
            <form
              id="checkout-contact-form"
              className="grid gap-5 sm:grid-cols-2"
              onSubmit={handleSubmit}
            >
              <div className="flex flex-col gap-2">
                <Label htmlFor="checkout-name">{t('fullName')}</Label>
                <Input
                  id="checkout-name"
                  autoComplete="name"
                  aria-invalid={Boolean(fieldErrors.fullName)}
                  value={formState.fullName}
                  placeholder={t('fullName')}
                  onChange={(event) =>
                    updateField('fullName', event.target.value)
                  }
                />
                {fieldErrors.fullName ? (
                  <p className="text-sm leading-6 text-destructive">
                    {t(fieldErrors.fullName)}
                  </p>
                ) : null}
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="checkout-email">{t('email')}</Label>
                <Input
                  id="checkout-email"
                  type="email"
                  autoComplete="email"
                  aria-invalid={Boolean(fieldErrors.email)}
                  value={formState.email}
                  placeholder={t('email')}
                  onChange={(event) => updateField('email', event.target.value)}
                />
                {fieldErrors.email ? (
                  <p className="text-sm leading-6 text-destructive">
                    {t(fieldErrors.email)}
                  </p>
                ) : null}
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="checkout-phone">{t('phone')}</Label>
                <Input
                  id="checkout-phone"
                  type="tel"
                  autoComplete="tel"
                  aria-invalid={Boolean(fieldErrors.phone)}
                  value={formState.phone}
                  placeholder={t('phone')}
                  inputMode="numeric"
                  maxLength={10}
                  onChange={(event) =>
                    updateField(
                      'phone',
                      normalizePhoneInput(event.target.value),
                    )
                  }
                />
                {fieldErrors.phone ? (
                  <p className="text-sm leading-6 text-destructive">
                    {t(fieldErrors.phone)}
                  </p>
                ) : null}
              </div>
              <div className="flex flex-col gap-2 sm:col-span-2">
                <Label htmlFor="checkout-address">{t('addressLine')}</Label>
                <Input
                  id="checkout-address"
                  autoComplete="street-address"
                  aria-invalid={Boolean(fieldErrors.addressLine)}
                  value={formState.addressLine}
                  placeholder={t('addressLine')}
                  onChange={(event) =>
                    updateField('addressLine', event.target.value)
                  }
                />
                {fieldErrors.addressLine ? (
                  <p className="text-sm leading-6 text-destructive">
                    {t(fieldErrors.addressLine)}
                  </p>
                ) : null}
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="checkout-city">{t('city')}</Label>
                <Input
                  id="checkout-city"
                  autoComplete="address-level2"
                  aria-invalid={Boolean(fieldErrors.city)}
                  value={formState.city}
                  placeholder={t('city')}
                  onChange={(event) => updateField('city', event.target.value)}
                />
                {fieldErrors.city ? (
                  <p className="text-sm leading-6 text-destructive">
                    {t(fieldErrors.city)}
                  </p>
                ) : null}
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="checkout-postal-code">{t('postalCode')}</Label>
                <Input
                  id="checkout-postal-code"
                  autoComplete="postal-code"
                  aria-invalid={Boolean(fieldErrors.postalCode)}
                  value={formState.postalCode}
                  placeholder={t('postalCode')}
                  onChange={(event) =>
                    updateField('postalCode', event.target.value)
                  }
                />
                {fieldErrors.postalCode ? (
                  <p className="text-sm leading-6 text-destructive">
                    {t(fieldErrors.postalCode)}
                  </p>
                ) : null}
              </div>

              {formErrorKey ? (
                <div className="sm:col-span-2">
                  <div className="flex flex-col gap-3 rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm leading-7 text-destructive">
                    <p>{t(formErrorKey)}</p>
                    {formErrorKey === 'errorStockChanged' ||
                    formErrorKey === 'errorUnavailableItems' ||
                    formErrorKey === 'errorEmptyOrder' ? (
                      <Button
                        asChild
                        variant="outline"
                        size="sm"
                        className="w-fit"
                      >
                        <Link href="/cart">{t('fixCart')}</Link>
                      </Button>
                    ) : null}
                  </div>
                </div>
              ) : null}
            </form>
          </CardContent>
        </Card>

        <Card className="border-border/80 bg-card/95 shadow-[0_24px_70px_rgba(132,83,60,0.08)] lg:sticky lg:top-28">
          <CardHeader className="gap-3">
            <CardTitle>{t('reviewTitle')}</CardTitle>
            <p className="text-sm leading-7 text-muted-foreground">
              {hasUnavailableItems
                ? t('reviewBlocked')
                : t('reviewDescription')}
            </p>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex max-h-80 flex-col gap-3 overflow-auto pr-1">
              {viewItems.map((item) => (
                <div key={item.id} className="flex gap-3">
                  <Link
                    href={`/products/${item.slug}`}
                    className="relative size-16 shrink-0 overflow-hidden rounded-xl border border-border bg-muted"
                  >
                    {item.imageUrl ? (
                      <Image
                        src={item.imageUrl}
                        alt={item.name}
                        fill
                        sizes="64px"
                        className="object-cover object-top"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                        Facee
                      </div>
                    )}
                  </Link>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <Link href={`/products/${item.slug}`} className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground">
                          {item.name}
                        </p>
                      </Link>
                      <p className="shrink-0 text-sm font-medium text-foreground">
                        {formatPrice(item.lineTotal)}
                      </p>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <span>{t('quantity', { count: item.quantity })}</span>
                      {item.isUnavailable ? (
                        <Badge variant="destructive">{t('unavailable')}</Badge>
                      ) : item.stock !== null ? (
                        <Badge variant="outline">
                          {t('stockCount', { count: item.stock })}
                        </Badge>
                      ) : null}
                      {isRefreshing ? (
                        <Badge variant="secondary">{t('refreshing')}</Badge>
                      ) : null}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <Separator />

            <div className="flex items-center justify-between gap-4 text-sm">
              <span className="text-muted-foreground">{t('subtotal')}</span>
              <span className="font-medium text-foreground">
                {formatPrice(subtotal)}
              </span>
            </div>
            <div className="flex items-center justify-between gap-4 text-sm">
              <span className="text-muted-foreground">{t('shipping')}</span>
              <span className="font-medium text-foreground">
                {formatPrice(shipping)}
              </span>
            </div>
            <p className="text-xs leading-6 text-muted-foreground">
              {shipping === 0
                ? t('shippingFreeThreshold', {
                    threshold: formatPrice(FREE_SHIPPING_THRESHOLD),
                  })
                : t('shippingFlatRate', {
                    amount: formatPrice(shipping),
                    threshold: formatPrice(FREE_SHIPPING_THRESHOLD),
                  })}
            </p>
            <Separator />
            <div className="flex items-center justify-between gap-4">
              <span className="font-medium text-foreground">{t('total')}</span>
              <span className="text-2xl font-semibold text-foreground">
                {formatPrice(total)}
              </span>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-3 bg-transparent">
            {hasUnavailableItems ? (
              <Button asChild size="lg" className="w-full">
                <Link href="/cart">
                  <AlertTriangleIcon data-icon="inline-start" />
                  {t('fixCart')}
                </Link>
              </Button>
            ) : (
              <Button
                type="submit"
                form="checkout-contact-form"
                size="lg"
                className={`w-full ${checkoutPrimaryButtonClassName}`}
                disabled={isSubmitting || isRefreshing}
              >
                <ClipboardListIcon data-icon="inline-start" />
                {isSubmitting ? t('placingOrder') : t('placeOrder')}
              </Button>
            )}
          </CardFooter>
        </Card>
      </section>
    </main>
  );
}

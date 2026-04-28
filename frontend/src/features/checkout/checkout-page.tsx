'use client';

import {
  AlertTriangleIcon,
  ArrowLeftIcon,
  ClipboardListIcon,
  MapPinIcon,
  ShoppingCartIcon,
} from 'lucide-react';
import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
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
import { Separator } from '@/components/ui/separator';
import { buildAuthNoticeHref } from '@/features/auth/auth-routing';
import type { Address } from '@/features/account/schemas';
import { useCartView } from '@/features/cart/use-cart-view';
import {
  checkoutPrimaryButtonClassName,
  FREE_SHIPPING_THRESHOLD,
} from '@/features/checkout/checkout-ui';
import { Link, useRouter } from '@/i18n/navigation';
import { isApiError } from '@/services/api-error';
import { listAddresses } from '@/services/account';
import { createOrder } from '@/services/orders';
import { useAuthStore } from '@/store/use-auth-store';

function formatPrice(value: number) {
  return `THB ${value.toFixed(2)}`;
}

export function CheckoutPage() {
  const t = useTranslations('checkout');
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const isAuthInitialized = useAuthStore((state) => state.isInitialized);
  const isRestoringProfile = useAuthStore((state) => state.isRestoringProfile);
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
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(
    null,
  );
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(true);
  const [addressError, setAddressError] = useState<string | null>(null);
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

    void listAddresses()
      .then((response) => {
        if (isCancelled) {
          return;
        }

        setAddresses(response.items);
        setSelectedAddressId(
          response.items.find((address) => address.isDefault)?.id ??
            response.items[0]?.id ??
            null,
        );
        setIsLoadingAddresses(false);
      })
      .catch(() => {
        if (isCancelled) {
          return;
        }

        setAddressError('errorAddressLoadFailed');
        setIsLoadingAddresses(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [user]);

  const selectedAddress = useMemo(
    () => addresses.find((address) => address.id === selectedAddressId) ?? null,
    [addresses, selectedAddressId],
  );

  const handleSubmit = async () => {
    if (!selectedAddressId) {
      setFormErrorKey('errorAddressRequired');
      return;
    }

    if (hasUnavailableItems) {
      setFormErrorKey('errorUnavailableItems');
      return;
    }

    setIsSubmitting(true);
    setFormErrorKey(null);

    try {
      const response = await createOrder({
        addressId: selectedAddressId,
        items: viewItems
          .filter((item) => !item.isUnavailable)
          .map((item) => ({
            productId: item.id,
            quantity: item.quantity,
          })),
      });

      clearCart();
      router.push(`/checkout/success/${response.orderNo}`);
    } catch (error) {
      if (isApiError(error)) {
        if (error.code === 'ORDER_STOCK_CHANGED') {
          setFormErrorKey('errorStockChanged');
          refreshCart();
        } else if (error.code === 'ORDER_UNAVAILABLE_ITEMS') {
          setFormErrorKey('errorUnavailableItems');
          refreshCart();
        } else if (error.code === 'ORDER_EMPTY') {
          setFormErrorKey('errorEmptyOrder');
        } else if (error.code === 'ADDRESS_NOT_FOUND') {
          setFormErrorKey('errorAddressMissing');
        } else {
          setFormErrorKey('errorSubmitFailed');
        }
      } else {
        setFormErrorKey('errorSubmitFailed');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isAuthInitialized || isRestoringProfile || isLoadingAddresses) {
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
    <main className="mx-auto flex h-full w-full max-w-7xl flex-1 flex-col gap-8 px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-12">
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
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex size-11 items-center justify-center rounded-full border border-border bg-muted text-foreground">
                <MapPinIcon />
              </div>
              <div className="flex flex-col gap-1">
                <CardTitle>{t('addressTitle')}</CardTitle>
                <CardDescription>{t('addressDescription')}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {addressError ? (
              <div className="rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {t(addressError)}
              </div>
            ) : null}

            {addresses.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border px-4 py-6 text-sm leading-7 text-muted-foreground">
                <p>{t('addressEmpty')}</p>
                <Button asChild variant="outline" size="sm" className="mt-3">
                  <Link href="/profile">{t('manageAddresses')}</Link>
                </Button>
              </div>
            ) : (
              addresses.map((address) => {
                const isSelected = address.id === selectedAddressId;

                return (
                  <button
                    key={address.id}
                    type="button"
                    className={`rounded-2xl border px-4 py-4 text-left transition-colors ${
                      isSelected
                        ? 'border-foreground bg-background/90'
                        : 'border-border bg-background/70 hover:border-foreground/40'
                    }`}
                    onClick={() => {
                      setSelectedAddressId(address.id);
                      setFormErrorKey(null);
                    }}
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-medium text-foreground">
                        {address.label}
                      </p>
                      {address.isDefault ? (
                        <Badge variant="secondary">{t('defaultBadge')}</Badge>
                      ) : null}
                      {isSelected ? (
                        <Badge variant="outline">{t('selectedBadge')}</Badge>
                      ) : null}
                    </div>
                    <div className="mt-2 text-sm leading-7 text-muted-foreground">
                      <p>{address.recipientFullName}</p>
                      <p>{address.recipientEmail}</p>
                      <p>{address.recipientPhone}</p>
                      <p>
                        {address.addressLine}, {address.city}{' '}
                        {address.postalCode}
                      </p>
                    </div>
                  </button>
                );
              })
            )}

            {selectedAddress ? (
              <p className="text-sm leading-7 text-muted-foreground">
                {t('addressSnapshotNote')}
              </p>
            ) : null}
          </CardContent>
          <CardFooter>
            <Button asChild variant="outline">
              <Link href="/profile">{t('manageAddresses')}</Link>
            </Button>
          </CardFooter>
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

            {formErrorKey ? (
              <div className="rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {t(formErrorKey)}
              </div>
            ) : null}
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
                type="button"
                size="lg"
                className={`w-full ${checkoutPrimaryButtonClassName}`}
                disabled={isSubmitting || isRefreshing || !selectedAddressId}
                onClick={handleSubmit}
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

'use client';

import {
  ArrowRightIcon,
  CalendarDaysIcon,
  CircleDollarSignIcon,
  Clock3Icon,
  MailIcon,
  MapPinIcon,
  ReceiptTextIcon,
  PhoneIcon,
  UserRoundIcon,
} from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';
import { useLocale } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import type { Address } from '@/features/account/schemas';
import { getAdminCustomerDetailText } from '@/features/admin-customers/messages';
import type { AdminCustomerDetail } from '@/features/admin-customers/schemas';
import {
  formatOrderDate,
  formatOrderPrice,
  getOrderStatusBadgeClassName,
  getOrderStatusBadgeVariant,
} from '@/features/orders/ui';
import { Link } from '@/i18n/navigation';
import { getAdminCustomerDetail } from '@/services/admin-customers';

type AdminCustomerDetailPageProps = {
  customerId: string;
};

type ProfileFieldCardProps = {
  icon: ReactNode;
  label: string;
  value: string;
};

function formatAddressLine(address: Address) {
  return `${address.addressLine}, ${address.city} ${address.postalCode}`;
}

function ProfileFieldCard({ icon, label, value }: ProfileFieldCardProps) {
  return (
    <div className="rounded-2xl border border-border bg-background/60 p-4">
      <div className="flex items-center gap-2">
        <span className="flex size-8 items-center justify-center rounded-full border border-border bg-[rgba(62,41,34,0.72)] text-[#d59a83]">
          {icon}
        </span>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          {label}
        </p>
      </div>
      <p className="mt-3 text-sm font-medium text-foreground">{value}</p>
    </div>
  );
}

export function AdminCustomerDetailPage({
  customerId,
}: AdminCustomerDetailPageProps) {
  const locale = useLocale();
  const detailText = getAdminCustomerDetailText(locale);
  const [customer, setCustomer] = useState<AdminCustomerDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let isCancelled = false;

    void (async () => {
      try {
        const response = await getAdminCustomerDetail(customerId);

        if (isCancelled) {
          return;
        }

        setCustomer(response);
        setHasError(false);
      } catch {
        if (!isCancelled) {
          setHasError(true);
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    })();

    return () => {
      isCancelled = true;
    };
  }, [customerId]);

  const summaryCards = customer
    ? [
        {
          icon: <ReceiptTextIcon className="size-4" />,
          label: detailText.summaryOrders,
          value: String(customer.summary.orderCount),
        },
        {
          icon: <CircleDollarSignIcon className="size-4" />,
          label: detailText.summarySpent,
          value: formatOrderPrice(customer.summary.totalSpent, locale),
        },
        {
          icon: <Clock3Icon className="size-4" />,
          label: detailText.summaryPendingCancellations,
          value: String(customer.summary.pendingCancellationCount),
        },
        {
          icon: <CalendarDaysIcon className="size-4" />,
          label: detailText.summaryLastOrder,
          value: customer.summary.lastOrderAt
            ? formatOrderDate(customer.summary.lastOrderAt, locale)
            : detailText.noOrders,
        },
      ]
    : [];

  if (isLoading) {
    return (
      <main className="flex min-h-128 items-center justify-center px-1 py-6">
        <p className="text-sm font-medium text-muted-foreground">
          {detailText.loading}
        </p>
      </main>
    );
  }

  if (hasError || !customer) {
    return (
      <main className="px-1 py-6">
        <Card className="border-border/70 bg-[rgba(31,22,19,0.9)] shadow-[0_20px_50px_rgba(0,0,0,0.18)]">
          <CardContent className="flex flex-col gap-4 p-6">
            <h2 className="text-2xl font-semibold tracking-tight text-foreground">
              {detailText.loadFailed}
            </h2>
            <p className="text-sm leading-6 text-muted-foreground">
              {detailText.loadFailedDescription}
            </p>
            <Button type="button" onClick={() => window.location.reload()}>
              {detailText.retry}
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="flex flex-col gap-6 px-1 pb-4">
      <Link
        href="/admin/customers"
        className="text-sm font-medium text-muted-foreground underline underline-offset-4"
      >
        {detailText.back}
      </Link>

      <section className="rounded-[2rem] border border-border/70 bg-[rgba(31,22,19,0.9)] p-6 shadow-[0_20px_50px_rgba(0,0,0,0.18)] sm:p-7">
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <span className="flex size-12 items-center justify-center rounded-full border border-border bg-[rgba(62,41,34,0.72)] text-[#d59a83]">
              <UserRoundIcon className="size-5" />
            </span>
            <div>
              <h2 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                {customer.profile.fullName}
              </h2>
              <p className="text-sm leading-7 text-muted-foreground">
                {customer.profile.email}
              </p>
            </div>
          </div>
          <p className="text-sm leading-7 text-muted-foreground">
            {detailText.overview}
          </p>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card) => (
          <Card
            key={card.label}
            className="border-border/70 bg-[rgba(31,22,19,0.9)] shadow-[0_20px_50px_rgba(0,0,0,0.18)]"
          >
            <CardContent className="space-y-2 p-5">
              <div className="flex items-center gap-2">
                <span className="flex size-8 items-center justify-center rounded-full border border-border bg-[rgba(62,41,34,0.72)] text-[#d59a83]">
                  {card.icon}
                </span>
                <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  {card.label}
                </p>
              </div>
              <p className="text-2xl font-semibold tracking-tight text-foreground">
                {card.value}
              </p>
            </CardContent>
          </Card>
        ))}
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <div className="grid gap-6">
          <Card className="border-border/70 bg-[rgba(31,22,19,0.9)] shadow-[0_20px_50px_rgba(0,0,0,0.18)]">
            <CardHeader>
              <CardTitle>{detailText.profileTitle}</CardTitle>
              <CardDescription>{detailText.profileDescription}</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <ProfileFieldCard
                icon={<UserRoundIcon className="size-4" />}
                label={detailText.fullName}
                value={customer.profile.fullName}
              />
              <ProfileFieldCard
                icon={<MailIcon className="size-4" />}
                label={detailText.email}
                value={customer.profile.email}
              />
              <ProfileFieldCard
                icon={<PhoneIcon className="size-4" />}
                label={detailText.phone}
                value={customer.profile.phone || detailText.notProvided}
              />
              <ProfileFieldCard
                icon={<CalendarDaysIcon className="size-4" />}
                label={detailText.memberSince}
                value={formatOrderDate(customer.profile.createdAt, locale)}
              />
            </CardContent>
          </Card>

          <Card className="border-border/70 bg-[rgba(31,22,19,0.9)] shadow-[0_20px_50px_rgba(0,0,0,0.18)]">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex size-11 items-center justify-center rounded-full border border-border bg-[rgba(62,41,34,0.72)] text-[#d59a83]">
                  <MapPinIcon className="size-5" />
                </div>
                <div>
                  <CardTitle>{detailText.addressesTitle}</CardTitle>
                  <CardDescription>
                    {detailText.addressesDescription}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="grid gap-4">
              {customer.addresses.length > 0 ? (
                customer.addresses.map((address) => (
                  <div
                    key={address.id}
                    className="rounded-2xl border border-border bg-background/60 p-4"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-foreground">
                        {address.label}
                      </p>
                      {address.isDefault ? (
                        <Badge
                          variant="secondary"
                          className="bg-[#3a2922] text-foreground"
                        >
                          {detailText.defaultAddress}
                        </Badge>
                      ) : null}
                    </div>
                    <div className="mt-3 grid gap-3 text-sm leading-6 text-muted-foreground sm:grid-cols-2">
                      <div>
                        <p className="font-medium text-foreground">
                          {address.recipientFullName}
                        </p>
                        <p>{address.recipientEmail}</p>
                        <p>{address.recipientPhone}</p>
                      </div>
                      <div>
                        <p>{formatAddressLine(address)}</p>
                        <p>
                          {detailText.addressUpdatedAt}:{' '}
                          {formatOrderDate(address.updatedAt, locale)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-border px-4 py-6 text-sm leading-7 text-muted-foreground">
                  {detailText.noAddresses}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6">
          <Card className="border-border/70 bg-[rgba(31,22,19,0.9)] shadow-[0_20px_50px_rgba(0,0,0,0.18)]">
            <CardHeader>
              <CardTitle>{detailText.recentOrdersTitle}</CardTitle>
              <CardDescription>
                {detailText.recentOrdersDescription}
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
              {customer.recentOrders.length > 0 ? (
                customer.recentOrders.map((order) => (
                  <div
                    key={order.orderNo}
                    className="rounded-2xl border border-border bg-background/70 p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold text-foreground">
                            {order.orderNo}
                          </p>
                          <Badge
                            variant={getOrderStatusBadgeVariant(order.status)}
                            className={getOrderStatusBadgeClassName(
                              order.status,
                            )}
                          >
                            {order.status}
                          </Badge>
                          {order.hasPendingCancellationRequest ? (
                            <Badge variant="outline">
                              {detailText.cancellationPending}
                            </Badge>
                          ) : null}
                        </div>
                        <div className="mt-2 text-sm leading-6 text-muted-foreground">
                          <p>{formatOrderDate(order.createdAt, locale)}</p>
                          <p>{formatOrderPrice(order.total, locale)}</p>
                        </div>
                      </div>
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/admin/orders/${order.orderNo}`}>
                          {detailText.viewOrder}
                          <ArrowRightIcon data-icon="inline-end" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-border px-4 py-6 text-sm leading-7 text-muted-foreground">
                  {detailText.noOrders}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}

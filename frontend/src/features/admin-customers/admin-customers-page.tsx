'use client';

import { ArrowRightIcon, SearchIcon, UsersIcon } from 'lucide-react';
import { useCallback, useDeferredValue, useEffect, useState } from 'react';
import { useLocale } from 'next-intl';
import { useSearchParams } from 'next/navigation';
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
import { getAdminCustomersPageText } from '@/features/admin-customers/messages';
import type { AdminCustomerList } from '@/features/admin-customers/schemas';
import { formatOrderDate, formatOrderPrice } from '@/features/orders/ui';
import { Link, usePathname, useRouter } from '@/i18n/navigation';
import { listAdminCustomers } from '@/services/admin-customers';

const ROWS_PER_PAGE_OPTIONS = [12, 25, 50] as const;

export function AdminCustomersPage() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryParam = searchParams.get('query') ?? '';
  const requestedPage = Number(searchParams.get('page') ?? '1');
  const requestedLimit = Number(searchParams.get('limit') ?? '25');
  const limit = ROWS_PER_PAGE_OPTIONS.includes(requestedLimit as 12 | 25 | 50)
    ? (requestedLimit as (typeof ROWS_PER_PAGE_OPTIONS)[number])
    : 25;
  const [searchValue, setSearchValue] = useState(queryParam);
  const deferredSearchValue = useDeferredValue(searchValue);
  const [result, setResult] = useState<AdminCustomerList | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const currentPage = Math.max(
    1,
    Number.isFinite(requestedPage) ? requestedPage : 1,
  );
  const pageText = getAdminCustomersPageText(locale);

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

  useEffect(() => {
    const normalized = deferredSearchValue.trim();
    if (normalized === queryParam) {
      return;
    }

    setParam('query', normalized || undefined);
  }, [deferredSearchValue, queryParam, setParam]);

  useEffect(() => {
    let isCancelled = false;

    const loadCustomers = async () => {
      setIsLoading(true);

      try {
        const response = await listAdminCustomers({
          query: queryParam || undefined,
          page: currentPage,
          limit,
        });

        if (isCancelled) {
          return;
        }

        setResult(response);
        setHasError(false);

        if (response.total > 0 && currentPage > response.totalPages) {
          setParam('page', String(response.totalPages));
        }
      } catch {
        if (!isCancelled) {
          setHasError(true);
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    void loadCustomers();

    return () => {
      isCancelled = true;
    };
  }, [queryParam, currentPage, limit, setParam]);

  const customers = result?.items ?? [];
  const totalPages = result?.totalPages ?? 1;
  const total = result?.total ?? 0;
  const summaryText = pageText.summary.replace('{count}', String(total));

  if (isLoading) {
    return (
      <main className="flex min-h-128 items-center justify-center px-1 py-6">
        <p className="text-sm font-medium text-muted-foreground">
          {pageText.loading}
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
                {pageText.heading}
              </p>
              <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                {pageText.loadFailed}
              </h2>
              <p className="text-sm leading-6 text-muted-foreground">
                {pageText.loadFailedDescription}
              </p>
            </div>
            <Button type="button" onClick={() => window.location.reload()}>
              {pageText.retry}
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
              {pageText.heading}
            </h2>
            <p className="max-w-3xl text-sm leading-7 text-muted-foreground sm:text-base">
              {pageText.description}
            </p>
            <p className="text-sm text-muted-foreground">{summaryText}</p>
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
        </div>
      </section>

      <section className="rounded-[2rem] border border-border/70 bg-[rgba(31,22,19,0.9)] p-3 shadow-[0_20px_50px_rgba(0,0,0,0.18)] sm:p-4">
        <div className="grid gap-3">
          {customers.length > 0 ? (
            <div className="overflow-x-auto rounded-[1.6rem] border border-border/65 bg-background/68">
              <table className="min-w-[980px] w-full border-separate border-spacing-0">
                <thead>
                  <tr className="text-left">
                    <th className="px-4 py-3 text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground sm:px-5">
                      {pageText.profile}
                    </th>
                    <th className="px-4 py-3 text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      {pageText.createdAt}
                    </th>
                    <th className="px-4 py-3 text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      {pageText.lastOrderAt}
                    </th>
                    <th className="px-4 py-3 text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      {pageText.orders}
                    </th>
                    <th className="px-4 py-3 text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      {pageText.totalSpent}
                    </th>
                    <th className="px-4 py-3 text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      {pageText.pendingCancellations}
                    </th>
                    <th className="px-4 py-3 text-right text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground sm:px-5">
                      {pageText.viewCustomer}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map((customer) => (
                    <tr
                      key={customer.id}
                      className="transition hover:bg-[rgba(53,37,31,0.34)]"
                    >
                      <td className="border-t border-border/60 px-4 py-4 sm:px-5">
                        <div className="flex min-w-0 items-center gap-3">
                          <span className="flex size-10 shrink-0 items-center justify-center rounded-full border border-border/70 bg-[rgba(62,41,34,0.72)] text-[#d59a83]">
                            <UsersIcon className="size-5" />
                          </span>
                          <div className="min-w-0">
                            <CardTitle className="truncate text-base font-semibold tracking-tight text-foreground">
                              {customer.fullName}
                            </CardTitle>
                            <p className="truncate text-sm text-muted-foreground">
                              {customer.email}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {customer.phone ?? '—'}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="border-t border-border/60 px-4 py-4 text-sm text-muted-foreground">
                        {formatOrderDate(customer.createdAt, locale)}
                      </td>
                      <td className="border-t border-border/60 px-4 py-4 text-sm text-muted-foreground">
                        {customer.lastOrderAt
                          ? formatOrderDate(customer.lastOrderAt, locale)
                          : pageText.noOrders}
                      </td>
                      <td className="border-t border-border/60 px-4 py-4 text-sm font-medium text-foreground">
                        {customer.orderCount}
                      </td>
                      <td className="border-t border-border/60 px-4 py-4 text-sm font-medium text-foreground">
                        {formatOrderPrice(customer.totalSpent, locale)}
                      </td>
                      <td className="border-t border-border/60 px-4 py-4 text-sm font-medium text-foreground">
                        {customer.pendingCancellationCount}
                      </td>
                      <td className="border-t border-border/60 px-4 py-4 text-right sm:px-5">
                        <Button asChild variant="outline" size="sm">
                          <Link href={`/admin/customers/${customer.id}`}>
                            {pageText.viewCustomer}
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

          {customers.length === 0 ? (
            <Card className="border-border/70 bg-[rgba(255,250,247,0.82)] shadow-[0_20px_50px_rgba(126,76,57,0.08)] dark:bg-[rgba(34,25,21,0.82)]">
              <CardContent className="flex flex-col gap-2 p-6">
                <p className="text-lg font-semibold text-foreground">
                  {pageText.emptyTitle}
                </p>
                <p className="text-sm leading-6 text-muted-foreground">
                  {pageText.emptyDescription}
                </p>
              </CardContent>
            </Card>
          ) : null}

          {customers.length > 0 ? (
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

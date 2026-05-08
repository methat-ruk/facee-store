'use client';

/* eslint-disable @next/next/no-img-element */

import {
  BoxesIcon,
  LayersIcon,
  PackagePlusIcon,
  PencilIcon,
  SearchIcon,
  SparklesIcon,
} from 'lucide-react';
import { useEffect, useState, type ComponentType } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  type AdminProductStatusFilter,
  type AdminProductSummary,
} from '@/features/admin-products/schemas';
import { getAdminProductsPageText } from '@/features/admin-products/messages';
import { formatOrderDate, formatOrderPrice } from '@/features/orders/ui';
import { Link, usePathname, useRouter } from '@/i18n/navigation';
import {
  listAdminProductCategories,
  listAdminProducts,
} from '@/services/admin-products';

const ROWS_PER_PAGE_OPTIONS = [12, 25, 50] as const;

function getProductBadges(
  product: Pick<AdminProductSummary, 'isPublished' | 'isFlashSale' | 'stock'>,
  locale: string,
  onSaleLabel: string,
) {
  const items = [
    product.isPublished
      ? {
          label:
            locale === 'th' ? 'à¹€à¸œà¸¢à¹à¸žà¸£à¹ˆà¹à¸¥à¹‰à¸§' : 'Published',
          className: 'border-emerald-400/30 bg-emerald-400/15 text-emerald-100',
        }
      : {
          label:
            locale === 'th'
              ? 'à¸¢à¸±à¸‡à¹„à¸¡à¹ˆà¹€à¸œà¸¢à¹à¸žà¸£à¹ˆ'
              : 'Hidden',
          className: 'border-border/70 bg-background/70 text-muted-foreground',
        },
  ];

  if (product.isFlashSale) {
    items.push({
      label: onSaleLabel,
      className: 'border-[#d69d85]/35 bg-[#d69d85]/14 text-[#f7ddcf]',
    });
  }

  if (product.stock <= 10) {
    items.push({
      label:
        locale === 'th'
          ? `à¸ªà¸•à¹‡à¸­à¸à¸•à¹ˆà¸³ ${product.stock}`
          : `Low stock ${product.stock}`,
      className: 'border-amber-400/30 bg-amber-400/15 text-amber-100',
    });
  }

  return items;
}

function SummaryCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: ComponentType<{ className?: string }>;
}) {
  return (
    <Card className="border-border/70 bg-[rgba(31,22,19,0.9)] shadow-[0_20px_50px_rgba(0,0,0,0.18)]">
      <CardContent className="flex items-start justify-between gap-3 p-5">
        <div className="space-y-2">
          <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            {label}
          </p>
          <p className="text-3xl font-semibold tracking-tight text-foreground">
            {value}
          </p>
        </div>
        <span className="flex size-11 items-center justify-center rounded-full border border-border/60 bg-[rgba(62,41,34,0.72)] text-[#d59a83]">
          <Icon className="size-5" />
        </span>
      </CardContent>
    </Card>
  );
}

export function AdminProductsPage() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<AdminProductSummary[]>([]);
  const [categories, setCategories] = useState<
    Awaited<ReturnType<typeof listAdminProductCategories>>
  >([]);
  const [meta, setMeta] = useState({
    page: 1,
    limit: 25,
    totalItems: 0,
    totalPages: 1,
  });
  const [summary, setSummary] = useState({
    totalCount: 0,
    publishedCount: 0,
    unpublishedCount: 0,
    flashSaleCount: 0,
    lowStockCount: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const query = searchParams.get('query') ?? '';
  const [searchValue, setSearchValue] = useState(query);
  const status =
    (searchParams.get('status') as AdminProductStatusFilter | null) ?? 'ALL';
  const category = searchParams.get('category') ?? 'all';
  const flashSaleOnly = searchParams.get('flashSale') === 'true';
  const lowStockOnly = searchParams.get('lowStock') === 'true';
  const page = Math.max(1, Number(searchParams.get('page') ?? '1') || 1);
  const requestedLimit = Number(searchParams.get('limit') ?? '25');
  const limit = ROWS_PER_PAGE_OPTIONS.includes(requestedLimit as 12 | 25 | 50)
    ? (requestedLimit as (typeof ROWS_PER_PAGE_OPTIONS)[number])
    : 25;

  const t = useTranslations('adminProducts');
  const uiText = getAdminProductsPageText(t);

  useEffect(() => {
    let isCancelled = false;

    void Promise.all([
      listAdminProducts({
        query: query || undefined,
        status,
        flashSale: flashSaleOnly || undefined,
        lowStock: lowStockOnly || undefined,
        category: category !== 'all' ? category : undefined,
        page,
        limit,
      }),
      listAdminProductCategories(),
    ])
      .then(([productResponse, categoryResponse]) => {
        if (isCancelled) {
          return;
        }

        setProducts(productResponse.items);
        setMeta(productResponse.meta);
        setSummary(productResponse.summary);
        setCategories(categoryResponse);
        setErrorMessage(null);
      })
      .catch(() => {
        if (!isCancelled) {
          setErrorMessage(uiText.loadFailed);
        }
      })
      .finally(() => {
        if (!isCancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [
    category,
    flashSaleOnly,
    limit,
    lowStockOnly,
    page,
    query,
    status,
    uiText.loadFailed,
  ]);

  function setParam(name: string, value?: string) {
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
  }

  useEffect(() => {
    const handle = window.setTimeout(() => {
      const normalized = searchValue.trim();

      if (normalized === query) {
        return;
      }

      const params = new URLSearchParams(searchParams.toString());

      if (!normalized) {
        params.delete('query');
      } else {
        params.set('query', normalized);
      }

      params.set('page', '1');

      const nextQuery = params.toString();
      router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname);
    }, 220);

    return () => window.clearTimeout(handle);
  }, [pathname, query, router, searchParams, searchValue]);

  return (
    <main className="flex flex-col gap-5 px-1 pb-4">
      <section className="rounded-[2rem] border border-border/70 bg-[rgba(31,22,19,0.9)] p-6 shadow-[0_20px_50px_rgba(0,0,0,0.18)]">
        <div className="space-y-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-3">
              <h2 className="font-serif text-[2.2rem] leading-none tracking-[0.01em] text-[#fbf1eb] sm:text-[2.75rem]">
                {uiText.heading}
              </h2>
              <p className="max-w-3xl text-sm leading-7 text-muted-foreground sm:text-base">
                {uiText.description}
              </p>
            </div>

            <Button
              asChild
              className="shrink-0 self-start text-white [&_svg]:text-white"
            >
              <Link href="/admin/products/new">
                {uiText.addProduct}
                <PackagePlusIcon data-icon="inline-end" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          label={uiText.total}
          value={String(summary.totalCount)}
          icon={LayersIcon}
        />
        <SummaryCard
          label={uiText.published}
          value={String(summary.publishedCount)}
          icon={SparklesIcon}
        />
        <SummaryCard
          label={uiText.hidden}
          value={String(summary.unpublishedCount)}
          icon={BoxesIcon}
        />
        <SummaryCard
          label={uiText.lowStock}
          value={String(summary.lowStockCount)}
          icon={BoxesIcon}
        />
      </section>

      <Card className="border-border/70 bg-[rgba(31,22,19,0.9)] shadow-[0_20px_50px_rgba(0,0,0,0.18)]">
        <CardHeader className="space-y-4">
          <CardTitle className="text-xl">{uiText.productList}</CardTitle>

          <div className="flex flex-col gap-3">
            <div className="flex min-w-0 items-center gap-2 rounded-full border border-border/70 bg-background/72 px-4 py-2">
              <SearchIcon className="size-4 text-muted-foreground" />
              <Input
                value={searchValue}
                onChange={(event) => setSearchValue(event.target.value)}
                placeholder={uiText.searchPlaceholder}
                className="border-none bg-transparent px-0 text-foreground shadow-none focus-visible:ring-0 dark:bg-transparent!"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant={status === 'ALL' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setParam('status', undefined)}
              >
                {uiText.all}
              </Button>
              <Button
                type="button"
                variant={status === 'PUBLISHED' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setParam('status', 'PUBLISHED')}
              >
                {uiText.publishedFilter}
              </Button>
              <Button
                type="button"
                variant={status === 'UNPUBLISHED' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setParam('status', 'UNPUBLISHED')}
              >
                {uiText.hiddenFilter}
              </Button>
              <Button
                type="button"
                variant={flashSaleOnly ? 'default' : 'outline'}
                size="sm"
                onClick={() =>
                  setParam('flashSale', flashSaleOnly ? undefined : 'true')
                }
              >
                {uiText.onSale}
              </Button>
              <Button
                type="button"
                variant={lowStockOnly ? 'default' : 'outline'}
                size="sm"
                onClick={() =>
                  setParam('lowStock', lowStockOnly ? undefined : 'true')
                }
              >
                {uiText.lowStockFilter}
              </Button>
              <Select
                value={category}
                onValueChange={(value) =>
                  setParam('category', value === 'all' ? undefined : value)
                }
              >
                <SelectTrigger className="w-56 rounded-full">
                  <SelectValue placeholder={uiText.allCategories} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{uiText.allCategories}</SelectItem>
                  {categories.map((item) => (
                    <SelectItem key={item.id} value={item.slug}>
                      {item.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => router.replace(pathname)}
              >
                {uiText.clearFilters}
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="overflow-x-auto">
          {errorMessage ? (
            <div className="mb-4 rounded-[1.2rem] border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {errorMessage}
            </div>
          ) : null}

          <table className="min-w-full border-separate border-spacing-y-3">
            <thead>
              <tr className="text-left text-[0.72rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                <th className="pb-1 pr-4">{uiText.product}</th>
                <th className="pb-1 pr-4">{uiText.category}</th>
                <th className="pb-1 pr-4">{uiText.status}</th>
                <th className="pb-1 pr-4">{uiText.price}</th>
                <th className="pb-1 pr-4">{uiText.compareAt}</th>
                <th className="pb-1 pr-4">{uiText.stock}</th>
                <th className="pb-1 pr-4">{uiText.updated}</th>
                <th className="pb-1 pr-4">{uiText.actions}</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr
                  key={product.id}
                  className="rounded-[1.5rem] bg-background/72"
                >
                  <td className="rounded-l-[1.4rem] border-y border-l border-border/60 px-4 py-4">
                    <div className="flex items-center gap-3">
                      <span className="relative flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-[1rem] border border-border/60 bg-[linear-gradient(180deg,#2d201c_0%,#201613_100%)]">
                        {product.imageUrl ? (
                          <img
                            src={product.imageUrl}
                            alt={product.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <span className="text-[0.65rem] uppercase tracking-[0.24em] text-muted-foreground">
                            FACEE
                          </span>
                        )}
                      </span>
                      <span className="min-w-0">
                        <span className="block font-semibold text-foreground">
                          {product.name}
                        </span>
                        <span className="block text-xs uppercase tracking-[0.18em] text-muted-foreground">
                          {product.sku}
                        </span>
                        <span className="block text-xs text-muted-foreground">
                          /{product.slug}
                        </span>
                      </span>
                    </div>
                  </td>
                  <td className="border-y border-border/60 px-4 py-4 text-sm text-muted-foreground">
                    {product.category.name}
                  </td>
                  <td className="border-y border-border/60 px-4 py-4">
                    <div className="flex flex-wrap gap-2">
                      {getProductBadges(product, locale, uiText.onSale).map(
                        (badge) => (
                          <Badge
                            key={badge.label}
                            variant="outline"
                            className={badge.className}
                          >
                            {badge.label}
                          </Badge>
                        ),
                      )}
                    </div>
                  </td>
                  <td className="border-y border-border/60 px-4 py-4 text-sm font-medium text-foreground">
                    {formatOrderPrice(product.price, locale)}
                  </td>
                  <td className="border-y border-border/60 px-4 py-4 text-sm text-muted-foreground">
                    {product.compareAtPrice === null ? (
                      uiText.compareAtEmpty
                    ) : (
                      <span className="line-through decoration-current/70">
                        {formatOrderPrice(product.compareAtPrice, locale)}
                      </span>
                    )}
                  </td>
                  <td className="border-y border-border/60 px-4 py-4 text-sm text-foreground">
                    {product.stock}
                  </td>
                  <td className="border-y border-border/60 px-4 py-4 text-sm text-muted-foreground">
                    {formatOrderDate(product.updatedAt, locale)}
                  </td>
                  <td className="rounded-r-[1.4rem] border-y border-r border-border/60 px-4 py-4">
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/admin/products/${product.id}`}>
                        <PencilIcon data-icon="inline-start" />
                        {uiText.edit}
                      </Link>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {!isLoading && products.length === 0 ? (
            <div className="rounded-[1.5rem] border border-dashed border-border/70 bg-background/68 p-5 text-sm leading-6 text-muted-foreground">
              {uiText.empty}
            </div>
          ) : null}

          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">
                {uiText.rowsPerPage}
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
                disabled={meta.page <= 1}
                onClick={() => setParam('page', String(meta.page - 1))}
              >
                {uiText.previous}
              </Button>
              <p className="text-sm text-muted-foreground">
                {meta.page} / {meta.totalPages}
              </p>
              <Button
                type="button"
                variant="outline"
                disabled={meta.page >= meta.totalPages}
                onClick={() => setParam('page', String(meta.page + 1))}
              >
                {uiText.next}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}

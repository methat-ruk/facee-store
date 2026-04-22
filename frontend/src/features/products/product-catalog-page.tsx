'use client';

import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { startTransition, useEffect, useState } from 'react';
import { CatalogEmptyState } from './catalog-empty-state';
import { CatalogErrorState } from './catalog-error-state';
import { CatalogLoading } from './catalog-loading';
import { CatalogPagination } from './catalog-pagination';
import { CatalogToolbar } from './catalog-toolbar';
import { ProductCard } from './product-card';
import {
  type Category,
  type ProductListResponse,
  type ProductSort,
} from './schemas';
import { getCategories, getProducts } from '@/services/catalog';

const DEFAULT_SORT: ProductSort = 'newest';
const DEFAULT_LIMIT = 9;

export function ProductCatalogPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const category = searchParams.get('category') ?? undefined;
  const sort = (searchParams.get('sort') as ProductSort | null) ?? DEFAULT_SORT;
  const page = Number(searchParams.get('page') ?? '1');

  const [categories, setCategories] = useState<Category[]>([]);
  const [catalog, setCatalog] = useState<ProductListResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;

    async function loadCatalog() {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const [categoriesResponse, productsResponse] = await Promise.all([
          getCategories(),
          getProducts({
            category,
            sort,
            page: Number.isNaN(page) || page < 1 ? 1 : page,
            limit: DEFAULT_LIMIT,
          }),
        ]);

        if (isCancelled) {
          return;
        }

        setCategories(categoriesResponse);
        setCatalog(productsResponse);
      } catch (error) {
        if (isCancelled) {
          return;
        }

        setErrorMessage(
          error instanceof Error
            ? error.message
            : 'Unable to load the product catalog right now.',
        );
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadCatalog();

    return () => {
      isCancelled = true;
    };
  }, [category, page, sort]);

  function updateQuery(nextValues: {
    category?: string;
    sort?: ProductSort;
    page?: number;
  }) {
    const params = new URLSearchParams(searchParams.toString());

    const nextCategory = nextValues.category;
    const nextSort = nextValues.sort ?? sort;
    const nextPage = nextValues.page ?? page;

    if (nextCategory) {
      params.set('category', nextCategory);
    } else {
      params.delete('category');
    }

    if (nextSort === DEFAULT_SORT) {
      params.delete('sort');
    } else {
      params.set('sort', nextSort);
    }

    if (nextPage <= 1) {
      params.delete('page');
    } else {
      params.set('page', String(nextPage));
    }

    startTransition(() => {
      router.replace(params.toString() ? `${pathname}?${params}` : pathname);
    });
  }

  const activeCategoryLabel = categories.find(
    (item) => item.slug === category,
  )?.name;

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#fff8f3_0%,#f6e6da_100%)] px-4 py-6 sm:px-8 sm:py-8 lg:px-10 lg:py-10">
      <div className="mx-auto flex w-full max-w-7xl flex-col px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <div className="space-y-8">
          <CatalogToolbar
            categories={categories}
            activeCategory={category}
            sort={sort}
            onCategoryChange={(nextCategory) =>
              updateQuery({
                category: nextCategory,
                page: 1,
              })
            }
            onSortChange={(nextSort) =>
              updateQuery({
                sort: nextSort,
                page: 1,
              })
            }
          />

          <div className="flex flex-wrap items-center justify-between gap-3 px-1">
            <p className="text-sm text-muted">
              {catalog
                ? `${catalog.meta.totalItems} published product${
                    catalog.meta.totalItems === 1 ? '' : 's'
                  }`
                : 'Loading published products...'}
            </p>
            <Link
              href="/"
              className="text-sm font-medium text-foreground underline decoration-accent/70 underline-offset-4"
            >
              Back to home
            </Link>
          </div>

          {errorMessage ? (
            <CatalogErrorState message={errorMessage} />
          ) : isLoading ? (
            <CatalogLoading />
          ) : catalog && catalog.items.length > 0 ? (
            <div className="space-y-8">
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {catalog.items.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>

              <CatalogPagination
                currentPage={catalog.meta.page}
                totalPages={catalog.meta.totalPages}
                onPageChange={(nextPage) =>
                  updateQuery({
                    page: nextPage,
                  })
                }
              />
            </div>
          ) : (
            <CatalogEmptyState categoryLabel={activeCategoryLabel} />
          )}
        </div>
      </div>
    </main>
  );
}

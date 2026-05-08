'use client';

import { useTranslations } from 'next-intl';
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
const DEFAULT_LIMIT = 24;

export function ProductCatalogPage() {
  const t = useTranslations('products');
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const category = searchParams.get('category') ?? undefined;
  const query = searchParams.get('query') ?? undefined;
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
            query,
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
  }, [category, page, query, sort]);

  function updateQuery(nextValues: {
    category?: string;
    query?: string;
    sort?: ProductSort;
    page?: number;
  }) {
    const params = new URLSearchParams(searchParams.toString());

    const nextCategory = nextValues.category;
    const nextQuery = nextValues.query;
    const nextSort = nextValues.sort ?? sort;
    const nextPage = nextValues.page ?? page;

    if (nextCategory) {
      params.set('category', nextCategory);
    } else {
      params.delete('category');
    }

    if (nextQuery) {
      params.set('query', nextQuery);
    } else {
      params.delete('query');
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
    <main className="mx-auto flex h-full w-full max-w-[1560px] flex-1 flex-col gap-8 px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-12">
      <header className="space-y-3 border-b border-border/70 pb-8">
        <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
          {t('title')}
        </h1>
      </header>

      <div className="space-y-8">
        <CatalogToolbar
          categories={categories}
          activeCategory={category}
          sort={sort}
          onCategoryChange={(nextCategory) =>
            updateQuery({
              category: nextCategory,
              query,
              page: 1,
            })
          }
          onSortChange={(nextSort) =>
            updateQuery({
              query,
              sort: nextSort,
              page: 1,
            })
          }
        />

        <div className="flex flex-wrap items-center justify-between gap-3 px-1">
          <p className="text-sm text-muted-foreground">
            {catalog
              ? t('publishedCount', { count: catalog.meta.totalItems })
              : t('loadingPublished')}
          </p>
        </div>

        {errorMessage ? (
          <CatalogErrorState message={errorMessage} />
        ) : isLoading ? (
          <CatalogLoading />
        ) : catalog && catalog.items.length > 0 ? (
          <div className="space-y-8">
            <div className="grid grid-cols-2 items-start gap-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {catalog.items.map((product, index) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  eagerImage={index < 6}
                />
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
    </main>
  );
}

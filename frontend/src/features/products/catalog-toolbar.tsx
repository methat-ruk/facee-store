'use client';

import { cn } from '@/lib/cn';
import type { Category, ProductSort } from './schemas';

const sortOptions: Array<{ value: ProductSort; label: string }> = [
  { value: 'newest', label: 'Newest' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'name-asc', label: 'Name: A to Z' },
];

type CatalogToolbarProps = {
  categories: Category[];
  activeCategory?: string;
  sort: ProductSort;
  onCategoryChange: (nextCategory?: string) => void;
  onSortChange: (nextSort: ProductSort) => void;
};

export function CatalogToolbar({
  categories,
  activeCategory,
  sort,
  onCategoryChange,
  onSortChange,
}: CatalogToolbarProps) {
  return (
    <div className="space-y-5 rounded-4xl border border-[#ead7ca] bg-white/92 p-5 shadow-[0_18px_40px_rgba(132,83,60,0.08)] backdrop-blur sm:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-muted">
            Product Catalog
          </p>
          <h1 className="mt-3 text-3xl font-semibold text-foreground">
            Discover Facee skincare essentials
          </h1>
        </div>

        <label className="flex w-full flex-col gap-2 text-sm text-muted lg:w-auto">
          <span className="font-medium">Sort by</span>
          <div className="group relative w-full sm:w-auto">
            <select
              value={sort}
              onChange={(event) =>
                onSortChange(event.target.value as ProductSort)
              }
              className="w-full cursor-pointer appearance-none rounded-2xl border border-border bg-[#fffaf6] px-4 py-3 pr-11 text-sm text-foreground outline-none transition hover:border-accent hover:bg-white focus:border-accent sm:min-w-56 sm:pr-12"
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-muted transition group-hover:text-foreground sm:right-4">
              <svg
                aria-hidden="true"
                viewBox="0 0 20 20"
                fill="none"
                className="h-4 w-4"
              >
                <path
                  d="M5 7.5L10 12.5L15 7.5"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
          </div>
        </label>
      </div>

      <div className="flex flex-wrap gap-2 sm:gap-3">
        <button
          type="button"
          onClick={() => onCategoryChange(undefined)}
          className={cn(
            'cursor-pointer rounded-full px-4 py-2 text-sm font-medium transition',
            !activeCategory
              ? 'bg-foreground text-background'
              : 'border border-border bg-white text-foreground hover:border-accent',
          )}
        >
          All categories
        </button>

        {categories.map((category) => {
          const isActive = category.slug === activeCategory;

          return (
            <button
              key={category.id}
              type="button"
              onClick={() => onCategoryChange(category.slug)}
              className={cn(
                'cursor-pointer rounded-full px-4 py-2 text-sm font-medium transition',
                isActive
                  ? 'bg-foreground text-background'
                  : 'border border-border bg-white text-foreground hover:border-accent',
              )}
            >
              {category.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}

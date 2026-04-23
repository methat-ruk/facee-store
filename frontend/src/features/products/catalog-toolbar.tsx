'use client';

import { useLocale, useTranslations } from 'next-intl';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { getLocalizedCategoryName } from './localized-content';
import type { Category, ProductSort } from './schemas';

const sortOptions: Array<{ value: ProductSort; labelKey: string }> = [
  { value: 'newest', labelKey: 'sortNewest' },
  { value: 'price-asc', labelKey: 'sortPriceAsc' },
  { value: 'price-desc', labelKey: 'sortPriceDesc' },
  { value: 'name-asc', labelKey: 'sortNameAsc' },
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
  const locale = useLocale();
  const t = useTranslations('products');

  return (
    <Card className="border-border/80 bg-card/92 shadow-[0_18px_40px_rgba(132,83,60,0.08)]">
      <CardHeader className="gap-3">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-2">
            <CardTitle>{t('toolbarTitle')}</CardTitle>
            <CardDescription>{t('toolbarDescription')}</CardDescription>
          </div>

          <div className="flex w-full flex-col gap-2 text-sm lg:w-auto">
            <span className="font-medium text-muted-foreground">
              {t('sortBy')}
            </span>
            <Select
              value={sort}
              onValueChange={(value) => onSortChange(value as ProductSort)}
            >
              <SelectTrigger className="w-full border-[#9d6c59] bg-background shadow-[0_8px_24px_rgba(132,83,60,0.06)] focus-visible:border-[#9d6c59] sm:min-w-56">
                <SelectValue placeholder={t('sortBy')} />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {sortOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {t(option.labelKey)}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <ToggleGroup
          type="single"
          value={activeCategory ?? 'all'}
          onValueChange={(value) =>
            onCategoryChange(value && value !== 'all' ? value : undefined)
          }
          className="flex w-full flex-wrap justify-start gap-2 rounded-[1.6rem] border border-border/70 bg-[linear-gradient(180deg,rgba(255,250,247,0.96)_0%,rgba(249,239,232,0.92)_100%)] p-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] dark:bg-[linear-gradient(180deg,rgba(44,30,24,0.94)_0%,rgba(38,26,22,0.96)_100%)]"
        >
          <ToggleGroupItem
            value="all"
            variant="outline"
            className="rounded-full border-transparent bg-transparent px-4 text-foreground/80 hover:border-border hover:bg-background/85 data-[state=on]:border-[#b97c61]/35 data-[state=on]:bg-[#f3d5c8] data-[state=on]:text-[#4f2e24] dark:data-[state=on]:bg-[#5b3a30] dark:data-[state=on]:text-[#fff4ee]"
          >
            {t('allCategories')}
          </ToggleGroupItem>

          {categories.map((category) => (
            <ToggleGroupItem
              key={category.id}
              value={category.slug}
              variant="outline"
              className="rounded-full border-transparent bg-transparent px-4 text-foreground/80 hover:border-border hover:bg-background/85 data-[state=on]:border-[#b97c61]/35 data-[state=on]:bg-[#f3d5c8] data-[state=on]:text-[#4f2e24] dark:data-[state=on]:bg-[#5b3a30] dark:data-[state=on]:text-[#fff4ee]"
            >
              {getLocalizedCategoryName(category, locale)}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </CardContent>
    </Card>
  );
}

'use client';

import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/navigation';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

type RouteTabsProps = {
  items: Array<{
    href: '/products';
    labelKey: 'products';
  }>;
  onAction?: () => void;
  vertical?: boolean;
};

export function RouteTabs({
  items,
  onAction,
  vertical = false,
}: RouteTabsProps) {
  const pathname = usePathname();
  const t = useTranslations('topbar');
  const value = items.find((item) => item.href === pathname)?.href ?? '';

  return (
    <Tabs
      value={value}
      orientation={vertical ? 'vertical' : 'horizontal'}
      className={vertical ? 'w-full' : 'h-full'}
    >
      <TabsList
        variant={vertical ? 'default' : 'line'}
        className={
          vertical
            ? 'h-auto w-full flex-col items-stretch rounded-2xl bg-muted/35 p-1.5'
            : 'h-full self-stretch rounded-none bg-transparent p-0'
        }
      >
        {items.map((item) => (
          <TabsTrigger
            key={item.href}
            value={item.href}
            asChild
            className={
              vertical
                ? 'w-full justify-start rounded-xl px-4 py-3 text-left text-foreground/80 hover:bg-[#f4ddd2] hover:text-[#4a2d23] hover:shadow-[0_10px_24px_rgba(132,83,60,0.12)] data-active:bg-background data-active:text-foreground data-active:shadow-sm dark:hover:bg-[#563730] dark:hover:text-[#fff3ed]'
                : 'h-full rounded-none border-none bg-transparent px-0 pt-1 pb-3 text-[0.95rem] font-medium text-foreground/70 shadow-none data-active:bg-transparent data-active:text-foreground hover:text-foreground focus-visible:border-transparent focus-visible:ring-0 after:-bottom-4 after:h-0.5 after:bg-[#b97c61]'
            }
          >
            <Link href={item.href} prefetch={false} onClick={onAction}>
              {t(item.labelKey)}
            </Link>
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}

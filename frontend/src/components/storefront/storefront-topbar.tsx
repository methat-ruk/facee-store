'use client';

import { MenuIcon, ShoppingCartIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { BrandWordmark } from '@/components/brand-wordmark';
import { AuthActions } from '@/components/shared/auth-actions';
import { LocaleSwitcher } from '@/components/shared/locale-switcher';
import { RouteTabs } from '@/components/shared/route-tabs';
import { ThemeSwitch } from '@/components/shared/theme-switch';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Link } from '@/i18n/navigation';
import { getCartItemCount, useCartStore } from '@/store/use-cart-store';
import { storefrontNavItems } from './storefront-nav';

function StorefrontMenuPanel({
  showBrand = true,
  showNavigation = true,
}: {
  showBrand?: boolean;
  showNavigation?: boolean;
}) {
  const t = useTranslations('topbar');

  return (
    <div className="flex flex-col gap-5">
      {showBrand ? <BrandWordmark compact /> : null}
      {showNavigation ? (
        <div className="flex flex-col gap-3">
          <p className="px-1 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            {t('menuNavigate')}
          </p>
          <RouteTabs items={[...storefrontNavItems]} vertical />
          <Button
            asChild
            variant="ghost"
            className="w-full justify-start rounded-xl px-4 py-3 text-left text-foreground/80 hover:bg-muted hover:text-foreground"
          >
            <Link href="/cart">{t('cart')}</Link>
          </Button>
        </div>
      ) : null}
      {showNavigation ? <Separator /> : null}
      <div className="flex flex-col gap-3">
        <p className="px-1 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          {t('menuPreferences')}
        </p>
        <div className="flex flex-col gap-3 rounded-2xl border border-border/80 bg-card/80 px-4 py-3">
          <LocaleSwitcher />
          <ThemeSwitch />
        </div>
      </div>
      <Separator />
      <div className="flex flex-col gap-3">
        <p className="px-1 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          {t('menuAccount')}
        </p>
        <AuthActions menu />
      </div>
    </div>
  );
}

export function StorefrontTopbar() {
  const t = useTranslations('topbar');
  const cartItemCount = useCartStore((state) => getCartItemCount(state.items));
  const [desktopMenuOpen, setDesktopMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(min-width: 768px)');

    const closeMenus = () => {
      setDesktopMenuOpen(false);
      setMobileMenuOpen(false);
    };

    mediaQuery.addEventListener('change', closeMenus);

    return () => {
      mediaQuery.removeEventListener('change', closeMenus);
    };
  }, []);

  return (
    <header className="sticky top-0 z-80 border-b border-border/80 bg-background/90 shadow-[0_10px_30px_rgba(88,51,38,0.06)] backdrop-blur-xl">
      <div className="relative mx-auto flex min-h-18 w-full max-w-7xl items-center gap-4 px-4 py-3 sm:px-6 sm:py-4 lg:px-8">
        <Link
          href="/products"
          className="rounded-[1.4rem] px-1 py-0.5 transition hover:opacity-85"
          aria-label="Go to Facee products"
        >
          <BrandWordmark />
        </Link>

        <div className="hidden md:absolute md:top-1/2 md:left-1/2 md:block md:-translate-x-1/2 md:-translate-y-1/2">
          <div className="justify-self-center">
            <RouteTabs items={[...storefrontNavItems]} />
          </div>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <Button
            asChild
            variant="outline"
            size="icon"
            className="relative shrink-0"
            aria-label={t('cartLabel', { count: cartItemCount })}
          >
            <Link href="/cart">
              <ShoppingCartIcon />
              {cartItemCount > 0 ? (
                <span className="absolute -top-1 -right-1 flex size-5 items-center justify-center rounded-full bg-primary text-[0.68rem] font-semibold text-primary-foreground">
                  {cartItemCount > 99 ? '99+' : cartItemCount}
                </span>
              ) : null}
            </Link>
          </Button>

          <AuthActions />

          <div className="hidden md:block">
            <DropdownMenu
              modal={false}
              open={desktopMenuOpen}
              onOpenChange={setDesktopMenuOpen}
            >
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="shrink-0"
                  aria-label={t('openMenu')}
                >
                  <MenuIcon />
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent
                align="end"
                side="bottom"
                sideOffset={16}
                className="mt-4 w-100 max-w-[calc(100vw-2rem)] rounded-[1.75rem] p-4"
              >
                <StorefrontMenuPanel showNavigation={false} />
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="md:hidden">
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="shrink-0"
                  aria-label={t('openMenu')}
                >
                  <MenuIcon />
                </Button>
              </SheetTrigger>

              <SheetContent
                side="top"
                showCloseButton={false}
                overlayClassName="top-18 z-70 bg-[rgba(49,31,24,0.12)] supports-backdrop-filter:backdrop-blur-[2px]"
                className="top-20 right-4 left-4 z-75 rounded-[1.75rem] border border-border/90 bg-background/96 px-4 py-4 shadow-[0_24px_60px_rgba(132,83,60,0.14)] data-[side=top]:inset-x-4 data-[side=top]:top-20 data-[side=top]:rounded-[1.75rem] data-[side=top]:border"
              >
                <SheetTitle className="sr-only">Facee navigation</SheetTitle>
                <SheetDescription className="sr-only">
                  Localized storefront navigation with theme and language
                  controls.
                </SheetDescription>

                <StorefrontMenuPanel />
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}

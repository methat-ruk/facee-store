'use client';

import { MenuIcon, SearchIcon, ShoppingCartIcon, XIcon } from 'lucide-react';
import { FormEvent, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
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
import { Input } from '@/components/ui/input';
import { Link, usePathname, useRouter } from '@/i18n/navigation';
import { getCartItemCount, useCartStore } from '@/store/use-cart-store';
import { CART_HIGHLIGHT_EVENT } from '@/features/products/cart-fly-animation';
import { storefrontNavItems } from './storefront-nav';

function TopbarSearchForm({
  initialQuery,
  onSubmit,
  placeholder,
  submitLabel,
  clearLabel,
  mobile = false,
}: {
  initialQuery: string;
  onSubmit: (value: string) => void;
  placeholder: string;
  submitLabel: string;
  clearLabel: string;
  mobile?: boolean;
}) {
  const [searchValue, setSearchValue] = useState(initialQuery);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit(searchValue.trim());
  };

  return (
    <form
      key={initialQuery}
      className={
        mobile ? 'flex items-center' : 'hidden items-center gap-3 md:flex'
      }
      onSubmit={handleSubmit}
    >
      <div
        className={
          mobile
            ? 'flex h-11 w-full items-center gap-2 rounded-full border border-border/80 bg-[#f6ebe4]/92 px-3 shadow-[0_10px_24px_rgba(88,51,38,0.06)] transition-colors focus-within:border-[#b97c61]/60 dark:border-[#5a4037] dark:bg-[#2a1f1b]'
            : 'flex h-11 w-[min(26rem,34vw)] items-center gap-2 rounded-full border border-border/80 bg-[#f6ebe4]/92 px-3 shadow-[0_10px_24px_rgba(88,51,38,0.06)] transition-colors focus-within:border-[#b97c61]/60 dark:border-[#5a4037] dark:bg-[#2a1f1b]'
        }
      >
        <SearchIcon className="size-4 text-muted-foreground" />
        <Input
          type="text"
          name="query"
          value={searchValue}
          onChange={(event) => setSearchValue(event.target.value)}
          placeholder={placeholder}
          className="h-8 border-none bg-transparent px-0 shadow-none focus-visible:ring-0 dark:bg-transparent!"
          aria-label={submitLabel}
        />
        {searchValue ? (
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            className="shrink-0 cursor-pointer rounded-full text-muted-foreground hover:bg-foreground/8 hover:text-foreground"
            aria-label={clearLabel}
            onClick={() => {
              setSearchValue('');
              onSubmit('');
            }}
          >
            <XIcon />
          </Button>
        ) : null}
      </div>
    </form>
  );
}

function StorefrontMenuPanel({
  onAction,
  showBrand = true,
  showNavigation = true,
}: {
  onAction?: () => void;
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
          <RouteTabs
            items={[...storefrontNavItems]}
            vertical
            onAction={onAction}
          />
          <Button
            asChild
            variant="ghost"
            className="w-full justify-start rounded-xl px-4 py-3 text-left text-foreground/80 hover:bg-muted hover:text-foreground"
          >
            <Link href="/cart" prefetch={false} onClick={onAction}>
              {t('cart')}
            </Link>
          </Button>
        </div>
      ) : null}
      {showNavigation ? <Separator /> : null}
      <div className="flex flex-col gap-3">
        <p className="px-1 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          {t('menuPreferences')}
        </p>
        <div className="flex flex-col gap-3 rounded-2xl border border-border/80 bg-card/80 px-4 py-3">
          <LocaleSwitcher onAction={onAction} />
          <ThemeSwitch onAction={onAction} />
        </div>
      </div>
      <Separator />
      <div className="flex flex-col gap-3">
        <p className="px-1 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          {t('menuAccount')}
        </p>
        <AuthActions menu onAction={onAction} />
      </div>
    </div>
  );
}

export function StorefrontTopbar() {
  const t = useTranslations('topbar');
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentSearchQuery =
    pathname === '/products' ? (searchParams.get('query') ?? '') : '';
  const cartItemCount = useCartStore((state) => getCartItemCount(state.items));
  const [desktopMenuOpen, setDesktopMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [isCartHighlighted, setIsCartHighlighted] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(min-width: 768px)');

    const closeMenus = () => {
      setDesktopMenuOpen(false);
      setMobileMenuOpen(false);
      setMobileSearchOpen(false);
    };

    mediaQuery.addEventListener('change', closeMenus);

    return () => {
      mediaQuery.removeEventListener('change', closeMenus);
    };
  }, []);

  useEffect(() => {
    let timeoutId = 0;

    const handleCartHighlight = () => {
      window.clearTimeout(timeoutId);
      setIsCartHighlighted(true);
      timeoutId = window.setTimeout(() => {
        setIsCartHighlighted(false);
      }, 520);
    };

    window.addEventListener(CART_HIGHLIGHT_EVENT, handleCartHighlight);

    return () => {
      window.clearTimeout(timeoutId);
      window.removeEventListener(CART_HIGHLIGHT_EVENT, handleCartHighlight);
    };
  }, []);

  const handleSearchSubmit = (value: string) => {
    const params =
      pathname === '/products'
        ? new URLSearchParams(searchParams.toString())
        : new URLSearchParams();
    const normalizedQuery = value.trim();

    if (normalizedQuery) {
      params.set('query', normalizedQuery);
      params.delete('page');
    } else {
      params.delete('query');
      params.delete('page');
    }

    const href = params.toString() ? `/products?${params}` : '/products';
    setMobileSearchOpen(false);
    router.push(href);
  };

  return (
    <header className="sticky top-0 z-80 border-b border-border/80 bg-background/90 shadow-[0_10px_30px_rgba(88,51,38,0.06)] backdrop-blur-xl">
      <div className="mx-auto w-full max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex min-h-16 items-center gap-4">
          <div className="flex min-w-0 items-center gap-6 lg:gap-10">
            <Link
              href="/products"
              prefetch={false}
              className="rounded-[1.4rem] px-1 py-0.5 transition hover:opacity-85"
              aria-label="Go to Facee products"
            >
              <BrandWordmark />
            </Link>

            <div className="hidden md:block">
              <RouteTabs items={[...storefrontNavItems]} />
            </div>
          </div>

          <div className="ml-auto flex items-center gap-3">
            <TopbarSearchForm
              initialQuery={currentSearchQuery}
              onSubmit={handleSearchSubmit}
              placeholder={t('searchPlaceholder')}
              submitLabel={t('searchSubmit')}
              clearLabel={t('clearSearch')}
            />

            <div className="hidden self-stretch px-1 md:flex md:items-center">
              <div className="h-6 w-px bg-border/80" />
            </div>

            <Button
              type="button"
              variant="outline"
              size="icon"
              className="shrink-0 md:hidden"
              aria-label={t('searchSubmit')}
              onClick={() => setMobileSearchOpen((current) => !current)}
            >
              {mobileSearchOpen ? <XIcon /> : <SearchIcon />}
            </Button>

            <Button
              asChild
              variant="outline"
              size="icon"
              className={`relative shrink-0 ${
                isCartHighlighted
                  ? 'motion-safe:animate-[cart-target-bump_520ms_cubic-bezier(0.2,0.9,0.25,1)]'
                  : ''
              }`}
              aria-label={t('cartLabel', { count: cartItemCount })}
            >
              <Link href="/cart" prefetch={false} data-cart-anchor="storefront">
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
                  <StorefrontMenuPanel
                    showNavigation={false}
                    onAction={() => setDesktopMenuOpen(false)}
                  />
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

                  <StorefrontMenuPanel
                    onAction={() => setMobileMenuOpen(false)}
                  />
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>

        {mobileSearchOpen ? (
          <div className="border-t border-border/70 pt-3 md:hidden">
            <TopbarSearchForm
              mobile
              initialQuery={currentSearchQuery}
              onSubmit={handleSearchSubmit}
              placeholder={t('searchPlaceholder')}
              submitLabel={t('searchSubmit')}
              clearLabel={t('clearSearch')}
            />
          </div>
        ) : null}
      </div>
    </header>
  );
}

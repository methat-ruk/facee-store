'use client';

import Image from 'next/image';
import { MenuIcon, SearchIcon, ShoppingCartIcon, XIcon } from 'lucide-react';
import {
  FormEvent,
  startTransition,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { BrandWordmark } from '@/components/brand-wordmark';
import { AuthActions } from '@/components/shared/auth-actions';
import { LocaleSwitcher } from '@/components/shared/locale-switcher';
import { NotificationsMenu } from '@/components/shared/notifications-menu';
import { RouteTabs } from '@/components/shared/route-tabs';
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
import { cn } from '@/lib/cn';
import { Link, usePathname, useRouter } from '@/i18n/navigation';
import { getProducts } from '@/services/catalog';
import { getCartItemCount, useCartStore } from '@/store/use-cart-store';
import { useAuthStore } from '@/store/use-auth-store';
import { CART_HIGHLIGHT_EVENT } from '@/features/products/cart-fly-animation';
import { getLocalizedProduct } from '@/features/products/localized-content';
import type { Product } from '@/features/products/schemas';
import { formatOrderPrice } from '@/features/orders/ui';
import { storefrontNavItems } from './storefront-nav';

function buildProductsSearchHref(query: string) {
  const normalizedQuery = query.trim();

  if (!normalizedQuery) {
    return '/products';
  }

  const params = new URLSearchParams({
    query: normalizedQuery,
  });

  return `/products?${params.toString()}`;
}

function TopbarSearchForm({
  initialQuery,
  onSubmit,
  placeholder,
  submitLabel,
  clearLabel,
  loadingLabel,
  noResultsLabel,
  viewAllLabel,
  flashSaleLabel,
  mobile = false,
  onNavigate,
}: {
  initialQuery: string;
  onSubmit: (value: string) => void;
  placeholder: string;
  submitLabel: string;
  clearLabel: string;
  loadingLabel: string;
  noResultsLabel: string;
  viewAllLabel: string;
  flashSaleLabel: string;
  mobile?: boolean;
  onNavigate?: () => void;
}) {
  const locale = useLocale();
  const [searchValue, setSearchValue] = useState(initialQuery);
  const [suggestions, setSuggestions] = useState<Product[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(
    () => initialQuery.trim().length > 0,
  );
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [suggestionQuery, setSuggestionQuery] = useState('');
  const normalizedQuery = searchValue.trim();
  const deferredQuery = useDeferredValue(normalizedQuery);
  const formRef = useRef<HTMLFormElement | null>(null);

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (!formRef.current?.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
    };
  }, []);

  useEffect(() => {
    if (!deferredQuery) {
      return;
    }

    let isCancelled = false;

    const timeoutId = window.setTimeout(async () => {
      try {
        const response = await getProducts({
          query: deferredQuery,
          sort: 'name-asc',
          page: 1,
          limit: 5,
        });

        if (isCancelled) {
          return;
        }

        setSuggestions(response.items);
        setSuggestionQuery(deferredQuery);
      } catch {
        if (isCancelled) {
          return;
        }

        setSuggestions([]);
        setSuggestionQuery(deferredQuery);
      } finally {
        if (!isCancelled) {
          setIsLoadingSuggestions(false);
        }
      }
    }, 180);

    return () => {
      isCancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [deferredQuery]);

  const localizedSuggestions = useMemo(
    () => suggestions.map((product) => getLocalizedProduct(product, locale)),
    [locale, suggestions],
  );

  const shouldShowDropdown =
    isDropdownOpen &&
    normalizedQuery.length > 0 &&
    (isLoadingSuggestions || suggestionQuery === deferredQuery);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsDropdownOpen(false);
    onSubmit(searchValue.trim());
  };

  return (
    <form
      key={initialQuery}
      ref={formRef}
      className={
        mobile
          ? 'relative flex items-center'
          : 'relative hidden items-center gap-3 xl:flex'
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
          onChange={(event) => {
            const nextValue = event.target.value;
            const nextNormalizedQuery = nextValue.trim();

            setSearchValue(nextValue);

            if (!nextNormalizedQuery) {
              setSuggestions([]);
              setSuggestionQuery('');
              setIsLoadingSuggestions(false);
              return;
            }

            setIsLoadingSuggestions(true);
          }}
          onFocus={() => setIsDropdownOpen(true)}
          placeholder={placeholder}
          className="h-8 border-none bg-transparent px-0 shadow-none focus-visible:ring-0 dark:bg-transparent!"
          aria-label={submitLabel}
          aria-expanded={shouldShowDropdown}
          aria-controls={
            mobile
              ? 'topbar-search-suggestions-mobile'
              : 'topbar-search-suggestions'
          }
          autoComplete="off"
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
              setSuggestions([]);
              setSuggestionQuery('');
              setIsLoadingSuggestions(false);
              setIsDropdownOpen(false);
              onSubmit('');
            }}
          >
            <XIcon />
          </Button>
        ) : null}
      </div>

      {shouldShowDropdown ? (
        <div
          id={
            mobile
              ? 'topbar-search-suggestions-mobile'
              : 'topbar-search-suggestions'
          }
          className={cn(
            'absolute top-[calc(100%+0.75rem)] z-95 w-full overflow-hidden rounded-[1.5rem] border border-border/80 bg-background/96 shadow-[0_24px_70px_rgba(88,51,38,0.18)] backdrop-blur-xl',
            mobile ? 'left-0' : 'right-0',
          )}
          role="listbox"
        >
          {isLoadingSuggestions ? (
            <div className="px-4 py-4 text-sm text-muted-foreground">
              {loadingLabel}
            </div>
          ) : localizedSuggestions.length > 0 ? (
            <div className="flex flex-col">
              {localizedSuggestions.map((product) => (
                <Link
                  key={product.id}
                  href={`/products/${product.slug}`}
                  className="flex items-center gap-3 border-b border-border/60 px-4 py-3 transition-colors hover:bg-foreground/4"
                  onClick={() => {
                    setIsDropdownOpen(false);
                    onNavigate?.();
                  }}
                >
                  <div className="relative flex h-14 w-14 shrink-0 overflow-hidden rounded-2xl border border-border/70 bg-[linear-gradient(180deg,#fff3ea_0%,#f7ddd0_100%)]">
                    {product.imageUrl ? (
                      <Image
                        src={product.imageUrl}
                        alt={product.name}
                        fill
                        sizes="56px"
                        className="object-cover object-top"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-[0.62rem] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                        Facee
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                        {product.category.name}
                      </p>
                      {product.isFlashSale ? (
                        <span className="rounded-full bg-[#9f2f24]/12 px-2 py-0.5 text-[0.62rem] font-semibold uppercase tracking-[0.12em] text-[#9f2f24]">
                          {flashSaleLabel}
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1 line-clamp-1 text-sm font-medium text-foreground">
                      {product.name}
                    </p>
                  </div>

                  <div className="shrink-0 text-right">
                    {product.compareAtPrice &&
                    product.compareAtPrice > product.price ? (
                      <p className="text-xs text-muted-foreground line-through decoration-muted-foreground/80">
                        {formatOrderPrice(product.compareAtPrice, locale)}
                      </p>
                    ) : null}
                    <p className="text-sm font-semibold text-foreground">
                      {formatOrderPrice(product.price, locale)}
                    </p>
                  </div>
                </Link>
              ))}

              <Link
                href={buildProductsSearchHref(normalizedQuery)}
                className="flex items-center justify-between gap-3 px-4 py-3 text-sm font-medium text-foreground transition-colors hover:bg-foreground/4"
                onClick={() => {
                  setIsDropdownOpen(false);
                  onNavigate?.();
                }}
              >
                <span>{viewAllLabel}</span>
                <span className="text-muted-foreground">
                  &ldquo;{normalizedQuery}&rdquo;
                </span>
              </Link>
            </div>
          ) : (
            <div className="px-4 py-4 text-sm text-muted-foreground">
              {noResultsLabel}
            </div>
          )}
        </div>
      ) : null}
    </form>
  );
}

function StorefrontMenuPanel({
  onAction,
  showBrand = true,
  showNavigation = true,
  showPreferences = true,
  searchSlot,
}: {
  onAction?: () => void;
  showBrand?: boolean;
  showNavigation?: boolean;
  showPreferences?: boolean;
  searchSlot?: React.ReactNode;
}) {
  const t = useTranslations('topbar');
  const user = useAuthStore((state) => state.user);

  return (
    <div className="flex flex-col gap-5">
      {showBrand ? <BrandWordmark compact /> : null}
      {searchSlot ? (
        <>
          <div className="flex flex-col gap-3">
            <p className="px-1 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              {t('searchSubmit')}
            </p>
            {searchSlot}
          </div>
          <Separator />
        </>
      ) : null}
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
      {showPreferences ? (
        <>
          <div className="flex flex-col gap-3">
            <p className="px-1 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              {t('menuPreferences')}
            </p>
            <div className="flex flex-col gap-3 rounded-2xl border border-border/80 bg-card/80 px-4 py-3">
              <LocaleSwitcher onAction={onAction} />
            </div>
          </div>
          <Separator />
        </>
      ) : null}
      <div className="flex flex-col gap-3">
        <p className="px-1 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          {t('menuAccount')}
        </p>
        {user?.role === 'ADMIN' ? (
          <Button
            asChild
            variant="ghost"
            className="w-full justify-start rounded-xl px-4 py-3 text-left text-foreground/80 hover:bg-muted hover:text-foreground"
          >
            <Link href="/admin" prefetch={false} onClick={onAction}>
              {t('adminPortal')}
            </Link>
          </Button>
        ) : null}
        <AuthActions menu onAction={onAction} />
      </div>
    </div>
  );
}

function StorefrontLocalePill() {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations('topbar');

  return (
    <div className="hidden items-center rounded-full border border-border/80 bg-background/84 p-1 md:flex">
      {(['en', 'th'] as const).map((item) => {
        const isActive = item === locale;

        return (
          <button
            key={item}
            type="button"
            className={cn(
              'rounded-full px-3 py-1.5 text-[0.7rem] font-semibold uppercase tracking-[0.18em] transition',
              isActive
                ? 'bg-[#b96f5a] text-white shadow-[0_10px_24px_rgba(185,111,90,0.22)]'
                : 'text-muted-foreground hover:text-foreground',
            )}
            aria-label={
              item === 'en' ? t('languageEnglish') : t('languageThai')
            }
            onClick={() => {
              if (item === locale) {
                return;
              }

              const query = searchParams.toString();
              const href = query ? `${pathname}?${query}` : pathname;

              startTransition(() => {
                router.replace(href, {
                  locale: item,
                });
              });
            }}
          >
            {item}
          </button>
        );
      })}
    </div>
  );
}

export function StorefrontTopbar() {
  const t = useTranslations('topbar');
  const productsT = useTranslations('products');
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentSearchQuery =
    pathname === '/products' ? (searchParams.get('query') ?? '') : '';
  const cartItemCount = useCartStore((state) => getCartItemCount(state.items));
  const user = useAuthStore((state) => state.user);
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
            <div className="hidden self-stretch px-1 md:flex md:items-center">
              <div className="h-6 w-px bg-border/80" />
            </div>

            <Button
              type="button"
              variant="outline"
              size="icon"
              className="shrink-0"
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

            {user ? (
              <NotificationsMenu audience="customer" sideOffset={40} />
            ) : null}

            <StorefrontLocalePill />

            {!user ? <AuthActions /> : null}

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
                    showPreferences={false}
                    searchSlot={
                      !user ? (
                        <TopbarSearchForm
                          mobile
                          initialQuery={currentSearchQuery}
                          onSubmit={handleSearchSubmit}
                          placeholder={t('searchPlaceholder')}
                          submitLabel={t('searchSubmit')}
                          clearLabel={t('clearSearch')}
                          loadingLabel={t('searchLoading')}
                          noResultsLabel={t('searchNoResults')}
                          viewAllLabel={t('searchViewAll')}
                          flashSaleLabel={productsT('flashSale')}
                          onNavigate={() => setDesktopMenuOpen(false)}
                        />
                      ) : null
                    }
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
                  overlayClassName="top-22 z-70 bg-[rgba(49,31,24,0.12)] supports-backdrop-filter:backdrop-blur-[2px]"
                  className="top-24 right-4 left-4 z-75 rounded-[1.75rem] border border-border/90 bg-background/96 px-4 py-4 shadow-[0_24px_60px_rgba(132,83,60,0.14)] data-[side=top]:inset-x-4 data-[side=top]:top-24 data-[side=top]:rounded-[1.75rem] data-[side=top]:border"
                >
                  <SheetTitle className="sr-only">Facee navigation</SheetTitle>
                  <SheetDescription className="sr-only">
                    Localized storefront navigation with language controls.
                  </SheetDescription>

                  <StorefrontMenuPanel
                    searchSlot={
                      <TopbarSearchForm
                        mobile
                        initialQuery={currentSearchQuery}
                        onSubmit={handleSearchSubmit}
                        placeholder={t('searchPlaceholder')}
                        submitLabel={t('searchSubmit')}
                        clearLabel={t('clearSearch')}
                        loadingLabel={t('searchLoading')}
                        noResultsLabel={t('searchNoResults')}
                        viewAllLabel={t('searchViewAll')}
                        flashSaleLabel={productsT('flashSale')}
                        onNavigate={() => setMobileMenuOpen(false)}
                      />
                    }
                    onAction={() => setMobileMenuOpen(false)}
                  />
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>

        {mobileSearchOpen ? (
          <div className="border-t border-border/70 pt-3">
            <TopbarSearchForm
              mobile
              initialQuery={currentSearchQuery}
              onSubmit={handleSearchSubmit}
              placeholder={t('searchPlaceholder')}
              submitLabel={t('searchSubmit')}
              clearLabel={t('clearSearch')}
              loadingLabel={t('searchLoading')}
              noResultsLabel={t('searchNoResults')}
              viewAllLabel={t('searchViewAll')}
              flashSaleLabel={productsT('flashSale')}
              onNavigate={() => setMobileSearchOpen(false)}
            />
          </div>
        ) : null}
      </div>
    </header>
  );
}

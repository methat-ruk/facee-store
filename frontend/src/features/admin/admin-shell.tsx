'use client';

import {
  ChevronDownIcon,
  LayoutDashboardIcon,
  LogOutIcon,
  MenuIcon,
  PanelLeftCloseIcon,
  PanelLeftOpenIcon,
  StoreIcon,
} from 'lucide-react';
import { startTransition, useEffect, useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { LocaleSwitcher } from '@/components/shared/locale-switcher';
import { NotificationsMenu } from '@/components/shared/notifications-menu';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  buildAuthNoticeHref,
  buildReturnTo,
} from '@/features/auth/auth-routing';
import { adminNavItems } from '@/features/admin/nav';
import { Link, usePathname, useRouter } from '@/i18n/navigation';
import type { AppLocale } from '@/i18n/routing';
import { cn } from '@/lib/cn';
import { useAuthStore } from '@/store/use-auth-store';
import { useNotificationsStore } from '@/store/use-notifications-store';

type AdminShellProps = {
  children: React.ReactNode;
};

type AdminNavProps = {
  collapsed?: boolean;
  mobile?: boolean;
  onAction?: () => void;
  unreadCount?: number;
};

function AdminLocalePill() {
  const locale = useLocale() as AppLocale;
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations('adminShell');

  const items: AppLocale[] = ['en', 'th'];

  return (
    <div className="hidden items-center rounded-full border border-border/70 bg-background/80 p-1 md:flex">
      {items.map((item) => {
        const isActive = item === locale;

        return (
          <button
            key={item}
            type="button"
            className={cn(
              'rounded-full px-3 py-1.5 text-[0.7rem] font-semibold uppercase tracking-[0.18em] transition',
              isActive
                ? 'bg-[#b96f5a] text-white shadow-[0_10px_24px_rgba(185,111,90,0.24)]'
                : 'text-muted-foreground hover:text-foreground',
            )}
            aria-label={
              item === 'en' ? t('switchToEnglish') : t('switchToThai')
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

function AdminAccountMenu() {
  const locale = useLocale();
  const t = useTranslations('adminShell');
  const router = useRouter();
  const logout = useAuthStore((state) => state.logout);
  const isLoggingOut = useAuthStore((state) => state.isLoggingOut);
  const user = useAuthStore((state) => state.user);

  const initials = useMemo(() => {
    const source = user?.fullName?.trim() || user?.email || 'AD';
    return source
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('');
  }, [user?.email, user?.fullName]);

  const roleLabel = locale === 'th' ? 'พื้นที่ดูแลระบบ' : 'Admin workspace';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="h-12 rounded-full border-border/70 bg-background/86 px-2.5"
        >
          <span className="flex size-8 items-center justify-center rounded-full bg-[linear-gradient(180deg,#d9b2a3_0%,#b96f5a_100%)] text-xs font-semibold text-white">
            {initials}
          </span>
          <span className="hidden min-w-0 text-left sm:flex sm:flex-col">
            <span className="max-w-32 truncate text-sm font-medium text-foreground">
              {user?.fullName || t('adminUser')}
            </span>
            <span className="max-w-32 truncate text-[0.72rem] text-muted-foreground">
              {roleLabel}
            </span>
          </span>
          <ChevronDownIcon className="text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64 rounded-3xl p-2">
        <div className="px-3 py-2">
          <p className="text-sm font-semibold text-foreground">
            {user?.fullName || t('adminUser')}
          </p>
          <p className="text-xs text-muted-foreground">{user?.email}</p>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild className="rounded-2xl">
          <Link href="/profile">{t('openStoreProfile')}</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild className="rounded-2xl">
          <Link href="/products">{t('openStorefront')}</Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="rounded-2xl"
          disabled={isLoggingOut}
          onClick={() => {
            void (async () => {
              try {
                await logout();
                router.replace(buildAuthNoticeHref('/login', 'logged-out'));
                router.refresh();
              } catch {
                // Store keeps the logout error state.
              }
            })();
          }}
        >
          <LogOutIcon />
          {isLoggingOut ? `${t('logout')}...` : t('logout')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function AdminNav({
  collapsed = false,
  mobile = false,
  onAction,
  unreadCount = 0,
}: AdminNavProps) {
  const pathname = usePathname();
  const t = useTranslations('adminShell');

  return (
    <nav className={cn('flex flex-col gap-2', mobile && 'gap-3')}>
      {adminNavItems.map((item) => {
        const isActive =
          item.href === '/admin'
            ? pathname === item.href
            : pathname === item.href || pathname.startsWith(`${item.href}/`);
        const Icon = item.icon;

        if (item.disabled) {
          return (
            <div
              key={item.href}
              title={t(`nav.${item.labelKey}`)}
              className={cn(
                'flex items-center rounded-[1.35rem] border border-border/60 bg-background/52 text-sm text-muted-foreground',
                collapsed && !mobile
                  ? 'justify-center px-0 py-3'
                  : 'justify-between px-4 py-3',
              )}
            >
              <span className="flex items-center gap-3">
                <Icon className="size-4" />
                {collapsed && !mobile ? null : t(`nav.${item.labelKey}`)}
              </span>
              {collapsed && !mobile ? null : (
                <span className="rounded-full bg-secondary px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-secondary-foreground">
                  {t('soon')}
                </span>
              )}
            </div>
          );
        }

        return (
          <Link
            key={item.href}
            href={item.href}
            title={t(`nav.${item.labelKey}`)}
            onClick={onAction}
            className={cn(
              'flex items-center rounded-[1.35rem] text-sm font-medium transition',
              collapsed && !mobile
                ? 'justify-center px-0 py-3'
                : 'gap-3 px-4 py-3',
              isActive
                ? 'bg-[linear-gradient(180deg,rgba(185,111,90,0.22)_0%,rgba(185,111,90,0.12)_100%)] text-foreground shadow-[0_16px_32px_rgba(185,111,90,0.12)] ring-1 ring-[#d6b4a8]'
                : 'text-muted-foreground hover:bg-background/76 hover:text-foreground',
            )}
          >
            <span className="relative inline-flex">
              <Icon className="size-4" />
              {item.href === '/admin/orders' && unreadCount > 0 ? (
                <span
                  className={cn(
                    'absolute flex min-w-4 items-center justify-center rounded-full bg-[#b96f5a] px-1 text-[0.58rem] font-semibold leading-4 text-white',
                    collapsed && !mobile
                      ? '-top-1.5 -right-2'
                      : '-top-2 -right-2.5',
                  )}
                >
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              ) : null}
            </span>
            {collapsed && !mobile ? null : (
              <>
                <span className="truncate">{t(`nav.${item.labelKey}`)}</span>
                {item.href === '/admin/orders' && unreadCount > 0 ? (
                  <span className="ml-auto rounded-full bg-[#b96f5a]/16 px-2 py-0.5 text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-[#f3d8cc]">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                ) : null}
              </>
            )}
          </Link>
        );
      })}
    </nav>
  );
}

function getPageMeta(pathname: string, locale: AppLocale) {
  if (
    pathname === '/admin/products' ||
    pathname.startsWith('/admin/products/')
  ) {
    return locale === 'th'
      ? {
          title: 'Products',
          subtitle:
            'จัดการรายการสินค้า ราคา สต็อก การเผยแพร่ และรูปภาพในพื้นที่เดียว',
          searchPlaceholder: 'ค้นหาสินค้าด้วยชื่อ SKU หรือ slug',
          searchRoute: '/admin/products',
        }
      : {
          title: 'Products',
          subtitle:
            'Manage catalog entries, pricing, stock, publishing, and media in one place.',
          searchPlaceholder: 'Search products by name, SKU, or slug',
          searchRoute: '/admin/products',
        };
  }

  if (pathname === '/admin/orders' || pathname.startsWith('/admin/orders/')) {
    return locale === 'th'
      ? {
          title: 'Orders',
          subtitle: 'ตรวจสอบออเดอร์ การชำระเงิน และงานที่ต้องติดตาม',
        }
      : {
          title: 'Orders',
          subtitle:
            'Review payments, order flow, and follow-up work in one place.',
        };
  }

  if (
    pathname === '/admin/customers' ||
    pathname.startsWith('/admin/customers/')
  ) {
    return locale === 'th'
      ? {
          title: 'Customers',
          subtitle:
            'ดูแลโปรไฟล์ลูกค้า ออเดอร์ล่าสุด และข้อมูลช่วยเหลือจากพื้นที่เดียว',
        }
      : {
          title: 'Customers',
          subtitle:
            'Review customer profiles, recent orders, and support data in one place.',
        };
  }

  return locale === 'th'
    ? {
        title: 'Overview',
        subtitle: 'ภาพรวมการทำงานของร้านและคำขอที่ต้องตัดสินใจวันนี้',
      }
    : {
        title: 'Overview',
        subtitle:
          'Operations overview across orders, stock movement, and reviews.',
      };
}

function AdminChrome({ children }: AdminShellProps) {
  const locale = useLocale() as AppLocale;
  const pathname = usePathname();
  const t = useTranslations('adminShell');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    if (typeof window === 'undefined') {
      return false;
    }

    return window.localStorage.getItem('facee-admin-sidebar') === 'collapsed';
  });
  const unreadCount = useNotificationsStore((state) => state.unreadCount);
  const pageMeta = getPageMeta(pathname, locale);

  function toggleSidebar() {
    setIsSidebarCollapsed((current) => {
      const nextValue = !current;
      window.localStorage.setItem(
        'facee-admin-sidebar',
        nextValue ? 'collapsed' : 'expanded',
      );
      return nextValue;
    });
  }

  return (
    <div className="relative h-dvh overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(113,72,55,0.18),transparent_22%),radial-gradient(circle_at_bottom_right,rgba(90,56,44,0.2),transparent_28%),linear-gradient(180deg,#1a1412_0%,#140f0d_100%)] text-foreground">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.04),transparent_38%)]" />
      <div className="relative flex h-full w-full gap-4 px-3 py-3 sm:px-3 lg:gap-3 lg:px-3 lg:py-3">
        <aside
          className={cn(
            'hidden h-full shrink-0 flex-col rounded-[2rem] border border-border/70 bg-[rgba(27,19,17,0.94)] p-4 shadow-[0_28px_90px_rgba(0,0,0,0.26)] backdrop-blur-xl lg:flex',
            isSidebarCollapsed ? 'w-22' : 'w-66',
          )}
        >
          <div
            className={cn(
              'rounded-[1.7rem] border border-border/70 bg-background/60',
              isSidebarCollapsed ? 'p-3' : 'p-5',
            )}
          >
            <div
              className={cn(
                'flex items-start',
                isSidebarCollapsed ? 'justify-center' : 'justify-between gap-3',
              )}
            >
              {isSidebarCollapsed ? (
                <span className="block h-8 w-8" aria-hidden="true" />
              ) : (
                <div className="space-y-2">
                  <p className="font-serif text-[3rem] leading-none tracking-[0.01em] text-[#f5e4da]">
                    facee
                  </p>
                  <p className="text-[0.72rem] font-medium uppercase tracking-[0.3em] text-muted-foreground">
                    {locale === 'th' ? 'Admin workspace' : 'Admin workspace'}
                  </p>
                </div>
              )}

              <Button
                type="button"
                variant="outline"
                size="icon"
                className="rounded-full"
                aria-label={
                  isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'
                }
                onClick={toggleSidebar}
              >
                {isSidebarCollapsed ? (
                  <PanelLeftOpenIcon />
                ) : (
                  <PanelLeftCloseIcon />
                )}
              </Button>
            </div>
          </div>

          <div className="mt-4 flex-1">
            <AdminNav
              collapsed={isSidebarCollapsed}
              unreadCount={unreadCount}
            />
          </div>

          {isSidebarCollapsed ? (
            <div className="flex flex-col items-center gap-2">
              <Button
                asChild
                variant="outline"
                size="icon"
                className="rounded-full"
              >
                <Link href="/products">
                  <StoreIcon />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="icon"
                className="rounded-full"
              >
                <Link href="/admin">
                  <LayoutDashboardIcon />
                </Link>
              </Button>
            </div>
          ) : (
            <div className="rounded-[1.7rem] border border-border/60 bg-background/60 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {locale === 'th' ? 'หน้าร้านหลัก' : 'Storefront'}
                  </p>
                  <p className="text-xs leading-5 text-muted-foreground">
                    {locale === 'th'
                      ? 'กลับไปดูสินค้าและหน้าร้าน'
                      : 'Open products and storefront pages.'}
                  </p>
                </div>
                <Button
                  asChild
                  variant="outline"
                  size="icon"
                  className="rounded-full"
                >
                  <Link href="/products">
                    <StoreIcon />
                  </Link>
                </Button>
              </div>
              <div className="mt-4">
                <LocaleSwitcher />
              </div>
            </div>
          )}
        </aside>

        <div className="flex min-w-0 flex-1 flex-col gap-4 overflow-y-auto pr-1">
          <header className="rounded-[2rem] border border-border/70 bg-[rgba(27,19,17,0.94)] px-4 py-4 shadow-[0_28px_90px_rgba(0,0,0,0.26)] backdrop-blur-xl sm:px-5">
            <div className="flex flex-wrap items-center gap-3 xl:flex-nowrap">
              <div className="flex items-center gap-3 lg:hidden">
                <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
                  <SheetTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      className="rounded-full"
                    >
                      <MenuIcon />
                    </Button>
                  </SheetTrigger>
                  <SheetContent
                    side="left"
                    className="w-[88vw] max-w-sm rounded-r-[2rem] border-r border-border/80 bg-background/96 px-4 py-4"
                  >
                    <SheetTitle className="sr-only">{t('menu')}</SheetTitle>
                    <SheetDescription className="sr-only">
                      {t('menuDescription')}
                    </SheetDescription>
                    <div className="flex h-full flex-col gap-5">
                      <div className="rounded-[1.6rem] border border-border/60 bg-card/70 px-4 py-4">
                        <p className="font-serif text-[2.5rem] leading-none tracking-[0.01em] text-[#f5e4da]">
                          facee
                        </p>
                        <p className="mt-2 text-[0.72rem] font-medium uppercase tracking-[0.3em] text-muted-foreground">
                          Admin workspace
                        </p>
                      </div>
                      <AdminNav
                        mobile
                        unreadCount={unreadCount}
                        onAction={() => setMobileNavOpen(false)}
                      />
                      <div className="mt-auto rounded-[1.6rem] border border-border/60 bg-card/70 p-4">
                        <LocaleSwitcher
                          onAction={() => setMobileNavOpen(false)}
                        />
                      </div>
                    </div>
                  </SheetContent>
                </Sheet>
                <p className="font-serif text-[2.25rem] leading-none tracking-[0.01em] text-[#f5e4da]">
                  facee
                </p>
              </div>

              <div className="min-w-0 flex-1 xl:max-w-92">
                <h1 className="truncate font-serif text-[2.35rem] leading-none tracking-[0.01em] text-[#fbf1eb]">
                  {pageMeta.title}
                </h1>
              </div>

              <div className="ml-auto flex items-center gap-2">
                <NotificationsMenu audience="admin" />
                <AdminLocalePill />
                <AdminAccountMenu />
              </div>
            </div>
          </header>

          <div className="min-h-0 flex-1">{children}</div>
        </div>
      </div>
    </div>
  );
}

export function AdminShell({ children }: AdminShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const user = useAuthStore((state) => state.user);
  const isInitialized = useAuthStore((state) => state.isInitialized);
  const isRestoringProfile = useAuthStore((state) => state.isRestoringProfile);

  useEffect(() => {
    if (!isInitialized || isRestoringProfile) {
      return;
    }

    if (!user) {
      const returnTo = buildReturnTo(pathname, searchParams);
      router.replace(buildAuthNoticeHref('/login', 'auth-required', returnTo));
      return;
    }

    if (user.role !== 'ADMIN') {
      router.replace(buildAuthNoticeHref('/login', 'access-denied'));
    }
  }, [isInitialized, isRestoringProfile, pathname, router, searchParams, user]);

  if (!isInitialized || isRestoringProfile) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-[linear-gradient(180deg,#191311_0%,#17110f_100%)] px-4 py-12">
        <div className="rounded-[2rem] border border-border/70 bg-background/84 px-8 py-8 text-center shadow-[0_24px_80px_rgba(0,0,0,0.22)] backdrop-blur-xl">
          <p className="text-sm font-medium text-muted-foreground">
            Loading admin workspace...
          </p>
        </div>
      </main>
    );
  }

  if (!user || user.role !== 'ADMIN') {
    return null;
  }

  return <AdminChrome>{children}</AdminChrome>;
}

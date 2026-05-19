'use client';

import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { buildReturnTo } from '@/features/auth/auth-routing';
import { Link, usePathname, useRouter } from '@/i18n/navigation';
import { useAuthStore } from '@/store/use-auth-store';

type AuthActionsProps = {
  onAction?: () => void;
  stacked?: boolean;
  menu?: boolean;
};

export function AuthActions({
  onAction,
  stacked = false,
  menu = false,
}: AuthActionsProps) {
  const t = useTranslations('topbar');
  const user = useAuthStore((state) => state.user);
  const isLoggingOut = useAuthStore((state) => state.isLoggingOut);
  const logout = useAuthStore((state) => state.logout);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const returnTo = buildReturnTo(pathname, searchParams);
  const loginHref = returnTo
    ? `/login?returnTo=${encodeURIComponent(returnTo)}`
    : '/login';
  const registerHref = returnTo
    ? `/register?returnTo=${encodeURIComponent(returnTo)}`
    : '/register';

  if (user) {
    const showInlineLogout = stacked || menu;
    const isAdmin = user.role === 'ADMIN';

    return (
      <div
        className={
          menu
            ? 'flex w-full flex-col items-center gap-2'
            : stacked
              ? 'flex w-full flex-col items-center gap-2 md:hidden'
              : 'hidden items-center gap-2 md:flex'
        }
      >
        <div
          className={
            stacked || menu
              ? 'w-full truncate rounded-xl bg-muted px-3 py-2 text-center text-sm font-medium text-foreground'
              : 'max-w-40 truncate text-sm font-medium text-foreground'
          }
        >
          {user.fullName || user.email}
        </div>
        {showInlineLogout ? (
          <>
            {isAdmin ? (
              <Button
                asChild
                variant="ghost"
                className={
                  stacked || menu
                    ? 'w-full justify-center text-foreground'
                    : undefined
                }
              >
                <Link href="/admin" prefetch={false} onClick={onAction}>
                  {t('adminPortal')}
                </Link>
              </Button>
            ) : null}
            <Button
              asChild
              variant="ghost"
              className={
                stacked || menu
                  ? 'w-full justify-center text-foreground'
                  : undefined
              }
            >
              <Link href="/profile" prefetch={false} onClick={onAction}>
                {t('profile')}
              </Link>
            </Button>
            <Button
              asChild
              variant="ghost"
              className={
                stacked || menu
                  ? 'w-full justify-center text-foreground'
                  : undefined
              }
            >
              <Link href="/orders" prefetch={false} onClick={onAction}>
                {t('myPurchases')}
              </Link>
            </Button>
          </>
        ) : null}
        {showInlineLogout ? (
          <Button
            type="button"
            variant="outline"
            disabled={isLoggingOut}
            className={stacked || menu ? 'w-full justify-center' : undefined}
            onClick={() => {
              void (async () => {
                try {
                  await logout();
                  onAction?.();
                  router.replace('/products');
                  router.refresh();
                } catch {
                  // Logout errors stay in the store for future handling.
                }
              })();
            }}
          >
            {isLoggingOut ? `${t('logout')}...` : t('logout')}
          </Button>
        ) : null}
      </div>
    );
  }

  return (
    <div
      className={
        menu
          ? 'flex w-full flex-col items-center gap-2'
          : stacked
            ? 'flex w-full flex-col items-center gap-2 md:hidden'
            : 'hidden items-center gap-2 md:flex'
      }
    >
      <Button
        asChild
        variant="ghost"
        className={
          stacked || menu
            ? 'w-full justify-center text-foreground'
            : 'text-foreground'
        }
      >
        <Link
          href={loginHref}
          prefetch={false}
          onClick={() => {
            onAction?.();
          }}
        >
          {t('login')}
        </Link>
      </Button>
      <Button
        asChild
        variant="outline"
        className={stacked || menu ? 'w-full justify-center' : undefined}
      >
        <Link
          href={registerHref}
          prefetch={false}
          onClick={() => {
            onAction?.();
          }}
        >
          {t('register')}
        </Link>
      </Button>
    </div>
  );
}

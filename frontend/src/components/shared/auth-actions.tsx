'use client';

import { useTranslations } from 'next-intl';
import { Link, useRouter } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
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

  if (user) {
    const showInlineLogout = stacked || menu;

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
                  router.replace('/login?loggedOut=1');
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
          href="/login"
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
          href="/register"
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

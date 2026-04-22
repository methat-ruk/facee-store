'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';

type AuthActionsProps = {
  stacked?: boolean;
  menu?: boolean;
};

export function AuthActions({
  stacked = false,
  menu = false,
}: AuthActionsProps) {
  const t = useTranslations('topbar');

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
        <Link href="/login">{t('login')}</Link>
      </Button>
      <Button
        asChild
        variant="outline"
        className={stacked || menu ? 'w-full justify-center' : undefined}
      >
        <Link href="/register">{t('register')}</Link>
      </Button>
    </div>
  );
}

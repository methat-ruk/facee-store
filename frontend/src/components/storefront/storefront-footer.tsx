'use client';

import { useTranslations } from 'next-intl';
import { BrandWordmark } from '@/components/brand-wordmark';
import { Separator } from '@/components/ui/separator';
import { Link } from '@/i18n/navigation';
import { storefrontNavItems } from './storefront-nav';

export function StorefrontFooter() {
  const t = useTranslations('footer');
  const topbarT = useTranslations('topbar');
  const year = new Date().getFullYear();

  return (
    <footer className="relative z-0 mt-10 border-t border-border/80 bg-[linear-gradient(180deg,rgba(255,248,243,0.95)_0%,rgba(246,230,219,0.96)_100%)] dark:bg-[linear-gradient(180deg,rgba(34,24,20,0.96)_0%,rgba(28,20,17,0.98)_100%)]">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-4 py-12 sm:px-6 lg:px-8 lg:py-14">
        <div className="grid gap-10 lg:grid-cols-[1.15fr_0.8fr_1fr_1fr]">
          <div className="space-y-5">
            <BrandWordmark />
            <p className="max-w-sm text-sm leading-7 text-muted-foreground">
              {t('description')}
            </p>
          </div>

          <div className="space-y-4">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-muted-foreground">
              {t('navigate')}
            </p>
            <nav className="flex flex-col gap-3 text-sm text-foreground">
              {storefrontNavItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="hover:text-primary"
                >
                  {topbarT(item.labelKey)}
                </Link>
              ))}
              <Link href="/login" className="hover:text-primary">
                {topbarT('login')}
              </Link>
              <Link href="/register" className="hover:text-primary">
                {topbarT('register')}
              </Link>
            </nav>
          </div>

          <div className="space-y-4">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-muted-foreground">
              {t('notes')}
            </p>
            <ul className="flex flex-col gap-3 text-sm leading-7 text-muted-foreground">
              <li>{t('note1')}</li>
              <li>{t('note2')}</li>
              <li>{t('note3')}</li>
            </ul>
          </div>

          <div className="space-y-4">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-muted-foreground">
              {t('contact')}
            </p>
            <ul className="flex flex-col gap-3 text-sm leading-7 text-muted-foreground">
              <li>{t('contact1')}</li>
              <li>{t('contact2')}</li>
              <li>{t('contact3')}</li>
            </ul>
          </div>
        </div>

        <Separator />

        <div className="flex flex-col gap-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>{t('copyright', { year })}</p>
          <p>{t('availableLanguages')}</p>
        </div>
      </div>
    </footer>
  );
}

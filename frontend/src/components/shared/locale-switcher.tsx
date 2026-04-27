'use client';

import { startTransition } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { usePathname, useRouter } from '@/i18n/navigation';
import type { AppLocale } from '@/i18n/routing';
import { Switch } from '@/components/ui/switch';

type LocaleSwitcherProps = {
  onAction?: () => void;
};

export function LocaleSwitcher({ onAction }: LocaleSwitcherProps) {
  const locale = useLocale() as AppLocale;
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations('topbar');
  const isThai = locale === 'th';

  function handleLocaleChange(nextLocale: AppLocale) {
    if (!nextLocale || nextLocale === locale) {
      return;
    }

    const query = searchParams.toString();
    const href = query ? `${pathname}?${query}` : pathname;

    startTransition(() => {
      router.replace(href, {
        locale: nextLocale as AppLocale,
      });
    });

    onAction?.();
  }

  return (
    <label className="grid w-full grid-cols-[2rem_minmax(0,1fr)_2.5rem_2rem] items-center gap-x-3 text-xs font-medium text-muted-foreground">
      <span className="justify-self-center text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-foreground/60">
        EN
      </span>
      <span className="min-w-0 text-xs font-medium text-muted-foreground">
        {t('language')}
      </span>
      <Switch
        checked={isThai}
        onCheckedChange={(checked) => handleLocaleChange(checked ? 'th' : 'en')}
        aria-label={isThai ? t('languageThai') : t('languageEnglish')}
        className="justify-self-end"
      />
      <span className="justify-self-center text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-foreground/60">
        TH
      </span>
    </label>
  );
}

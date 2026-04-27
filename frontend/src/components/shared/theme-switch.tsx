'use client';

import { MoonIcon, SunIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useTheme } from '@/components/providers/theme-provider';
import { useHydrated } from '@/hooks/use-hydrated';
import { Switch } from '@/components/ui/switch';

type ThemeSwitchProps = {
  onAction?: () => void;
};

export function ThemeSwitch({ onAction }: ThemeSwitchProps) {
  const t = useTranslations('topbar');
  const { resolvedTheme, setTheme } = useTheme();
  const isHydrated = useHydrated();

  const isDark = isHydrated && resolvedTheme === 'dark';

  return (
    <label className="grid w-full grid-cols-[2rem_minmax(0,1fr)_2.5rem_2rem] items-center gap-x-3 text-xs font-medium text-muted-foreground">
      <SunIcon className="size-3.5 justify-self-center" />
      <span className="min-w-0">{t('theme')}</span>
      <Switch
        checked={isDark}
        onCheckedChange={(checked) => {
          setTheme(checked ? 'dark' : 'light');
          onAction?.();
        }}
        aria-label={isDark ? t('themeDark') : t('themeLight')}
        disabled={!isHydrated}
        className="justify-self-end"
      />
      <MoonIcon className="size-3.5 justify-self-center" />
    </label>
  );
}

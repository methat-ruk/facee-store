'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { BrandWordmark } from '@/components/brand-wordmark';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Link, usePathname, useRouter } from '@/i18n/navigation';
import {
  getAuthFieldErrors,
  getAuthFormMessageKey,
  type AuthFieldErrors,
  type AuthMessageKey,
} from '@/features/auth/auth-error-messages';
import { isApiError } from '@/services/api-error';
import { useAuthStore } from '@/store/use-auth-store';

type AuthFormCardProps = {
  mode: 'login' | 'register';
};

type AuthFormState = {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
};

const initialFormState: AuthFormState = {
  fullName: '',
  email: '',
  password: '',
  confirmPassword: '',
};

export function AuthFormCard({ mode }: AuthFormCardProps) {
  const t = useTranslations('auth');
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isRegister = mode === 'register';
  const loggedOut = searchParams.get('loggedOut') === '1';
  const login = useAuthStore((state) => state.login);
  const register = useAuthStore((state) => state.register);
  const isLoggingIn = useAuthStore((state) => state.isLoggingIn);
  const isRegistering = useAuthStore((state) => state.isRegistering);
  const clearError = useAuthStore((state) => state.clearError);
  const [formState, setFormState] = useState(initialFormState);
  const [fieldErrors, setFieldErrors] = useState<AuthFieldErrors>({});
  const [formErrorKey, setFormErrorKey] = useState<AuthMessageKey | null>(null);
  const isSubmitting = isRegister ? isRegistering : isLoggingIn;

  useEffect(() => {
    let isCancelled = false;

    window.queueMicrotask(() => {
      if (!isCancelled) {
        setFieldErrors({});
        setFormErrorKey(null);
        clearError();
      }
    });

    return () => {
      isCancelled = true;
    };
  }, [clearError, locale, mode, pathname]);

  useEffect(() => {
    if (!loggedOut) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      router.replace(pathname);
    }, 3000);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [loggedOut, pathname, router]);

  const validateForm = (): AuthFieldErrors => {
    const nextErrors: AuthFieldErrors = {};

    if (isRegister && !formState.fullName.trim()) {
      nextErrors.fullName = 'errorNameRequired';
    }

    if (!formState.email.trim()) {
      nextErrors.email = 'errorEmailRequired';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formState.email.trim())) {
      nextErrors.email = 'errorEmailInvalid';
    }

    if (!formState.password) {
      nextErrors.password = 'errorPasswordRequired';
    } else if (formState.password.length < 8) {
      nextErrors.password = 'passwordTooShort';
    }

    if (isRegister) {
      if (!formState.confirmPassword) {
        nextErrors.confirmPassword = 'errorConfirmPasswordRequired';
      } else if (formState.password !== formState.confirmPassword) {
        nextErrors.confirmPassword = 'passwordMismatch';
      }
    }

    return nextErrors;
  };

  const updateField = (field: keyof AuthFormState, value: string) => {
    setFormState((current) => ({
      ...current,
      [field]: value,
    }));
    setFieldErrors((current) => {
      if (!current[field]) {
        return current;
      }

      const nextErrors = { ...current };
      delete nextErrors[field];

      return nextErrors;
    });
    setFormErrorKey(null);
    clearError();
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextFieldErrors = validateForm();

    setFieldErrors(nextFieldErrors);
    setFormErrorKey(null);

    if (Object.keys(nextFieldErrors).length > 0) {
      return;
    }

    try {
      if (isRegister) {
        await register({
          fullName: formState.fullName,
          email: formState.email,
          password: formState.password,
          confirmPassword: formState.confirmPassword,
        });
      } else {
        await login({
          email: formState.email,
          password: formState.password,
        });
      }

      router.push('/products');
    } catch (error) {
      if (isApiError(error)) {
        const nextFieldErrors = getAuthFieldErrors(error);
        const nextFormErrorKey =
          Object.keys(nextFieldErrors).length > 0
            ? null
            : getAuthFormMessageKey(mode, error.code);

        setFieldErrors(nextFieldErrors);
        setFormErrorKey(nextFormErrorKey);
        return;
      }

      setFieldErrors({});
      setFormErrorKey(getAuthFormMessageKey(mode, 'INTERNAL_SERVER_ERROR'));
    }
  };

  return (
    <main className="mx-auto flex min-h-[calc(100svh-16rem)] w-full max-w-7xl items-center justify-center px-4 py-10 sm:px-6">
      <div className="grid w-full max-w-5xl gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="relative hidden overflow-hidden rounded-[2rem] border border-border/70 bg-[linear-gradient(180deg,rgba(255,247,242,0.98)_0%,rgba(246,230,219,0.92)_100%)] p-8 shadow-[0_30px_80px_rgba(132,83,60,0.1)] lg:flex lg:min-h-152 lg:flex-col lg:justify-between dark:bg-[linear-gradient(180deg,rgba(41,29,24,0.98)_0%,rgba(33,24,20,0.96)_100%)]">
          <div className="absolute inset-x-8 top-0 h-40 rounded-b-[3rem] bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.95)_0%,rgba(255,255,255,0)_72%)]" />
          <div className="relative z-10 space-y-5">
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
              {t('brandEyebrow')}
            </p>
            <BrandWordmark className="scale-[1.05] origin-left" />
            <div className="space-y-3">
              <h2 className="max-w-sm text-4xl font-semibold tracking-tight text-foreground">
                {t('brandTitle')}
              </h2>
              <p className="max-w-md text-base leading-8 text-muted-foreground">
                {t('brandDescription')}
              </p>
            </div>
          </div>

          <div className="relative z-10 grid gap-3">
            <div className="rounded-[1.4rem] border border-border/70 bg-background/70 px-5 py-4 backdrop-blur-sm">
              <p className="text-sm font-medium text-foreground">
                {t('brandDetail1Title')}
              </p>
              <p className="mt-1 text-sm leading-7 text-muted-foreground">
                {t('brandDetail1Body')}
              </p>
            </div>
            <div className="rounded-[1.4rem] border border-border/70 bg-background/70 px-5 py-4 backdrop-blur-sm">
              <p className="text-sm font-medium text-foreground">
                {t('brandDetail2Title')}
              </p>
              <p className="mt-1 text-sm leading-7 text-muted-foreground">
                {t('brandDetail2Body')}
              </p>
            </div>
            <div className="rounded-[1.4rem] border border-border/70 bg-background/70 px-5 py-4 backdrop-blur-sm">
              <p className="text-sm font-medium text-foreground">
                {t('brandDetail3Title')}
              </p>
              <p className="mt-1 text-sm leading-7 text-muted-foreground">
                {t('brandDetail3Body')}
              </p>
            </div>
          </div>
        </section>

        <Card className="w-full border-border/80 bg-card/95 shadow-[0_24px_70px_rgba(132,83,60,0.08)]">
          <CardHeader className="gap-4">
            <div className="space-y-4">
              <div className="lg:hidden">
                <BrandWordmark />
              </div>
              <div className="space-y-2">
                <p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                  {isRegister ? t('registerEyebrow') : t('loginEyebrow')}
                </p>
                <CardTitle>
                  {isRegister ? t('registerTitle') : t('loginTitle')}
                </CardTitle>
                <CardDescription>
                  {isRegister
                    ? t('registerDescription')
                    : t('loginDescription')}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
              {isRegister ? (
                <div className="flex flex-col gap-2">
                  <Label htmlFor="name">{t('name')}</Label>
                  <Input
                    id="name"
                    autoComplete="name"
                    aria-invalid={Boolean(fieldErrors.fullName)}
                    value={formState.fullName}
                    placeholder={t('namePlaceholder')}
                    onChange={(event) =>
                      updateField('fullName', event.target.value)
                    }
                  />
                  {fieldErrors.fullName ? (
                    <p className="text-sm leading-6 text-destructive">
                      {t(fieldErrors.fullName)}
                    </p>
                  ) : null}
                </div>
              ) : null}

              <div className="flex flex-col gap-2">
                <Label htmlFor="email">{t('email')}</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  aria-invalid={Boolean(fieldErrors.email)}
                  value={formState.email}
                  placeholder={t('emailPlaceholder')}
                  onChange={(event) => updateField('email', event.target.value)}
                />
                {fieldErrors.email ? (
                  <p className="text-sm leading-6 text-destructive">
                    {t(fieldErrors.email)}
                  </p>
                ) : null}
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="password">{t('password')}</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete={
                    isRegister ? 'new-password' : 'current-password'
                  }
                  aria-invalid={Boolean(fieldErrors.password)}
                  value={formState.password}
                  placeholder={t('passwordPlaceholder')}
                  onChange={(event) =>
                    updateField('password', event.target.value)
                  }
                />
                {fieldErrors.password ? (
                  <p className="text-sm leading-6 text-destructive">
                    {t(fieldErrors.password)}
                  </p>
                ) : null}
              </div>

              {isRegister ? (
                <div className="flex flex-col gap-2">
                  <Label htmlFor="confirm-password">
                    {t('confirmPassword')}
                  </Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    autoComplete="new-password"
                    aria-invalid={Boolean(fieldErrors.confirmPassword)}
                    value={formState.confirmPassword}
                    placeholder={t('passwordPlaceholder')}
                    onChange={(event) =>
                      updateField('confirmPassword', event.target.value)
                    }
                  />
                  {fieldErrors.confirmPassword ? (
                    <p className="text-sm leading-6 text-destructive">
                      {t(fieldErrors.confirmPassword)}
                    </p>
                  ) : null}
                </div>
              ) : null}

              {loggedOut ? (
                <p className="rounded-2xl border border-primary/30 bg-primary/10 px-4 py-3 text-sm leading-6 text-foreground">
                  {t('loggedOutNotice')}
                </p>
              ) : null}

              {formErrorKey ? (
                <p className="rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm leading-6 text-destructive">
                  {t(formErrorKey)}
                </p>
              ) : null}

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full transition duration-200 hover:bg-primary/90"
              >
                {isSubmitting
                  ? t('submitting')
                  : isRegister
                    ? t('registerSubmit')
                    : t('loginSubmit')}
              </Button>

              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <span>
                  {isRegister ? t('registerHelper') : t('loginHelper')}
                </span>
                <Link
                  href={isRegister ? '/login' : '/register'}
                  className="inline-flex cursor-pointer items-center border-b border-current pb-0.5 font-medium leading-none text-foreground transition-colors hover:text-[#8c5a46]"
                >
                  {isRegister ? t('goToLogin') : t('goToRegister')}
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

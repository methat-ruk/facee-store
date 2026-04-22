import { getTranslations } from 'next-intl/server';
import { BrandWordmark } from '@/components/brand-wordmark';
import { Link } from '@/i18n/navigation';
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

type AuthFormCardProps = {
  mode: 'login' | 'register';
};

export async function AuthFormCard({ mode }: AuthFormCardProps) {
  const t = await getTranslations('auth');
  const isRegister = mode === 'register';

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
          <CardContent className="flex flex-col gap-5">
            {isRegister ? (
              <div className="flex flex-col gap-2">
                <Label htmlFor="name">{t('name')}</Label>
                <Input id="name" placeholder={t('name')} />
              </div>
            ) : null}

            <div className="flex flex-col gap-2">
              <Label htmlFor="email">{t('email')}</Label>
              <Input id="email" type="email" placeholder={t('email')} />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="password">{t('password')}</Label>
              <Input
                id="password"
                type="password"
                placeholder={t('password')}
              />
            </div>

            {isRegister ? (
              <div className="flex flex-col gap-2">
                <Label htmlFor="confirm-password">{t('confirmPassword')}</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder={t('confirmPassword')}
                />
              </div>
            ) : null}

            <Button className="w-full transition duration-200 hover:bg-primary/90">
              {isRegister ? t('registerSubmit') : t('loginSubmit')}
            </Button>

            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <span>{isRegister ? t('registerHelper') : t('loginHelper')}</span>
              <Link
                href={isRegister ? '/login' : '/register'}
                className="inline-flex cursor-pointer items-center border-b border-current pb-0.5 font-medium leading-none text-foreground transition-colors hover:text-[#8c5a46]"
              >
                {isRegister ? t('goToLogin') : t('goToRegister')}
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

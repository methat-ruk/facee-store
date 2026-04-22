import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { hasLocale } from 'next-intl';
import { routing } from '@/i18n/routing';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'Facee',
    template: '%s | Facee',
  },
  description:
    'Facee is a skincare commerce portfolio project built with Next.js, NestJS, Zod, Axios, Zustand, Prisma, shadcn/ui, and next-intl.',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const requestedLocale = (await headers()).get('x-next-intl-locale');
  const locale = hasLocale(routing.locales, requestedLocale)
    ? requestedLocale
    : routing.defaultLocale;

  return (
    <html
      lang={locale}
      className="h-full antialiased"
      suppressHydrationWarning
      data-scroll-behavior="smooth"
    >
      <body className="min-h-full bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}

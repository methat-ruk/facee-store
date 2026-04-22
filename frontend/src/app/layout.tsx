import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'Facee',
    template: '%s | Facee',
  },
  description:
    'Facee is a skincare commerce portfolio project built with Next.js, NestJS, Zod, Axios, Zustand, and Prisma.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}

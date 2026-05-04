import { redirect } from 'next/navigation';

export default async function LocaleIndexPage({
  params,
}: Readonly<{
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;

  redirect(`/${locale}/products`);
}

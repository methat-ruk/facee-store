import axios from 'axios';
import { ArrowLeftIcon } from 'lucide-react';
import { getLocale, getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { Link } from '@/i18n/navigation';
import { ProductAvailabilityBadge } from '@/components/shared/product-availability-badge';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { getProductDetail } from '@/services/catalog';
import { getLocalizedProduct } from './localized-content';
import { ProductCard } from './product-card';
import { ProductDetailGallery } from './product-detail-gallery';
import { ProductDetailTabs } from './product-detail-tabs';
import { ProductPurchasePanel } from './product-purchase-panel';

type ProductDetailPageProps = {
  slug: string;
};

export async function ProductDetailPage({ slug }: ProductDetailPageProps) {
  const locale = await getLocale();
  const t = await getTranslations('products');
  let detailResponse;

  try {
    detailResponse = await getProductDetail(slug);
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      notFound();
    }

    throw error;
  }

  const { product, relatedProducts } = detailResponse;
  const localizedProduct = getLocalizedProduct(product, locale);

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-12">
      <div className="flex items-center">
        <Link
          href="/products"
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeftIcon className="size-4" />
          {t('backToCatalog')}
        </Link>
      </div>

      <section className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
        <ProductDetailGallery
          name={localizedProduct.name}
          imageUrl={localizedProduct.imageUrl}
          galleryImages={localizedProduct.galleryImages}
        />

        <div className="flex flex-col gap-8 lg:sticky lg:top-28">
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant="outline" className="h-7 px-3 text-sm">
                {localizedProduct.category.name}
              </Badge>
              <ProductAvailabilityBadge stock={localizedProduct.stock} />
            </div>

            <div className="space-y-4">
              <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
                {localizedProduct.name}
              </h1>
              {localizedProduct.subtitle ? (
                <p className="max-w-2xl text-lg leading-8 text-foreground/85">
                  {localizedProduct.subtitle}
                </p>
              ) : null}
              <p className="max-w-2xl leading-8 text-muted-foreground">
                {localizedProduct.description}
              </p>
            </div>
          </div>

          <ProductPurchasePanel product={localizedProduct} />
        </div>
      </section>

      <Separator />

      <section className="space-y-6">
        <div className="space-y-3">
          <p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            {t('detailSectionEyebrow')}
          </p>
          <h2 className="text-3xl font-semibold tracking-tight text-foreground">
            {t('detailSectionTitle')}
          </h2>
        </div>
        <ProductDetailTabs
          description={localizedProduct.description}
          benefits={localizedProduct.benefits}
          howToUse={localizedProduct.howToUse}
          ingredients={localizedProduct.ingredients}
        />
      </section>

      {relatedProducts.length > 0 ? (
        <section className="space-y-6">
          <div className="space-y-3">
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              {t('relatedEyebrow')}
            </p>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <h2 className="text-3xl font-semibold tracking-tight text-foreground">
                {t('relatedTitle')}
              </h2>
              <p className="max-w-xl text-sm leading-7 text-muted-foreground">
                {t('relatedDescription', {
                  category: localizedProduct.category.name,
                })}
              </p>
            </div>
          </div>
          <div className="grid items-stretch gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {relatedProducts.map((relatedProduct) => (
              <ProductCard key={relatedProduct.id} product={relatedProduct} />
            ))}
          </div>
        </section>
      ) : null}
    </main>
  );
}

import { Suspense } from 'react';
import { CatalogLoading } from '@/features/products/catalog-loading';
import { ProductCatalogPage } from '@/features/products/product-catalog-page';

export default function ProductsPage() {
  return (
    <Suspense fallback={<CatalogLoading />}>
      <ProductCatalogPage />
    </Suspense>
  );
}

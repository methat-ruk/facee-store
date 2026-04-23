import { api } from '@/services/api';
import {
  catalogQuerySchema,
  categoriesResponseSchema,
  ProductDetailResponse,
  productDetailResponseSchema,
  ProductListResponse,
  productListResponseSchema,
  type CatalogQuery,
  type Category,
} from '@/features/products/schemas';
import { apiConfig } from '@/config/api';

export async function getCategories() {
  const response = await api.get('/categories');
  return categoriesResponseSchema.parse(response.data);
}

export async function getProducts(query: Partial<CatalogQuery>) {
  const parsedQuery = catalogQuerySchema.parse(query);
  const response = await api.get(apiConfig.endpoints.storefront.products, {
    params: parsedQuery,
  });

  return productListResponseSchema.parse(response.data);
}

export async function getProductDetail(slug: string) {
  const response = await api.get(
    apiConfig.endpoints.storefront.productDetail(slug),
  );
  return productDetailResponseSchema.parse(response.data);
}

export type {
  ProductListResponse,
  ProductDetailResponse,
  CatalogQuery,
  Category,
};

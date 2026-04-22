import { api } from '@/services/api';
import {
  catalogQuerySchema,
  categoriesResponseSchema,
  ProductListResponse,
  productListResponseSchema,
  type CatalogQuery,
  type Category,
} from '@/features/products/schemas';

export async function getCategories() {
  const response = await api.get('/categories');
  return categoriesResponseSchema.parse(response.data);
}

export async function getProducts(query: Partial<CatalogQuery>) {
  const parsedQuery = catalogQuerySchema.parse(query);
  const response = await api.get('/products', {
    params: parsedQuery,
  });

  return productListResponseSchema.parse(response.data);
}

export type { ProductListResponse, CatalogQuery, Category };

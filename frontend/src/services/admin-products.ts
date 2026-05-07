import { apiConfig } from '@/config/api';
import {
  adminProductCategorySchema,
  adminProductDetailResponseSchema,
  adminProductListResponseSchema,
  adminProductsQuerySchema,
  adminProductUploadResponseSchema,
  adminProductUpsertSchema,
  type AdminProductsQuery,
  type AdminProductUpsertInput,
} from '@/features/admin-products/schemas';
import { api } from '@/services/api';

export async function listAdminProducts(query: Partial<AdminProductsQuery>) {
  const parsedQuery = adminProductsQuerySchema.parse(query);
  const response = await api.get(apiConfig.endpoints.admin.products, {
    params: parsedQuery,
  });

  return adminProductListResponseSchema.parse(response.data);
}

export async function listAdminProductCategories() {
  const response = await api.get(apiConfig.endpoints.admin.productCategories);

  return adminProductCategorySchema.array().parse(response.data);
}

export async function getAdminProductDetail(productId: string) {
  const response = await api.get(
    apiConfig.endpoints.admin.productDetail(productId),
  );

  return adminProductDetailResponseSchema.parse(response.data);
}

export async function createAdminProduct(input: AdminProductUpsertInput) {
  const payload = adminProductUpsertSchema.parse(input);
  const response = await api.post(apiConfig.endpoints.admin.products, payload);

  return adminProductDetailResponseSchema.parse(response.data);
}

export async function updateAdminProduct(
  productId: string,
  input: Partial<AdminProductUpsertInput>,
) {
  const response = await api.patch(
    apiConfig.endpoints.admin.productDetail(productId),
    input,
  );

  return adminProductDetailResponseSchema.parse(response.data);
}

export async function uploadAdminProductImages(files: File[]) {
  const formData = new FormData();

  for (const file of files) {
    formData.append('files', file);
  }

  const response = await api.post(
    apiConfig.endpoints.admin.productUpload,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    },
  );

  return adminProductUploadResponseSchema.parse(response.data);
}

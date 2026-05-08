import { apiConfig } from '@/config/api';
import {
  adminCustomerDetailSchema,
  adminCustomerListSchema,
  adminCustomerQuerySchema,
  type AdminCustomerQuery,
} from '@/features/admin-customers/schemas';
import { api } from '@/services/api';

export async function listAdminCustomers(query: AdminCustomerQuery) {
  const parsedQuery = adminCustomerQuerySchema.parse(query);
  const response = await api.get(apiConfig.endpoints.admin.customers.list, {
    params: parsedQuery,
  });

  return adminCustomerListSchema.parse(response.data);
}

export async function getAdminCustomerDetail(customerId: string) {
  const response = await api.get(
    apiConfig.endpoints.admin.customers.detail(customerId),
  );

  return adminCustomerDetailSchema.parse(response.data);
}

import { apiConfig } from '@/config/api';
import {
  createOrderInputSchema,
  createOrderResponseSchema,
  orderDetailSchema,
  type CreateOrderInput,
} from '@/features/orders/schemas';
import { api } from '@/services/api';

export async function createOrder(input: CreateOrderInput) {
  const parsedInput = createOrderInputSchema.parse(input);
  const response = await api.post(apiConfig.endpoints.orders, parsedInput);

  return createOrderResponseSchema.parse(response.data);
}

export async function getOrderDetail(orderNo: string) {
  const response = await api.get(apiConfig.endpoints.orderDetail(orderNo));

  return orderDetailSchema.parse(response.data);
}

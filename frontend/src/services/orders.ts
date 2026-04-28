import { apiConfig } from '@/config/api';
import {
  createCancellationRequestInputSchema,
  createOrderInputSchema,
  createOrderResponseSchema,
  orderDetailSchema,
  orderListSchema,
  reviewCancellationRequestInputSchema,
  updateRefundStatusInputSchema,
  type CreateCancellationRequestInput,
  type CreateOrderInput,
  type ReviewCancellationRequestInput,
  type UpdateRefundStatusInput,
} from '@/features/orders/schemas';
import { api } from '@/services/api';

export async function listOrders() {
  const response = await api.get(apiConfig.endpoints.orders);

  return orderListSchema.parse(response.data);
}

export async function createOrder(input: CreateOrderInput) {
  const parsedInput = createOrderInputSchema.parse(input);
  const response = await api.post(apiConfig.endpoints.orders, parsedInput);

  return createOrderResponseSchema.parse(response.data);
}

export async function getOrderDetail(orderNo: string) {
  const response = await api.get(apiConfig.endpoints.orderDetail(orderNo));

  return orderDetailSchema.parse(response.data);
}

export async function cancelOrder(orderNo: string) {
  const response = await api.post(apiConfig.endpoints.orderCancel(orderNo));

  return orderDetailSchema.parse(response.data);
}

export async function createCancellationRequest(
  orderNo: string,
  input: CreateCancellationRequestInput,
) {
  const parsedInput = createCancellationRequestInputSchema.parse(input);
  const response = await api.post(
    apiConfig.endpoints.orderCancellationRequests(orderNo),
    parsedInput,
  );

  return orderDetailSchema.parse(response.data);
}

export async function listAdminOrders() {
  const response = await api.get(apiConfig.endpoints.admin.orders);

  return orderListSchema.parse(response.data);
}

export async function getAdminOrderDetail(orderNo: string) {
  const response = await api.get(
    apiConfig.endpoints.admin.orderDetail(orderNo),
  );

  return orderDetailSchema.parse(response.data);
}

export async function reviewCancellationRequest(
  requestId: string,
  input: ReviewCancellationRequestInput,
) {
  const parsedInput = reviewCancellationRequestInputSchema.parse(input);
  const response = await api.post(
    apiConfig.endpoints.admin.cancellationReview(requestId),
    parsedInput,
  );

  return orderDetailSchema.parse(response.data);
}

export async function updateOrderRefundStatus(
  orderNo: string,
  input: UpdateRefundStatusInput,
) {
  const parsedInput = updateRefundStatusInputSchema.parse(input);
  const response = await api.post(
    apiConfig.endpoints.admin.refundStatus(orderNo),
    parsedInput,
  );

  return orderDetailSchema.parse(response.data);
}

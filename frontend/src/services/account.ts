import { apiConfig } from '@/config/api';
import {
  accountProfileSchema,
  addressListSchema,
  addressSchema,
  savedPaymentMethodListSchema,
  savedPaymentMethodSchema,
  type UpdateAccountProfileInput,
  updateAccountProfileInputSchema,
  type UpsertAddressInput,
  upsertAddressInputSchema,
  type UpsertSavedPaymentMethodInput,
  upsertSavedPaymentMethodInputSchema,
} from '@/features/account/schemas';
import { api } from '@/services/api';

export async function getAccountProfile() {
  const response = await api.get(apiConfig.endpoints.account.profile);

  return accountProfileSchema.parse(response.data);
}

export async function updateAccountProfile(input: UpdateAccountProfileInput) {
  const parsedInput = updateAccountProfileInputSchema.parse(input);
  const response = await api.patch(
    apiConfig.endpoints.account.profile,
    parsedInput,
  );

  return accountProfileSchema.parse(response.data);
}

export async function listAddresses() {
  const response = await api.get(apiConfig.endpoints.account.addresses);

  return addressListSchema.parse(response.data);
}

export async function createAddress(input: UpsertAddressInput) {
  const parsedInput = upsertAddressInputSchema.parse(input);
  const response = await api.post(
    apiConfig.endpoints.account.addresses,
    parsedInput,
  );

  return addressSchema.parse(response.data);
}

export async function updateAddress(
  addressId: string,
  input: UpsertAddressInput,
) {
  const parsedInput = upsertAddressInputSchema.parse(input);
  const response = await api.patch(
    apiConfig.endpoints.account.addressDetail(addressId),
    parsedInput,
  );

  return addressSchema.parse(response.data);
}

export async function setDefaultAddress(addressId: string) {
  const response = await api.post(
    apiConfig.endpoints.account.addressDefault(addressId),
  );

  return addressSchema.parse(response.data);
}

export async function deleteAddress(addressId: string) {
  await api.delete(apiConfig.endpoints.account.addressDetail(addressId));
}

export async function listPaymentMethods() {
  const response = await api.get(apiConfig.endpoints.account.paymentMethods);

  return savedPaymentMethodListSchema.parse(response.data);
}

export async function createPaymentMethod(
  input: UpsertSavedPaymentMethodInput,
) {
  const parsedInput = upsertSavedPaymentMethodInputSchema.parse(input);
  const response = await api.post(
    apiConfig.endpoints.account.paymentMethods,
    parsedInput,
  );

  return savedPaymentMethodSchema.parse(response.data);
}

export async function updatePaymentMethod(
  paymentMethodId: string,
  input: UpsertSavedPaymentMethodInput,
) {
  const parsedInput = upsertSavedPaymentMethodInputSchema.parse(input);
  const response = await api.patch(
    apiConfig.endpoints.account.paymentMethodDetail(paymentMethodId),
    parsedInput,
  );

  return savedPaymentMethodSchema.parse(response.data);
}

export async function setDefaultPaymentMethod(paymentMethodId: string) {
  const response = await api.post(
    apiConfig.endpoints.account.paymentMethodDefault(paymentMethodId),
  );

  return savedPaymentMethodSchema.parse(response.data);
}

export async function deletePaymentMethod(paymentMethodId: string) {
  await api.delete(
    apiConfig.endpoints.account.paymentMethodDetail(paymentMethodId),
  );
}

import { z } from 'zod';
import { apiConfig } from '@/config/api';
import { api } from '@/services/api';

export const authUserSchema = z.object({
  id: z.string(),
  email: z.email(),
  fullName: z.string(),
  phone: z.string().nullable(),
  addressLine: z.string().nullable(),
  city: z.string().nullable(),
  postalCode: z.string().nullable(),
  role: z.enum(['ADMIN', 'CUSTOMER']),
});

export const authSessionSchema = z.object({
  authenticated: z.boolean(),
  user: authUserSchema.nullable(),
});

export const loginInputSchema = z.object({
  email: z.email().trim().toLowerCase(),
  password: z.string().min(8),
});

export const registerInputSchema = z
  .object({
    fullName: z.string().trim().min(2),
    email: z.email().trim().toLowerCase(),
    password: z.string().min(8),
    confirmPassword: z.string().min(8),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match.',
  });

export type AuthUser = z.infer<typeof authUserSchema>;
export type AuthSession = z.infer<typeof authSessionSchema>;
export type LoginInput = z.infer<typeof loginInputSchema>;
export type RegisterInput = z.infer<typeof registerInputSchema>;

export async function login(input: LoginInput) {
  const parsedInput = loginInputSchema.parse(input);
  const response = await api.post(apiConfig.endpoints.auth.login, parsedInput);

  return authUserSchema.parse(response.data);
}

export async function register(input: RegisterInput) {
  const parsedInput = registerInputSchema.parse(input);
  const response = await api.post(
    apiConfig.endpoints.auth.register,
    parsedInput,
  );

  return authUserSchema.parse(response.data);
}

export async function getProfile() {
  const response = await api.get(apiConfig.endpoints.auth.profile);

  return authSessionSchema.parse(response.data);
}

export async function logout() {
  await api.post(apiConfig.endpoints.auth.logout);
}

import { z } from 'zod';
import { apiConfig } from '@/config/api';
import { api } from '@/services/api';

export const authUserSchema = z.object({
  id: z.string(),
  email: z.email(),
  fullName: z.string(),
  role: z.enum(['ADMIN', 'CUSTOMER']),
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

  return authUserSchema.parse(response.data);
}

export async function logout() {
  await api.post(apiConfig.endpoints.auth.logout);
}

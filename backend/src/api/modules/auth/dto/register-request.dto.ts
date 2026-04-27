import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const registerRequestSchema = z
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

export class RegisterRequestDto extends createZodDto(registerRequestSchema) {}

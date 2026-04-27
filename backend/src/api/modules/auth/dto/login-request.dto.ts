import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const loginRequestSchema = z.object({
  email: z.email().trim().toLowerCase(),
  password: z.string().min(8),
});

export class LoginRequestDto extends createZodDto(loginRequestSchema) {}

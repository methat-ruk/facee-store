import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const logoutRequestSchema = z.object({
  refreshToken: z.string().min(1),
});

export class LogoutRequestDto extends createZodDto(logoutRequestSchema) {}

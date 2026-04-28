import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const updateAccountProfileRequestSchema = z.object({
  fullName: z.string().trim().min(1),
  email: z.email().trim().toLowerCase(),
});

export type UpdateAccountProfileRequest = z.infer<
  typeof updateAccountProfileRequestSchema
>;

export class UpdateAccountProfileRequestDto extends createZodDto(
  updateAccountProfileRequestSchema,
) {}

import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const listNotificationsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

export class ListNotificationsQueryDto extends createZodDto(
  listNotificationsQuerySchema,
) {}

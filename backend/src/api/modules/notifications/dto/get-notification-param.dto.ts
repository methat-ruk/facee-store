import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const getNotificationParamSchema = z.object({
  notificationId: z.cuid(),
});

export class GetNotificationParamDto extends createZodDto(
  getNotificationParamSchema,
) {}

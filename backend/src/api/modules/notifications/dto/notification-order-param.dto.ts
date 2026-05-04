import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const notificationOrderParamSchema = z.object({
  orderNo: z.string().min(1),
});

export class NotificationOrderParamDto extends createZodDto(
  notificationOrderParamSchema,
) {}

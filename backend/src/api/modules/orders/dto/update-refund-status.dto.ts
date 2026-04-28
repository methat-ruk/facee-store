import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const updateRefundStatusSchema = z.object({
  refundStatus: z.enum(['PENDING_MANUAL', 'REFUNDED']),
});

export type UpdateRefundStatusInput = z.infer<typeof updateRefundStatusSchema>;

export class UpdateRefundStatusDto extends createZodDto(
  updateRefundStatusSchema,
) {}

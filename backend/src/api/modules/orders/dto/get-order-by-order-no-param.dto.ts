import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const getOrderByOrderNoParamSchema = z.object({
  orderNo: z.string().trim().min(1),
});

export class GetOrderByOrderNoParamDto extends createZodDto(
  getOrderByOrderNoParamSchema,
) {}

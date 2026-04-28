import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const addressParamSchema = z.object({
  addressId: z.string().trim().min(1),
});

export class AddressParamDto extends createZodDto(addressParamSchema) {}

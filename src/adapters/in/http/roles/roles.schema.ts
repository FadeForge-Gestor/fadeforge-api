import { z } from 'zod';

export const idParamSchema = z.object({
    id: z.coerce.number().int().positive('El id debe ser un número entero positivo'),
});

export type IdParamDto = z.infer<typeof idParamSchema>;

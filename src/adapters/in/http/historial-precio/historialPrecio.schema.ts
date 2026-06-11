import { z } from 'zod';

// Esquema para validar el parámetro idServicio en la URL
export const IdServicioParamsSchema = z.object({
    idServicio: z.coerce.number().int().positive('El idServicio debe ser un entero positivo'),
});

// Esquema para registrar un nuevo precio de servicio
export const RegistrarPrecioSchema = z.object({
    idServicio: z.number().int().positive('El idServicio debe ser un entero positivo'),
    precio: z.number().positive('El precio debe ser mayor a 0'),
});

export type RegistrarPrecioDto = z.infer<typeof RegistrarPrecioSchema>;

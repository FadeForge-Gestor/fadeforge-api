import { z } from 'zod';

// Esquema para crear un nuevo servicio
// duracionMinutos e idCategoria usan coerce porque multipart/form-data envía todo como string
export const CrearServicioSchema = z.object({
    nombre: z.string()
        .min(2, 'El nombre debe tener al menos 2 caracteres')
        .max(150, 'El nombre no puede superar 150 caracteres'),
    descripcion: z.string()
        .min(2, 'La descripción debe tener al menos 2 caracteres')
        .max(500, 'La descripción no puede superar 500 caracteres')
        .optional(),
    duracionMinutos: z.coerce.number()
        .int('La duración debe ser un número entero')
        .positive('La duración debe ser mayor a 0'),
    idCategoria: z.coerce.number()
        .int()
        .positive('El id de categoría debe ser mayor a 0'),
});

// Esquema para actualizar un servicio existente
export const ActualizarServicioSchema = z.object({
    nombre: z.string().min(2).max(150).optional(),
    descripcion: z.string().min(2).max(500).optional(),
    duracionMinutos: z.coerce.number().int().positive().optional(),
    idCategoria: z.coerce.number().int().positive().optional(),
}).refine(
    (data) => Object.keys(data).length > 0,
    { message: 'Debes enviar al menos un campo para actualizar' }
);

export type CrearServicioDto = z.infer<typeof CrearServicioSchema>;
export type ActualizarServicioDto = z.infer<typeof ActualizarServicioSchema>;
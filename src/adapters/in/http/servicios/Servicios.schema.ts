import { z } from 'zod';

// Esquema para crear un nuevo servicio
export const CrearServicioSchema = z.object({
    nombre: z.string()
        .min(2, 'El nombre debe tener al menos 2 caracteres')
        .max(100, 'El nombre no puede superar 100 caracteres'),
    descripcion: z.string()
        .min(2, 'La descripción debe tener al menos 2 caracteres')
        .max(100, 'La descripción no puede superar 100 caracteres')
        .optional(),
    duracionMinutos: z.number()
        .int('La duración debe ser un número entero')
        .positive('La duración debe ser mayor a 0'),
    idCategoria: z.number()
        .int()
        .positive('El id de categoría debe ser mayor a 0'),
    imagenUrl: z.string()
        .url('La URL de imagen no es válida')
        .optional(),
});

// Esquema para actualizar un servicio existente
export const ActualizarServicioSchema = z.object({
    nombre: z.string().min(2).max(150).optional(),
    descripcion: z.string().min(2).optional(),
    duracionMinutos: z.number().int().positive().optional(),
    idCategoria: z.number().int().positive().optional(),
    imagenUrl: z.string().url('La URL de imagen no es válida').optional(),
    activo: z.boolean().optional(),
}).refine(
    (data) => Object.keys(data).length > 0,
    { message: 'Debes enviar al menos un campo para actualizar' }
);

export type CrearServicioDto = z.infer<typeof CrearServicioSchema>;
export type ActualizarServicioDto = z.infer<typeof ActualizarServicioSchema>;
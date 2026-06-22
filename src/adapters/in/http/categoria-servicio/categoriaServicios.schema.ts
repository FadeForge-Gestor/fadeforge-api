import { z } from 'zod';

// Esquema para crear una nueva categoria de servicio
export const CrearCategoriaServicioSchema = z.object({
    nombre: z.string()
        .min(2, 'El nombre debe tener al menos 2 caracteres')
        .max(100, 'El nombre no puede superar 100 caracteres'),
    descripcion: z.string()
        .min(2, 'La descripción debe tener al menos 2 caracteres')
        .max(100, 'La descripción no puede superar 100 caracteres')
        .optional(),
})

// Esquema para actualizar una nueva categoría de servicio
export const ActualizarCategoriaServicioSchema = z.object({
    nombre: z.string().min(2).max(100).optional(),
    descripcion: z.string().min(2).max(100).optional(),
}).refine(
    (data) => Object.keys(data).length > 0,
    { message: 'Debes enviar al menos un campo para actualizar' }
);

export type CrearCategoriaServicioDto = z.infer<typeof CrearCategoriaServicioSchema>;
export type ActualizarCategoriaServicioDto =z.infer<typeof ActualizarCategoriaServicioSchema>
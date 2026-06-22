import { z } from 'zod';

export const idParamSchema = z.object({
    id: z.coerce.number().int().positive('El id debe ser un número entero positivo'),
});

// Schema para crear un rol.
// clave: identificador técnico estable (ej: 'admin', 'empleado')
// nombre: nombre visible para el usuario final
export const crearRolSchema = z.object({
    clave: z.string()
        .min(2, 'La clave debe tener al menos 2 caracteres')
        .max(50, 'La clave no puede superar 50 caracteres')
        .regex(/^[a-z_]+$/, 'La clave solo puede contener letras minúsculas y guiones bajos'),
    nombre: z.string()
        .min(2, 'El nombre debe tener al menos 2 caracteres')
        .max(50, 'El nombre no puede superar 50 caracteres'),
    descripcion: z.string().max(255).optional(),
});

// Schema para actualizar — todos los campos son opcionales,
// pero al menos uno debe estar presente.
export const actualizarRolSchema = z.object({
    clave: z.string()
        .min(2)
        .max(50)
        .regex(/^[a-z_]+$/, 'La clave solo puede contener letras minúsculas y guiones bajos')
        .optional(),
    nombre: z.string().min(2).max(50).optional(),
    descripcion: z.string().max(255).optional(),
}).refine(
    (data) => Object.keys(data).length > 0,
    { message: 'Debes enviar al menos un campo para actualizar' }
);

export type CrearRolDto = z.infer<typeof crearRolSchema>;
export type ActualizarRolDto = z.infer<typeof actualizarRolSchema>;
export type IdParamDto = z.infer<typeof idParamSchema>;

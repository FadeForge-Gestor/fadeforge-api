import { z } from 'zod';

// Esquema para crear un nuevo usuario
export const crearUsuarioSchema = z.object({
    nombre: z.string()
        .min(2, 'El nombre debe tener al menos 2 caracteres')
        .max(100, 'El nombre no puede superar 100 caracteres'),
    aPaterno: z.string()
        .min(2, 'El apellido paterno debe tener al menos 2 caracteres')
        .max(100, 'El apellido paterno no puede superar 100 caracteres'),
    aMaterno: z.string()
        .max(100, 'El apellido materno no puede superar 100 caracteres')
        .optional(),
    telefono: z.string()
        .min(7, 'El teléfono debe tener al menos 7 caracteres')
        .max(20, 'El teléfono no puede superar 20 caracteres'),
    idRol: z.number()
        .int('El id del rol debe ser un número entero')
        .positive('El id del rol debe ser un número positivo'),
    correo: z.string()
        .email({ message: 'El correo no tiene un formato válido' })
        .max(100, 'El correo no puede superar 100 caracteres'),
    contrasena: z.string()
        .min(8, 'La contraseña debe tener al menos 8 caracteres')
        .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_])/, 
        'La contraseña debe tener mayúsculas, minúsculas, números y símbolos')
        .refine((value) => !/\s/.test(value), 'La contraseña no puede contener espacios'),
});

// Esquema para actualizar un usuarios existente
export const actualizarUsuarioSchema = z.object({
    nombre: z.string().min(2).max(100).optional(),
    aPaterno: z.string().min(2).max(100).optional(),
    aMaterno: z.string().max(100).optional(),
    telefono: z.string().min(7).max(20).optional(),
    idRol: z.number().int().positive().optional(),
}).refine(
    (data) => Object.keys(data).length > 0,
    { message: 'Debes enviar al menos un campo para actualizar' }
);

export type CrearUsuarioDto = z.infer<typeof crearUsuarioSchema>;
export type ActualizarUsuarioDto = z.infer<typeof actualizarUsuarioSchema>;

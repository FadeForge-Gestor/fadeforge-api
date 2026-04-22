import { z } from 'zod';

// Esquema para cambiar la contraseña de un usuario
export const cambiarContrasenaSchema = z.object({
    nuevaContrasena: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres').max(100)
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_])/, 
    'La contraseña debe tener mayúsculas, minúsculas, números y símbolos')
    .refine((value) => !/\s/.test(value), 'La contraseña no puede contener espacios'),
    contrasenaActual: z.string().min(8, 'La contraseña actual debe tener al menos 8 caracteres').max(100)
})

// Esquema para cambiar el correo de un usuario
export const cambiarCorreoSchema = z.object({
    contrasenaActual: z.string().min(8, 'La contraseña actual debe tener al menos 8 caracteres').max(100),
    nuevoCorreo: z.string()
        .email({ message: 'El nuevo correo no tiene un formato válido' })
        .max(100, 'El nuevo correo no puede superar 100 caracteres'),
})

// Esquema para resetear la contraseña de un usuario
export const ResetContrasenaSchema = z.object({
    nuevaContrasena: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres').max(100)
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_])/, 
    'La contraseña debe tener mayúsculas, minúsculas, números y símbolos')
    .refine((value) => !/\s/.test(value), 'La contraseña no puede contener espacios'),
})

export type CambiarContrasenaDto = z.infer<typeof cambiarContrasenaSchema>;
export type CambiarCorreoDto = z.infer<typeof cambiarCorreoSchema>;
export type ResetContrasenaDto = z.infer<typeof ResetContrasenaSchema>;
import { z } from 'zod';

export const cambiarContrasenaSchema = z.object({
    nuevaContrasena: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres').max(100)
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_])/, 
    'La contraseña debe tener mayúsculas, minúsculas, números y símbolos')
    .refine((value) => !/\s/.test(value), 'La contraseña no puede contener espacios'),
    contrasenaActual: z.string().min(8, 'La contraseña actual debe tener al menos 8 caracteres').max(100),
})
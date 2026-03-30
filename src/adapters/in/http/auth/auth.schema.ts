import { z } from 'zod';

// Esquema de validación para el login
export const loginSchema = z.object({
    correo: z.string().email('Correo electrónico no válido'),
    contrasena: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

export type LoginDto = z.infer<typeof loginSchema>;
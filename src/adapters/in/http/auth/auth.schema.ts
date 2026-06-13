import { z } from 'zod';

// Esquema de validación para el login
export const loginSchema = z.object({
    correo: z.string().email('Correo electrónico no válido'),
    contrasena: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

export type LoginDto = z.infer<typeof loginSchema>;

// Esquema de validación para el registro de cliente
export const registroClienteSchema = z.object({
    nombre: z.string().min(1, 'El nombre es requerido'),
    aPaterno: z.string().min(1, 'El apellido paterno es requerido'),
    aMaterno: z.string().optional(),
    telefono: z.string().min(10, 'El teléfono debe tener al menos 10 caracteres'),
    correo: z.string().email('Correo electrónico no válido'),
    contrasena: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

export type RegistroClienteDto = z.infer<typeof registroClienteSchema>;
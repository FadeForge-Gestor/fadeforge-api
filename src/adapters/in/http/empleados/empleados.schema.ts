import { z } from 'zod';

// Esquema para validar al momento de promover un empleado
export const promoverEmpleadoSchema = z.object({
    idUsuario: z.number().int().positive()
})

export type PromoverEmpleadoDto = z.infer<typeof promoverEmpleadoSchema>;
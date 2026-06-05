import { z } from 'zod';

export const ListarPorCitaSchema = z.object({
    idCita: z.coerce.number().int().positive('El id de la cita debe ser mayor a 0'),
});

export type ListarPorCitaDto = z.infer<typeof ListarPorCitaSchema>;

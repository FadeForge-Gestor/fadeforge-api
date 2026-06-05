import { z } from 'zod';

const ServicioEnCitaSchema = z.object({
    idServicio: z.number().int().positive('El id del servicio debe ser mayor a 0'),
});

export const CrearCitaSchema = z.object({
    idCliente: z.number().int().positive('El id del cliente debe ser mayor a 0'),
    idEmpleado: z.number().int().positive('El id del empleado debe ser mayor a 0'),
    fechaInicio: z.coerce.date({ message: 'La fecha de inicio no es válida' }),
    servicios: z.array(ServicioEnCitaSchema)
        .min(1, 'La cita debe incluir al menos un servicio'),
});

export const ActualizarCitaSchema = z.object({
    idEmpleado: z.number().int().positive().optional(),
    fechaInicio: z.coerce.date().optional(),
    fechaFin: z.coerce.date().optional(),
}).refine(
    (data) => Object.keys(data).length > 0,
    { message: 'Debes enviar al menos un campo para actualizar' }
);

export const CambiarEstadoCitaSchema = z.object({
    estado: z.enum(['nueva', 'pendiente', 'en proceso', 'finalizada', 'cancelada', 'reprogramada', 'no asistio']),
    motivoCancelado: z.string().min(1, 'El motivo de cancelación no puede estar vacío').optional(),
    canceladoPor: z.number().int().positive().optional(),
}).refine(
    (data) => data.estado !== 'cancelada' || !!data.motivoCancelado,
    { message: 'El motivo de cancelación es requerido cuando el estado es cancelada', path: ['motivoCancelado'] }
);

export const RangoFechaSchema = z.object({
    desde: z.coerce.date({ message: 'La fecha "desde" no es válida' }),
    hasta: z.coerce.date({ message: 'La fecha "hasta" no es válida' }),
}).refine(
    (data) => data.desde < data.hasta,
    { message: 'La fecha "desde" debe ser anterior a "hasta"' }
);

export type CrearCitaDto = z.infer<typeof CrearCitaSchema>;
export type ActualizarCitaDto = z.infer<typeof ActualizarCitaSchema>;
export type CambiarEstadoCitaDto = z.infer<typeof CambiarEstadoCitaSchema>;
export type RangoFechaDto = z.infer<typeof RangoFechaSchema>;
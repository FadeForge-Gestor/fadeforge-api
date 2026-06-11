import { DetalleCita, CrearDetalleCitaInput } from "@core/domain/detalle-cita/detalleCita.entity";

export type EstadoCita = 'nueva' | 'pendiente' | 'en_proceso' | 'finalizada' | 'cancelada' | 'reprogramada' | 'no_asistio';

export interface Cita {
    id: number;
    folio: string;
    idCliente: number;
    idEmpleado: number;
    fechaInicio: Date;
    fechaFin: Date;
    estado: EstadoCita;
    motivoCancelado: string | null;
    canceladoPor: number | null;
    fechaCreacion: Date;
    fechaModificacion: Date;
    subtotal: number;
    iva: number;
    total: number;
    detalle: DetalleCita[];
}

export interface ServicioEnCitaInput {
    idServicio: number;
}

export interface CrearCitaInput {
    idCliente: number;
    idEmpleado: number;
    fechaInicio: Date;
    servicios: ServicioEnCitaInput[];
}

export interface CrearCitaRepositoryInput {
    idCliente: number;
    idEmpleado: number;
    fechaInicio: Date;
    fechaFin: Date;
    subtotal: number;
    iva: number;
    total: number;
    detalle: CrearDetalleCitaInput[];
}

export interface ActualizarCitaInput {
    idEmpleado?: number;
    fechaInicio?: Date;
    fechaFin?: Date;
    subtotal?: number;
    iva?: number;
    total?: number;
}

export interface CambiarEstadoCitaInput {
    estado: EstadoCita;
    motivoCancelado?: string;
    canceladoPor?: number;
}


type EstadoCita = 'nueva' | 'pendiente' | 'en proceso' | 'finalizada' | 'cancelada' | 'reprogramada' | 'no asistio';

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
}

export interface CrearCitaInput {
    idCliente: number;
    idEmpleado: number;
    fechaInicio: Date;
    fechaFin: Date;
    subtotal: number;
    iva: number;
    total: number;
}

export interface ActualizarCitaInput {
    idEmpleado?: number;
    fechaInicio?: Date;
    fechaFin?: Date;
    estado?: EstadoCita;
    motivoCancelado?: string;
    subtotal?: number;
    iva?: number;
    total?: number;
}

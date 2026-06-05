// Interfaz para la entidad Cita
export interface Cita {
    id: number;
    idCliente: number;
    idEmpleado: number;
    fechaInicio: Date;
    fechaFin: Date;
    estado: 'nueva' | 'pendiente' | 'en proceso' | 'finalizada' | 'cancelada' | 'reprogramada' | 'no asistio';
    motivoCancelado: string | null;
    fechaCreacion: Date;
    fechaModificacion: Date;
    subtotal: number;
    iva: number;    
    total: number;
}
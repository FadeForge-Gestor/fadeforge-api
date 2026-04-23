export interface Empleado {
    id: number;
    idUsuario: number;
    nombreCompletoEmpleado: string;
    correo: string;
    activo: boolean;
    fechaCreacion: Date;
    fechaModificacion: Date;
}

export interface PromoverEmpleadoInput {
    idUsuario: number;
}


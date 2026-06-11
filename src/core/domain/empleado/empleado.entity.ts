export interface Empleado {
    id: number;
    idUsuario: number;
    activo: boolean;
    fechaCreacion: Date;
    fechaModificacion: Date;
}

// Read model del agregado Empleado — incluye datos enriquecidos de usuario y credenciales
// que el repositorio obtiene mediante JOIN. No es una vista desnormalizada externa,
// sino la proyección completa que la capa HTTP consume.
export interface EmpleadoDetalle extends Empleado {
    nombreCompleto: string;
    correo: string;
}

export interface PromoverEmpleadoInput {
    idUsuario: number;
}


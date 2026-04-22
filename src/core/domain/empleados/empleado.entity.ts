export interface Empleado {
    id: number;
    idUsuario: number;
    nombreCompletoEmpleado: string;
    correo: string;
    activo: boolean;
    fechaCreacion: Date;
    fechaModificacion: Date;
}

export interface CrearEmpleadoInput {
    nombre: string;
    aPaterno: string;
    aMaterno?: string;
    telefono: string;
    idRol: number;
    correo: string;
    contrasena: string;
}
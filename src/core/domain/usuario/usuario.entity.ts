export interface Usuario {
    id: number;
    nombre: string;
    aPaterno: string;
    aMaterno: string | null;
    telefono: string;
    idRol: number;
    activo: boolean;
    fechaCreacion: Date;
    fechaModificacion: Date;
}

export interface CrearUsuarioInput {
    nombre: string;
    aPaterno: string;
    aMaterno?: string;
    telefono: string;
    idRol: number;
    correo: string;
    contrasena: string;
}

export interface CrearUsuarioRepositoryInput {
    nombre: string;
    aPaterno: string;
    aMaterno?: string;
    telefono: string;
    idRol: number;
    correo: string;
    hashContrasena: string; // hash ya calculado, NO la contraseña plana
}

export interface ActualizarUsuarioInput {
    nombre?: string;
    aPaterno?: string;
    aMaterno?: string;
    telefono?: string;
    idRol?: number;
    activo?: boolean;
}

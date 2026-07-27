export interface Credencial {
    id: number;
    correo: string;
    fechaCreacion: Date;
    fechaModificacion: Date;
}

export interface CredencialRaw {
    idUsuario: number;
    correo: string;
    hashContrasena: string;
    emailVerificado: boolean;
}

export interface CambiarContrasenaInput {
    contrasenaActual: string;
    nuevaContrasena: string;
}

export interface CambiarCorreoInput {
    contrasenaActual: string;
    nuevoCorreo: string;
}

export interface ResetContrasenaInput {
    nuevaContrasena: string;
}
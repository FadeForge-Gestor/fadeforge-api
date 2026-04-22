export interface Credencial {
    id: number;
    correo: string;
    fechaCreacion: Date;
    fechaModificacion: Date;
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
export interface LoginInput {
    correo: string;
    contrasena: string;
}

export interface LoginOutput {
    token: string;
    usuario: {
        id: number;
        correo: string;
        rol: string;
        emailVerificado: boolean;
    };
}

export interface RegistroClienteInput {
    nombre: string;
    aPaterno: string;
    aMaterno?: string;
    telefono: string;
    correo: string;
    contrasena: string;
}

export interface RegistroClienteOutput {
    token?: string;
    mensaje?: string;
    usuario: {
        id: number;
        correo: string;
        rol: string;
    };
}

export interface CredencialesAuth {
    correo: string;
    hashContrasena: string;
    idUsuario: number;
    claveRol: string;
    emailVerificado: boolean;
}

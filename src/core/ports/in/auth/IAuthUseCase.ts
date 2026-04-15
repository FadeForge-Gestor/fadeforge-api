// Interface para el caso de uso de autenticación
export interface LoginInput {
    correo: string;
    contrasena: string;
}

// Interface para el caso de uso de autenticación
export interface LoginOutput {
    token: string;
    usuario: {
        id: number;
        correo: string;
        rol: string;
    }
}

// Interfaz para el caso de uso de autenticación
export interface IAuthUseCase {
    login(input: LoginInput): Promise<LoginOutput>;
}
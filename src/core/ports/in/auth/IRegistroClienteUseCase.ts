export interface RegistroClienteInput {
    nombre: string;
    aPaterno: string;
    aMaterno?: string;
    telefono: string;
    correo: string;
    contrasena: string;
}

export interface RegistroClienteOutput {
    token: string;
    usuario: {
        id: number;
        correo: string;
        rol: string;
    };
}

export interface IRegistroClienteUseCase {
    registrar(input: RegistroClienteInput): Promise<RegistroClienteOutput>;
}

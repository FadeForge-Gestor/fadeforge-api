export interface IEmailService {
    enviarVerificacion(correo: string, token: string): Promise<void>;
    enviarBienvenida(correo: string, nombre: string): Promise<void>;
}

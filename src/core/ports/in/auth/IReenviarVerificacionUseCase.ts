export interface IReenviarVerificacionUseCase {
    reenviar(correo: string): Promise<void>;
}

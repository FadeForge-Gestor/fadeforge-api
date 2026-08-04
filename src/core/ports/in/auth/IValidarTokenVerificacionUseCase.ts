export interface IValidarTokenVerificacionUseCase {
    validar(token: string): Promise<{ valido: boolean }>;
}

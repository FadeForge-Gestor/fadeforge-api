export interface IConfirmarEmailUseCase {
    confirmar(token: string): Promise<void>;
}

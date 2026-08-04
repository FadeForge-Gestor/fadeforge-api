import { IValidarTokenVerificacionUseCase } from '@core/ports/in/auth/IValidarTokenVerificacionUseCase';
import { ITokenVerificacionRepository } from '@core/ports/out/email/ITokenVerificacionRepository';

export class ValidarTokenVerificacionUseCase implements IValidarTokenVerificacionUseCase {

    constructor(
        private readonly tokenVerificacionRepository: ITokenVerificacionRepository,
    ) {}

    async validar(token: string): Promise<{ valido: boolean }> {
        const resultado = await this.tokenVerificacionRepository.buscarTokenValido(token);

        if (!resultado) {
            return { valido: false };
        }

        if (new Date() > resultado.expiraEn) {
            return { valido: false };
        }

        return { valido: true };
    }
}

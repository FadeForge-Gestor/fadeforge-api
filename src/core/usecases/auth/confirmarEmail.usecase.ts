import bcrypt from 'bcrypt';
import { IConfirmarEmailUseCase } from '@core/ports/in/auth/IConfirmarEmailUseCase';
import { ITokenVerificacionRepository } from '@core/ports/out/email/ITokenVerificacionRepository';
import { ICredencialRepository } from '@core/ports/out/credenciales/ICredencialRepository';
import { BadRequestError } from '@shared/errors/HttpError';

export class ConfirmarEmailUseCase implements IConfirmarEmailUseCase {

    constructor(
        private readonly tokenVerificacionRepository: ITokenVerificacionRepository,
        private readonly credencialRepository: ICredencialRepository,
    ) {}

    async confirmar(token: string): Promise<void> {
        const tokenHash = await bcrypt.hash(token, 10);
        const resultado = await this.tokenVerificacionRepository.buscarPorTokenHash(token);

        if (!resultado) {
            throw new BadRequestError('El token de verificación es inválido o expiró');
        }

        if (new Date() > resultado.expiraEn) {
            await this.tokenVerificacionRepository.eliminarPorIdUsuario(resultado.idUsuario);
            throw new BadRequestError('El token de verificación expiró');
        }

        await this.tokenVerificacionRepository.eliminarPorIdUsuario(resultado.idUsuario);
        await this.credencialRepository.actualizarEmailVerificado(resultado.idUsuario, true);
    }
}

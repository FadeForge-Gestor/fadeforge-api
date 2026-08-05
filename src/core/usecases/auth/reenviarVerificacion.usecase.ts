import { IReenviarVerificacionUseCase } from '@core/ports/in/auth/IReenviarVerificacionUseCase';
import { ITokenVerificacionRepository } from '@core/ports/out/email/ITokenVerificacionRepository';
import { IEmailService } from '@core/ports/out/email/IEmailService';
import { ICredencialRepository } from '@core/ports/out/credenciales/ICredencialRepository';
import { IUsuarioRepository } from '@core/ports/out/usuarios/IUsuarioRepository';
import { generarToken, calcularExpiracion } from '@core/domain/email/verificationToken';
import { env } from '@config/env';
import { BadRequestError, NotFoundError, TooManyRequestsError } from '@shared/errors/HttpError';

const MAX_REENVIOS_POR_DIA = 3;

export class ReenviarVerificacionUseCase implements IReenviarVerificacionUseCase {

    constructor(
        private readonly tokenVerificacionRepository: ITokenVerificacionRepository,
        private readonly emailService: IEmailService,
        private readonly usuarioRepository: IUsuarioRepository,
        private readonly credencialRepository: ICredencialRepository,
    ) {}

    async reenviar(correo: string): Promise<void> {
        const usuario = await this.usuarioRepository.buscarPorCorreo(correo);
        if (!usuario) {
            throw new NotFoundError('No se encontró una cuenta con ese correo');
        }

        const credencial = await this.credencialRepository.buscarPorIdUsuario(usuario.id);
        if (!credencial) {
            throw new NotFoundError('No se encontraron credenciales para este usuario');
        }

        if (credencial.emailVerificado) {
            throw new BadRequestError('El correo ya está verificado');
        }

        const enviosHoy = await this.tokenVerificacionRepository.contarEnviosHoy(usuario.id);
        if (enviosHoy >= MAX_REENVIOS_POR_DIA) {
            throw new TooManyRequestsError(
                `Límite de ${MAX_REENVIOS_POR_DIA} reenvíos por día alcanzado. Intentá mañana.`
            );
        }

        await this.tokenVerificacionRepository.eliminarPorIdUsuario(usuario.id);

        const token = generarToken();
        const expiraEn = calcularExpiracion(env.EMAIL_VERIFICATION_EXPIRES_IN_HOURS);

        await this.tokenVerificacionRepository.crear(usuario.id, token, expiraEn);

        try {
            await this.emailService.enviarVerificacion(correo, token);
        } catch (error) {
            // El reenvío no rompe el flujo, pero el error no debe quedar invisible.
            console.error(`Error al enviar el correo de verificación a ${correo}:`, error);
        }
    }
}

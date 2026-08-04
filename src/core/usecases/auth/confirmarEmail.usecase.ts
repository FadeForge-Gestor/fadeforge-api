import { IConfirmarEmailUseCase } from '@core/ports/in/auth/IConfirmarEmailUseCase';
import { ITokenVerificacionRepository } from '@core/ports/out/email/ITokenVerificacionRepository';
import { ICredencialRepository } from '@core/ports/out/credenciales/ICredencialRepository';
import { IUsuarioRepository } from '@core/ports/out/usuarios/IUsuarioRepository';
import { IEmailService } from '@core/ports/out/email/IEmailService';
import { BadRequestError } from '@shared/errors/HttpError';

export class ConfirmarEmailUseCase implements IConfirmarEmailUseCase {

    constructor(
        private readonly tokenVerificacionRepository: ITokenVerificacionRepository,
        private readonly credencialRepository: ICredencialRepository,
        private readonly usuarioRepository: IUsuarioRepository,
        private readonly emailService: IEmailService,
    ) {}

    async confirmar(token: string): Promise<void> {
        const resultado = await this.tokenVerificacionRepository.buscarPorToken(token);

        if (!resultado) {
            throw new BadRequestError('El token de verificación es inválido o expiró');
        }

        if (new Date() > resultado.expiraEn) {
            await this.tokenVerificacionRepository.eliminarPorIdUsuario(resultado.idUsuario);
            throw new BadRequestError('El token de verificación expiró');
        }

        // La verificación se persiste ANTES de intentar el envío de la bienvenida:
        // la cuenta queda activa aunque el correo falle (side-effect, no bloquea).
        await this.tokenVerificacionRepository.eliminarPorIdUsuario(resultado.idUsuario);
        await this.credencialRepository.actualizarEmailVerificado(resultado.idUsuario, true);

        await this.enviarBienvenida(resultado.idUsuario);
    }

    private async enviarBienvenida(idUsuario: number): Promise<void> {
        try {
            const [usuario, credencial] = await Promise.all([
                this.usuarioRepository.buscarPorId(idUsuario),
                this.credencialRepository.buscarPorIdUsuario(idUsuario),
            ]);

            // Defensivo: la verificación ya quedó hecha, no rompemos el flujo.
            if (!usuario || !credencial) {
                console.error(`No se pudo enviar la bienvenida: usuario o credencial inexistentes (idUsuario=${idUsuario})`);
                return;
            }

            await this.emailService.enviarBienvenida(credencial.correo, usuario.nombre);
        } catch (error) {
            console.error('No se pudo enviar el correo de bienvenida:', error);
        }
    }
}

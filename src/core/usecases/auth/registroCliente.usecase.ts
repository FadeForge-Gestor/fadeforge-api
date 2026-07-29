import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { IRegistroClienteUseCase } from '@core/ports/in/auth/IRegistroClienteUseCase';
import { RegistroClienteInput, RegistroClienteOutput } from '@core/domain/auth/auth.entity';
import { IUsuarioRepository } from '@core/ports/out/usuarios/IUsuarioRepository';
import { IRolRepository } from '@core/ports/out/roles/IRolRepository';
import { IEmailService } from '@core/ports/out/email/IEmailService';
import { ITokenVerificacionRepository } from '@core/ports/out/email/ITokenVerificacionRepository';
import { ICredencialRepository } from '@core/ports/out/credenciales/ICredencialRepository';
import { env } from '@config/env';
import { BadRequestError, ConflictError, NotFoundError } from '@shared/errors/HttpError';
import { validarContrasena } from '@core/domain/usuario/contrasena';
import { ROLES } from '@shared/constants/roles';
import { generarToken, calcularExpiracion } from '@core/domain/email/verificationToken';

export class RegistroClienteUseCase implements IRegistroClienteUseCase {

    constructor(
        private readonly usuarioRepository: IUsuarioRepository,
        private readonly rolRepository: IRolRepository,
        private readonly emailService: IEmailService,
        private readonly tokenVerificacionRepository: ITokenVerificacionRepository,
    ) {}

    async registrar(input: RegistroClienteInput): Promise<RegistroClienteOutput> {
        const errorContrasena = validarContrasena(input.contrasena);
        if (errorContrasena) throw new BadRequestError(errorContrasena);

        const correoExiste = await this.usuarioRepository.buscarPorCorreo(input.correo);
        if (correoExiste) throw new ConflictError(`El correo ${input.correo} ya está registrado`);

        const rolCliente = await this.rolRepository.buscarPorClave(ROLES.CLIENTE);
        if (!rolCliente) throw new NotFoundError('El rol cliente no está configurado en el sistema');

        const hashContrasena = await bcrypt.hash(input.contrasena, 10);

        const usuario = await this.usuarioRepository.crear({
            nombre: input.nombre,
            aPaterno: input.aPaterno,
            aMaterno: input.aMaterno,
            telefono: input.telefono,
            idRol: rolCliente.id,
            correo: input.correo,
            hashContrasena,
        });

        const usuarioData = {
            id: usuario.id,
            correo: input.correo,
            rol: ROLES.CLIENTE,
        };

        if (!env.EMAIL_VERIFICATION_ENABLED) {
            const token = jwt.sign(
                { id: usuario.id, rol: ROLES.CLIENTE, correo: input.correo },
                env.JWT_SECRET,
                { expiresIn: env.JWT_EXPIRES_IN } as jwt.SignOptions
            );
            return { token, usuario: usuarioData };
        }

        const token = generarToken();
        const tokenHash = await bcrypt.hash(token, 10);
        const expiraEn = calcularExpiracion(env.EMAIL_VERIFICATION_EXPIRES_IN_HOURS);

        await this.tokenVerificacionRepository.crear(usuario.id, tokenHash, expiraEn);

        try {
            await this.emailService.enviarVerificacion(input.correo, token);
        } catch {
            // Si el envío falla, el usuario queda registrado pero sin JWT.
            // Puede reenviar la verificación después.
        }

        return {
            mensaje: 'Te enviamos un correo de verificación. Revisa tu bandeja de entrada.',
            usuario: usuarioData,
        };
    }
}

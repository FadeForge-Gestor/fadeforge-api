import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { IAuthUseCase, LoginInput, LoginOutput } from '@core/ports/in/auth/IAuthUseCase';
import { IAuthRepository } from '@core/ports/out/auth/IAuthRepository';
import { ILoginSecurityRepository } from '@core/ports/out/login-security/ILoginSecurityRepository';
import { env } from '@config/env';

import { UnauthorizedError, TooManyRequestsError } from '@shared/errors/HttpError';

export class LoginUseCase implements IAuthUseCase {

    constructor(
        private readonly authRepository: IAuthRepository,
        private readonly loginSecurityRepository: ILoginSecurityRepository,
    ) {}

    async login(input: LoginInput): Promise<LoginOutput> {
        const correo = input.correo.toLowerCase();

        const estaBloqueado = await this.loginSecurityRepository.estaBloqueado(correo);
        if (estaBloqueado) {
            // Se hace una segunda query para obtener el tiempo restante del bloqueo
            const estado = await this.loginSecurityRepository.obtenerEstado(correo);
            const tiempoRestante = estado?.tiempoRestanteMs ?? 0;
            const minutos = Math.ceil(tiempoRestante / 60000);
            throw new TooManyRequestsError(
                `Cuenta bloqueada temporalmente. Intentá de nuevo en ${minutos} minuto(s).`
            );
        }

        const credenciales = await this.authRepository.buscarPorCorreo(correo);

        if (!credenciales) {
            await this.loginSecurityRepository.registrarIntentoFallido(correo);
            throw new UnauthorizedError();
        }

        const contrasenaValida = await bcrypt.compare(input.contrasena, credenciales.hashContrasena);

        if (!contrasenaValida) {
            await this.loginSecurityRepository.registrarIntentoFallido(correo);
            throw new UnauthorizedError();
        }

        await this.loginSecurityRepository.resetIntentos(correo);

        const token = jwt.sign(
            {
                id: credenciales.idUsuario,
                rol: credenciales.claveRol,
                correo: credenciales.correo,
            },
            env.JWT_SECRET,
            { expiresIn: env.JWT_EXPIRES_IN } as jwt.SignOptions
        );

        return {
            token,
            usuario: {
                id: credenciales.idUsuario,
                correo: credenciales.correo,
                rol: credenciales.claveRol,
            },
        };
    }
}

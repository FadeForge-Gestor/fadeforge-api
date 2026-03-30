import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { IAuthUseCase, LoginInput, LoginOutput } from '../../ports/in/auth/IAuthUseCase';
import { IAuthRepository } from '../../ports/out/auth/IAuthRepository';
import { UnauthorizedError } from '../../../shared/errors/HttpError';

// Implemenatación del caso de uso del login
export class LoginUseCase implements IAuthUseCase {

    // Inyección de dependencias del repositorio de autenticación
    constructor(private readonly authRepository: IAuthRepository) {}

    // Lógica del cado de uso del login
    async login(input: LoginInput): Promise<LoginOutput> {
        const credenciales = await this.authRepository.buscarPorCorreo(input.correo);

        // Si no se encuentran credenciales para el correo proporcionado, se lanza un error de autenticación
        if (!credenciales) {
            throw new UnauthorizedError();
        }

        // Se compara la contraseña proporcionada con el hash almacenado en la base de datos
        const contrasenaValida = await bcrypt.compare(input.contrasena, credenciales.hashContrasena);

        // Si la contraseña no es válida, se lanza un error de autenticación
        if (!contrasenaValida) {
            throw new UnauthorizedError();
        }

        // Si las credenciales son válidad, se genera un token JWT con la información del usuario
        const token = jwt.sign(
            {
                id: credenciales.usuario.id,
                rol: credenciales.usuario.idRol,
                correo: credenciales.correo,
            },
            process.env.JWT_SECRET!,
            { expiresIn: process.env.JWT_EXPIRES_IN ?? '7d' } as jwt.SignOptions
        );

        // Se retorna el token y la información del usuario
        return {
            token,
            usuario: {
                id: credenciales.usuario.id,
                correo: credenciales.correo,
                rol: credenciales.usuario.idRol,
            },
        };
    }
}

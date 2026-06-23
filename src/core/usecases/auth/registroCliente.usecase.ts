import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { IRegistroClienteUseCase, RegistroClienteInput, RegistroClienteOutput } from '@core/ports/in/auth/IRegistroClienteUseCase';
import { IUsuarioRepository } from '@core/ports/out/usuarios/IUsuarioRepository';
import { IRolRepository } from '@core/ports/out/roles/IRolRepository';
import { env } from '@config/env';
import { BadRequestError, ConflictError, NotFoundError } from '@shared/errors/HttpError';
import { validarContrasena } from '@core/domain/usuario/contrasena';
import { ROLES } from '@shared/constants/roles';

export class RegistroClienteUseCase implements IRegistroClienteUseCase {

    constructor(
        private readonly usuarioRepository: IUsuarioRepository,
        private readonly rolRepository: IRolRepository,
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

        const token = jwt.sign(
            {
                id: usuario.id,
                rol: ROLES.CLIENTE,
                correo: input.correo,
            },
            env.JWT_SECRET,
            { expiresIn: env.JWT_EXPIRES_IN } as jwt.SignOptions
        );

        return {
            token,
            usuario: {
                id: usuario.id,
                correo: input.correo,
                rol: ROLES.CLIENTE,
            },
        };
    }
}

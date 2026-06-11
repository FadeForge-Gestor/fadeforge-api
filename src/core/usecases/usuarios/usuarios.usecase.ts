import { IUsuarioRepository } from "@core/ports/out/usuarios/IUsuarioRepository";
import { IUsuarioUseCase } from "@core/ports/in/usuarios/IUsuarioUseCase";
import { Usuario, CrearUsuarioInput, ActualizarUsuarioInput } from "@core/domain/usuario/usuario.entity";
import { NotFoundError, ConflictError } from "@shared/errors/HttpError";
import bcrypt from "bcrypt";

export class UsuariosUseCase implements IUsuarioUseCase {

    constructor(private readonly usuarioRepository: IUsuarioRepository) {}

        // Método para listar los usuarios
        async listar(): Promise<Usuario[]> {
            return this.usuarioRepository.listarTodos();
        }

        // Método para obtener un usuario por su ID
        async obtenerPorId(id: number): Promise<Usuario> {
            const usuario = await this.usuarioRepository.buscarPorId(id);
            if (!usuario) throw new NotFoundError(`Usuario con id ${id} no encontrado`);
            return usuario;
        }

        // Método para crear un usuario
        async crear(input: CrearUsuarioInput): Promise<Usuario> {
            const correoExiste = await this.usuarioRepository.buscarPorCorreo(input.correo);
            if (correoExiste) throw new ConflictError(`El correo ${input.correo} ya está registrado`);

            const hashContrasena = await bcrypt.hash(input.contrasena, 10);
            return this.usuarioRepository.crear({
                nombre: input.nombre,
                aPaterno: input.aPaterno,
                aMaterno: input.aMaterno,
                telefono: input.telefono,
                idRol: input.idRol,
                correo: input.correo,
                hashContrasena,
            });
        }

        // Método para actualizar un usuario
        async actualizar(id: number, input: ActualizarUsuarioInput): Promise<Usuario> {
            const existe = await this.usuarioRepository.buscarPorId(id);
            if (!existe) throw new NotFoundError(`Usuario con id ${id} no encontrado`);
            if (!existe.activo) throw new ConflictError(`El usuario con id ${id} ya está desactivado`);
            return this.usuarioRepository.actualizar(id, input);
        }

        // Método para desactivar una cuenta
        async desactivar(id: number): Promise<void> {
            const existe = await this.usuarioRepository.buscarPorId(id);
            if (!existe) throw new NotFoundError(`Usuario con id ${id} no encontrado`);
            if (!existe.activo) throw new ConflictError(`El usuario con id ${id} ya está desactivado`);
            return this.usuarioRepository.desactivar(id);
        }

}
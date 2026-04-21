import { IUsuarioRepository } from "@core/ports/out/usuarios/IUsuarioRepository";
import { IUsuarioUseCase } from "@core/ports/in/usuarios/IUsuarioUseCase";
import { Usuario, CrearUsuarioInput, ActualizarUsuarioInput } from "@core/domain/usuario/usuario.entity";
import { NotFoundError, ConflictError } from "@shared/errors/HttpError";

export class UsuariosUseCase implements IUsuarioUseCase {

    constructor(private readonly usuarioRepository: IUsuarioRepository) {}

        async listar(): Promise<Usuario[]> {
            return this.usuarioRepository.listarTodos();
        }

        async obtenerPorId(id: number): Promise<Usuario> {
            const usuario = await this.usuarioRepository.buscarPorId(id);
            if (!usuario) throw new NotFoundError(`Usuario con id ${id} no encontrado`);
            return usuario;
        }

        async crear(input: CrearUsuarioInput): Promise<Usuario> {
            const correoExiste = await this.usuarioRepository.buscarPorCorreo(input.correo);
            if (correoExiste) throw new ConflictError(`El correo ${input.correo} ya está registrado`);
            return this.usuarioRepository.crear(input);
        }

        async actualizar(id: number, input: ActualizarUsuarioInput): Promise<Usuario> {
            return this.usuarioRepository.actualizar(id, input);
        }

        async eliminar(id: number): Promise<void> {
            const existe = await this.usuarioRepository.buscarPorId(id);
            if (!existe) throw new NotFoundError(`Usuario con id ${id} no encontrado`);
            if (!existe.activo) throw new ConflictError(`El usuario con id ${id} ya está desactivado`);
            return this.usuarioRepository.desactivar(id);
        }

}
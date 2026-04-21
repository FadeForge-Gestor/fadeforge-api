import { Usuario, CrearUsuarioInput, ActualizarUsuarioInput } from "@core/domain/usuario/usuario.entity";

// Contrato que define las operaciones disponibles sobre usuarios.
// El caso de uso solo conoce esta interfaz, nunca Prisma directamente
export interface IUsuarioRepository {
    listarTodos(): Promise<Usuario[]>;
    buscarPorId(id: number): Promise<Usuario | null>;
    buscarPorCorreo(correo: string): Promise<Usuario | null>;
    crear(input: CrearUsuarioInput): Promise<Usuario>;
    actualizar(id: number, input: ActualizarUsuarioInput): Promise<Usuario>;
    desactivar(id: number): Promise<void>;
}
import { Usuario, CrearUsuarioInput, ActualizarUsuarioInput } from "@core/domain/usuario/usuario.entity";

// Contrato que define las operaciones disponibles sobre usuarios.
// El controller solo conoce esta interfaz, nunca la implementación concreta.
export interface IUsuarioUseCase {
    listar(): Promise<Usuario[]>;
    obtenerPorId(id: number): Promise<Usuario>;
    crear(input: CrearUsuarioInput): Promise<Usuario>;
    actualizar(id: number, input: ActualizarUsuarioInput): Promise<Usuario>;
    eliminar(id: number): Promise<void>;
}
import { Rol, CrearRolInput, ActualizarRolInput } from '@core/domain/rol/rol.entity';

// Contrato que define las operaciones disponibles sobre roles.
// El controller solo conoce esta interfaz, nunca la implementación concreta.
export interface IRolUseCase {
    listar(): Promise<Rol[]>;
    listarActivos(): Promise<Rol[]>;
    obtenerPorId(id: number): Promise<Rol>;
    crear(input: CrearRolInput): Promise<Rol>;
    actualizar(id: number, input: ActualizarRolInput): Promise<Rol>;
    desactivar(id: number): Promise<void>;
}

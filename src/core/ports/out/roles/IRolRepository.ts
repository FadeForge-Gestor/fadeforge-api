import { Rol, CrearRolInput, ActualizarRolInput } from '@core/domain/rol/rol.entity';

// Contrato que define las operaciones de persistencia para roles.
// El caso de uso solo conoce esta interfaz, nunca Prisma directamente.
export interface IRolRepository {
    listarTodos(): Promise<Rol[]>;
    listarActivos(): Promise<Rol[]>;
    buscarPorId(id: number): Promise<Rol | null>;
    buscarPorNombre(nombre: string): Promise<Rol | null>;
    buscarPorClave(clave: string): Promise<Rol | null>;
    crear(input: CrearRolInput): Promise<Rol>;
    actualizar(id: number, input: ActualizarRolInput): Promise<Rol>;
    desactivar(id: number): Promise<void>;
}

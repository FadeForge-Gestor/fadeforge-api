import { Rol } from '@core/domain/rol/rol.entity';

// Contrato que define las operaciones de persistencia para roles.
// El caso de uso solo conoce esta interfaz, nunca Prisma directamente.
// buscarPorClave se mantiene: lo usa registroCliente.usecase para resolver el rol "cliente".
export interface IRolRepository {
    listarTodos(): Promise<Rol[]>;
    buscarPorId(id: number): Promise<Rol | null>;
    buscarPorClave(clave: string): Promise<Rol | null>;
}

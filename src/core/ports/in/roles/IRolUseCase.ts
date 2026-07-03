import { Rol } from '@core/domain/rol/rol.entity';

// Contrato que define las operaciones disponibles sobre roles.
// El controller solo conoce esta interfaz, nunca la implementación concreta.
// Roles fijos y sembrados por prisma/seed.ts: solo lectura, sin crear/actualizar/desactivar.
export interface IRolUseCase {
    listar(): Promise<Rol[]>;
    obtenerPorId(id: number): Promise<Rol>;
}

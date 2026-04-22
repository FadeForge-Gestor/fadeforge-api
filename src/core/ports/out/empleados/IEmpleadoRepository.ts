import { Empleado, PromoverEmpleadoInput } from "@core/domain/empleados/empleado.entity";

// Contrato que define las operaciones disponibles sobre usuarios.
// El caso de uso solo conoce esta interfaz, nunca Prisma directamente
export interface IEmpleadoRepository {
    listarTodos(): Promise<Empleado[]>;
    buscarPorId(id: number): Promise<Empleado | null>;
    promover(input: PromoverEmpleadoInput): Promise<Empleado>;
    desactivar(id: number): Promise<void>;
}
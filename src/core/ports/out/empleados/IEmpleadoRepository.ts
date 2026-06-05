import { Empleado, PromoverEmpleadoInput } from "@core/domain/empleado/empleado.entity";

// Contrato que define las operaciones disponibles sobre empleados.
// El caso de uso solo conoce esta interfaz, nunca Prisma directamente
export interface IEmpleadoRepository {
    listarTodos(): Promise<Empleado[]>;
    listarActivos(): Promise<Empleado[]>
    buscarPorId(id: number): Promise<Empleado | null>;
    buscarPorIdUsuario(idUsuario: number): Promise<Empleado | null>;
    promover(input: PromoverEmpleadoInput): Promise<Empleado>;
    desactivar(id: number): Promise<void>;
}
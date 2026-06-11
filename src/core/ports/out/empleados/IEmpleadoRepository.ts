import { Empleado, EmpleadoDetalle, PromoverEmpleadoInput } from "@core/domain/empleado/empleado.entity";

// Contrato que define las operaciones disponibles sobre empleados.
// El caso de uso solo conoce esta interfaz, nunca Prisma directamente.
// Los métodos que hacen JOIN retornan EmpleadoDetalle; los de búsqueda
// para validación interna retornan Empleado (sin datos de usuario).
export interface IEmpleadoRepository {
    listarTodos(): Promise<EmpleadoDetalle[]>;
    listarActivos(): Promise<EmpleadoDetalle[]>;
    buscarPorId(id: number): Promise<EmpleadoDetalle | null>;
    buscarPorIdUsuario(idUsuario: number): Promise<Empleado | null>;
    promover(input: PromoverEmpleadoInput): Promise<EmpleadoDetalle>;
    desactivar(id: number): Promise<void>;
}
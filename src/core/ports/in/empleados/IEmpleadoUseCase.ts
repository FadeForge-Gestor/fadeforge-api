import { EmpleadoDetalle, PromoverEmpleadoInput } from "@core/domain/empleado/empleado.entity";

// Contrato que define las operaciones disponibles de los empleados
// El controller solo conoce esta interfaz, nunca la implementación concreta
export interface IEmpleadoUseCase {
    listar(): Promise<EmpleadoDetalle[]>;
    listarActivos(): Promise<EmpleadoDetalle[]>;
    obtenerPorId(id: number): Promise<EmpleadoDetalle>;
    promover(input: PromoverEmpleadoInput): Promise<EmpleadoDetalle>;
    desactivar(id: number): Promise<void>;
    reactivar(id: number): Promise<void>;
}
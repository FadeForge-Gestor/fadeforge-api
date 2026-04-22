import { Empleado, PromoverEmpleadoInput } from "@core/domain/empleados/empleado.entity";

// Contrato que define las operaciones disponibles de los empleados
// El controller solo conoce esta interfaz, nunca la implementación concreta
export interface IEmpleadosUseCase {
    listar(): Promise<Empleado[]>;
    obtenerPorId(id: number): Promise<Empleado>;
    promover(input: PromoverEmpleadoInput): Promise<Empleado>;
    desactivar(id: number): Promise<void>;
}
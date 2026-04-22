import { id } from 'zod/locales';
import { IEmpleadoRepository } from "@core/ports/out/empleados/IEmpleadoRepository";
import { IEmpleadosUseCase } from "@core/ports/in/empleados/IEmpleadosUseCase";
import { Empleado, PromoverEmpleadoInput } from "@core/domain/empleados/empleado.entity";
import { ConflictError, NotFoundError } from "@shared/errors/HttpError";

export class EmpleadosUseCase implements IEmpleadosUseCase {

    constructor(private readonly empleadoRepository: IEmpleadoRepository) {}

    // Método para listar los empleados
    async listar(): Promise<Empleado[]> {
        return this.empleadoRepository.listarTodos();
    }

    // Método para obtener un empleado por ID
    async obtenerPorId(id: number): Promise<Empleado> {
        const empleado = await this.empleadoRepository.buscarPorId(id);
        if (!empleado) throw new NotFoundError(`Empleado con id ${id} no encontrado`);
        return empleado;
    }

    // Método para promover un usuarios a empleado
    async promover(input: PromoverEmpleadoInput): Promise<Empleado> {
        const existe = await this.empleadoRepository.buscarPorId(id);
        
    }

    // Método para desactivar un empleado
    async desactivar(id: number): Promise<void> {
        const existe = await this.empleadoRepository.buscarPorId(id);
        if (!existe) throw new NotFoundError(`Empleado con id ${id} no encontrado`);
        if (!existe.activo) throw new ConflictError(`El Empleado con id ${id} ya está desactivado`);
        return this.empleadoRepository.desactivar(id);
    }

}
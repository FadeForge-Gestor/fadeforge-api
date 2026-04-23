import { IEmpleadoRepository } from "@core/ports/out/empleados/IEmpleadoRepository";
import { IEmpleadoUseCase } from "@core/ports/in/empleados/IEmpleadoUseCase";
import { Empleado, PromoverEmpleadoInput } from "@core/domain/empleados/empleado.entity";
import { ConflictError, NotFoundError } from "@shared/errors/HttpError";
import { IUsuarioRepository } from "@core/ports/out/usuarios/IUsuarioRepository";

export class EmpleadoUseCase implements IEmpleadoUseCase {

    constructor(
        private readonly empleadoRepository: IEmpleadoRepository,
        private readonly usuarioRepository: IUsuarioRepository
    ) {}

    // Método para listar los empleados
    async listar(): Promise<Empleado[]> {
        return this.empleadoRepository.listarTodos();
    }

    // Método para listar los empleados activos
    async listarActivos(): Promise<Empleado[]> {
        return this.empleadoRepository.listarActivos();
    }

    // Método para obtener un empleado por ID
    async obtenerPorId(id: number): Promise<Empleado> {
        const empleado = await this.empleadoRepository.buscarPorId(id);
        if (!empleado) throw new NotFoundError(`Empleado con id ${id} no encontrado`);
        return empleado;
    }

    // Método para promover un usuarios a empleado
    async promover(input: PromoverEmpleadoInput): Promise<Empleado> {
        // Constante para encontrar el usuario por ID y asegurarno que ecista y este activo
        const usuario = await this.usuarioRepository.buscarPorId(input.idUsuario);
        if (!usuario) throw new NotFoundError(`Usuario con id ${input.idUsuario} no encontrado`);
        if (!usuario.activo) throw new ConflictError(`El usuario con id ${input.idUsuario} está desactivado`);

        // Nos aseguramos de encontrar el empleado y asegurarno que no sea ya empleado
        const existe = await this.empleadoRepository.buscarPorIdUsuario(input.idUsuario);
        if (existe) throw new ConflictError(`El usuario con id ${input.idUsuario} ya es empleado`);
        return this.empleadoRepository.promover(input);
    }

    // Método para desactivar un empleado
    async desactivar(id: number): Promise<void> {
        const existe = await this.empleadoRepository.buscarPorId(id);
        if (!existe) throw new NotFoundError(`Empleado con id ${id} no encontrado`);
        if (!existe.activo) throw new ConflictError(`El Empleado con id ${id} ya está desactivado`);
        return this.empleadoRepository.desactivar(id);
    }

}
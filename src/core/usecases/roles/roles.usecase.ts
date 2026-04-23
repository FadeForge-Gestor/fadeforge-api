import { IRolUseCase } from '@core/ports/in/roles/IRolUseCase';
import { IRolRepository } from '@core/ports/out/roles/IRolRepository';
import { Rol, CrearRolInput, ActualizarRolInput } from '@core/domain/rol/rol.entity';
import { NotFoundError, ConflictError } from '@shared/errors/HttpError';

export class RolesUseCase implements IRolUseCase {

    constructor(private readonly rolRepository: IRolRepository) {}

    async listar(): Promise<Rol[]> {
        return this.rolRepository.listarTodos();
    }

    async obtenerPorId(id: number): Promise<Rol> {
        const rol = await this.rolRepository.buscarPorId(id);
        if (!rol) throw new NotFoundError(`Rol con id ${id} no encontrado`);
        return rol;
    }

    async crear(input: CrearRolInput): Promise<Rol> {
        return this.rolRepository.crear(input);
    }

    async actualizar(id: number, input: ActualizarRolInput): Promise<Rol> {
        return this.rolRepository.actualizar(id, input);
    }

    async desactivar(id: number): Promise<void> {
        const existe = await this.rolRepository.buscarPorId(id);
        if (!existe) throw new NotFoundError(`Rol con id ${id} no encontrado`);
        if (!existe.activo) throw new ConflictError(`El rol con id ${id} ya está desactivado`);
        return this.rolRepository.desactivar(id);
    }
}

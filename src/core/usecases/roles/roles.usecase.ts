import { IRolUseCase } from '@core/ports/in/roles/IRolUseCase';
import { IRolRepository } from '@core/ports/out/roles/IRolRepository';
import { Rol } from '@core/domain/rol/rol.entity';
import { NotFoundError } from '@shared/errors/HttpError';

export class RolesUseCase implements IRolUseCase {

    constructor(private readonly rolRepository: IRolRepository) {}

    // Método para listar roles
    async listar(): Promise<Rol[]> {
        return this.rolRepository.listarTodos();
    }

    // Método para obtener un rol por ID
    async obtenerPorId(id: number): Promise<Rol> {
        const rol = await this.rolRepository.buscarPorId(id);
        if (!rol) throw new NotFoundError(`Rol con id ${id} no encontrado`);
        return rol;
    }
}

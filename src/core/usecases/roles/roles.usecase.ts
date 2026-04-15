import { IRolUseCase } from '@core/ports/in/roles/IRolUseCase';
import { IRolRepository } from '@core/ports/out/roles/IRolRepository';
import { Rol, CrearRolInput, ActualizarRolInput } from '@core/domain/rol/rol.entity';
import { NotFoundError, ConflictError } from '@shared/errors/HttpError';

export class RolesUseCase implements IRolUseCase {

    // El caso de uso recibe el repositorio por inyección de dependencias.
    // Nunca importa Prisma directamente — solo trabaja con la interfaz.
    constructor(private readonly rolRepository: IRolRepository) {}

    // Retorna todos los roles sin filtrar por activo,
    // para que el admin pueda ver también los desactivados.
    async listar(): Promise<Rol[]> {
        return this.rolRepository.listarTodos();
    }

    // Si el rol no existe lanzamos NotFoundError.
    // El error handler global lo convierte en HTTP 404 automáticamente.
    async obtenerPorId(id: number): Promise<Rol> {
        const rol = await this.rolRepository.buscarPorId(id);
        if (!rol) throw new NotFoundError(`Rol con id ${id} no encontrado`);
        return rol;
    }

    async crear(input: CrearRolInput): Promise<Rol> {
        return this.rolRepository.crear(input);
    }

    // Verificamos que el rol exista antes de actualizar.
    async actualizar(id: number, input: ActualizarRolInput): Promise<Rol> {
        const existe = await this.rolRepository.buscarPorId(id);
        if (!existe) throw new NotFoundError(`Rol con id ${id} no encontrado`);
        return this.rolRepository.actualizar(id, input);
    }

    // Soft delete: en lugar de borrar el registro, marcamos activo = false.
    // Así conservamos la integridad referencial con usuarios que ya tienen este rol.
    async eliminar(id: number): Promise<void> {
        const existe = await this.rolRepository.buscarPorId(id);
        if (!existe) throw new NotFoundError(`Rol con id ${id} no encontrado`);
        if (!existe.activo) throw new ConflictError(`El rol con id ${id} ya está desactivado`);
        return this.rolRepository.desactivar(id);
    }
}

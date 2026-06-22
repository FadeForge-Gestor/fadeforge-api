import { IRolUseCase } from '@core/ports/in/roles/IRolUseCase';
import { IRolRepository } from '@core/ports/out/roles/IRolRepository';
import { Rol, CrearRolInput, ActualizarRolInput } from '@core/domain/rol/rol.entity';
import { NotFoundError, ConflictError } from '@shared/errors/HttpError';

export class RolesUseCase implements IRolUseCase {

    constructor(private readonly rolRepository: IRolRepository) {}

    // Método para listar roles
    async listar(): Promise<Rol[]> {
        return this.rolRepository.listarTodos();
    }

    // Método para listar los roles activos
    async listarActivos(): Promise<Rol[]> {
        return this.rolRepository.listarActivos();
    }

    // Método para obtener un rol por ID
    async obtenerPorId(id: number): Promise<Rol> {
        const rol = await this.rolRepository.buscarPorId(id);
        if (!rol) throw new NotFoundError(`Rol con id ${id} no encontrado`);
        return rol;
    }

    // Método para crear un nuevo rol
    async crear(input: CrearRolInput): Promise<Rol> {

        // Si el nombre ya existe manda una excepción
        const nombreExiste = await this.rolRepository.buscarPorNombre(input.nombre);
        if (nombreExiste) throw new ConflictError(`El nombre del rol ${input.nombre} ya existe`);

        // Si la clave ya existe manda una exepción
        const claveExiste = await this.rolRepository.buscarPorClave(input.clave);
        if (claveExiste) throw new ConflictError(`La clave del rol ${input.clave} ya existe`);

        return this.rolRepository.crear(input);
    }

    // Método para actualizar un rol
    async actualizar(id: number, input: ActualizarRolInput): Promise<Rol> {

        // Validamos que de verdad exista un rol con ese id
        const existe = await this.rolRepository.buscarPorId(id);
        if (!existe) throw new NotFoundError(`Rol con id ${id} no encontrado`);

        // Validamos que el ROL no este desactivado
        if (!existe.activo) throw new ConflictError(`El ROL con id ${id} está desactivado`);

        // Validamos que el nombre del rol no exista
        if (input.nombre) {
            const nombreExiste = await this.rolRepository.buscarPorNombre(input.nombre);
            if (nombreExiste && nombreExiste.id !== id) throw new ConflictError(`El rol ${input.nombre} ya existe`);
        }

         // Validamos que la clave del ro no exista
        if (input.clave) {
            const claveExiste = await this.rolRepository.buscarPorClave(input.clave);
            if (claveExiste && claveExiste.id !== id) throw new ConflictError(`El rol ${input.clave} ya existe`);
        }

        return this.rolRepository.actualizar(id, input);
    }

    // Método para desactivar un rol
    async desactivar(id: number): Promise<void> {
        const existe = await this.rolRepository.buscarPorId(id);
        if (!existe) throw new NotFoundError(`Rol con id ${id} no encontrado`);
        if (!existe.activo) throw new ConflictError(`El rol con id ${id} ya está desactivado`);
        return this.rolRepository.desactivar(id);
    }

    async reactivar(id: number): Promise<void> {
        const existe = await this.rolRepository.buscarPorId(id);
        if (!existe) throw new NotFoundError(`Rol con id ${id} no encontrado`);
        if (existe.activo) throw new ConflictError(`El rol con id ${id} ya está activo`);
        return this.rolRepository.reactivar(id);
    }
}

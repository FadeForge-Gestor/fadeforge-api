import { ICategoriaServicioRepository } from "@core/ports/out/categoria-servicio/ICategoriaServicioRepository";
import { ICategoriaServicioUseCase } from "@core/ports/in/categoria-servicio/ICategoriaServicioUseCase";
import { ConflictError, NotFoundError } from "@shared/errors/HttpError";
import { CategoriaServicio, CrearCategoriaServicioInput, ActualizarCategoriaServicioInput } from "@core/domain/categoria-servicio/categoriaServicio.entity";


export class CategoriasServiciosUseCase implements ICategoriaServicioUseCase {

    constructor(private readonly categoriaServicioRepository: ICategoriaServicioRepository) {}

    // Método para listar las categorias de servicios
    async listar(): Promise<CategoriaServicio[]> {
        return this.categoriaServicioRepository.listarTodos();
    }

    // Método para listar las categorías de servicios activas
    async listarActivos(): Promise<CategoriaServicio[]> {
        return this.categoriaServicioRepository.listarActivos();
    }

    // Método para obtener una categoría de servicios por ID
    async obtenerPorId(id: number): Promise<CategoriaServicio> {
        const categoriaServicio = await this.categoriaServicioRepository.buscarPorId(id);
        if (!categoriaServicio) throw new NotFoundError(`Categoria del servicio con id ${id} no encontrado`);
        return categoriaServicio;
    }

    // Método para crear la categoría de un servicio
    async crear(input: CrearCategoriaServicioInput): Promise<CategoriaServicio> {
        const nombreExiste = await this.categoriaServicioRepository.buscarPorNombre(input.nombre);
        if (nombreExiste) throw new ConflictError(`La categoría ${input.nombre} ya existe`);
        return this.categoriaServicioRepository.crear(input)
    }

    // Método para actualizar la categoria de un servicio
    async actualizar(id: number, input: ActualizarCategoriaServicioInput): Promise<CategoriaServicio> {
        const existe = await this.categoriaServicioRepository.buscarPorId(id);
        if (!existe) throw new NotFoundError(`Categoria del servicio con id ${id} no encontrado`);
        if (input.nombre) {
            const nombreExiste = await this.categoriaServicioRepository.buscarPorNombre(input.nombre);
            if (nombreExiste && nombreExiste.id !== id) throw new ConflictError(`La categoría ${input.nombre} ya existe`);
        }
        if (!existe.activo) throw new ConflictError(`La categoría con id ${id} está desactivada`);
        return this.categoriaServicioRepository.actualizar(id, input);
    }

    // Método para desactivar una categoria de servicio
    async desactivar(id: number): Promise<void> {
        const existe = await this.categoriaServicioRepository.buscarPorId(id);
        if (!existe) throw new NotFoundError(`Categoria del servicio con id ${id} no encontrado`);
        if (!existe.activo) throw new ConflictError(`La categoria del servicio con el id ${id} ya está desactivado`);
        return this.categoriaServicioRepository.desactivar(id);
    }

}
import { IServicioRepository } from "@core/ports/out/servicios/IServicioRepository";
import { ICategoriaServicioRepository } from "@core/ports/out/categoria-servicio/ICategoriaServicioRepository";
import { IServicioUseCase } from "@core/ports/in/servicios/IServicioUseCase";
import { ConflictError, NotFoundError } from "@shared/errors/HttpError";
import { Servicio, CrearServicioInput, ActualizarServicioInput } from "@core/domain/servicio/servicio.entity";

export class ServiciosUseCase implements IServicioUseCase {

    constructor(
        private readonly servicioRepository: IServicioRepository,
        private readonly categoriaRepository: ICategoriaServicioRepository
    ) {}

    // Método para listar los servicios
    async listar(): Promise<Servicio[]> {
        return this.servicioRepository.listarTodos();
    }
    
    // Método para listar los servicios activas
    async listarActivos(): Promise<Servicio[]> {
        return this.servicioRepository.listarActivos();
    }
    
    // Método para obtener un servicio por ID
    async obtenerPorId(id: number): Promise<Servicio> {
        const categoriaServicio = await this.servicioRepository.buscarPorId(id);
        if (!categoriaServicio) throw new NotFoundError(`Servicio con id ${id} no encontrado`);
        return categoriaServicio;
    }

    // Método para crear un nuevo servicio
    async crear(input: CrearServicioInput): Promise<Servicio> {

        // Nos aseguramos que la categoría exista y este activa
        const categoria = await this.categoriaRepository.buscarPorId(input.idCategoria);
        if (!categoria) throw new NotFoundError(`Categoría con id ${input.idCategoria} no encontrada`);
        if (!categoria.activo) throw new ConflictError(`La categoría con id ${input.idCategoria} está desactivada`);

        // Nos aseguramos que el servicio exista
        const nombreExiste = await this.servicioRepository.buscarPorNombre(input.nombre);
        if (nombreExiste) throw new ConflictError(`El servicio ${input.nombre} ya existe`);
        return this.servicioRepository.crear(input);
    }

}

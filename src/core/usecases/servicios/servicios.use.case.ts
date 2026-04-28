import { IServicioRepository } from "@core/ports/out/servicios/IServicioRepository";
import { ICategoriaServicioRepository } from "@core/ports/out/categoria-servicio/ICategoriaServicioRepository";
import { IServicioUseCase } from "@core/ports/in/servicios/IServicioUseCase";
import { ConflictError, NotFoundError } from "@shared/errors/HttpError";
import { Servicio, CrearServicioInput, ActualizarServicioInput } from "@core/domain/servicio/servicio.entity";

export class ServiciosUseCase implements IServicioRepository {

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
    
    // Método para obtener una categoría de servicios por ID
    async obtenerPorId(id: number): Promise<Servicio> {
        const categoriaServicio = await this.servicioRepository.buscarPorId(id);
        if (!categoriaServicio) throw new NotFoundError(`Servicio con id ${id} no encontrado`);
        return categoriaServicio;
    }

}

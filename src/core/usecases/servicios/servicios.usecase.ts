import { IServicioRepository } from "@core/ports/out/servicios/IServicioRepository";
import { ICategoriaServicioRepository } from "@core/ports/out/categoria-servicio/ICategoriaServicioRepository";
import { IStoragePort, ArchivoInput } from "@core/ports/out/storage/IStoragePort";
import { IServicioUseCase } from "@core/ports/in/servicios/IServicioUseCase";
import { ConflictError, NotFoundError } from "@shared/errors/HttpError";
import { Servicio, CrearServicioInput, ActualizarServicioInput } from "@core/domain/servicio/servicio.entity";

export class ServiciosUseCase implements IServicioUseCase {

    constructor(
        private readonly servicioRepository: IServicioRepository,
        private readonly categoriaRepository: ICategoriaServicioRepository,
        private readonly storagePort: IStoragePort
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

        const categoria = await this.categoriaRepository.buscarPorId(input.idCategoria);
        if (!categoria) throw new NotFoundError(`Categoría con id ${input.idCategoria} no encontrada`);
        if (!categoria.activo) throw new ConflictError(`La categoría con id ${input.idCategoria} está desactivada`);

        const nombreExiste = await this.servicioRepository.buscarPorNombre(input.nombre);
        if (nombreExiste) throw new ConflictError(`El servicio ${input.nombre} ya existe`);

        return this.servicioRepository.crear(input);
    }

    // Método para actualizar un servicio
    async actualizar(id: number, input: ActualizarServicioInput): Promise<Servicio> {
        const servicio = await this.servicioRepository.buscarPorId(id);
        if (!servicio) throw new NotFoundError(`Servicio con id ${id} no encontrado`);
        if (!servicio.activo) throw new ConflictError(`El servicio con id ${id} está desactivado`);

        if (input.idCategoria) {
            const categoria = await this.categoriaRepository.buscarPorId(input.idCategoria);
            if (!categoria) throw new NotFoundError(`Categoría con id ${input.idCategoria} no encontrada`);
            if (!categoria.activo) throw new ConflictError(`La categoría con id ${input.idCategoria} está desactivada`);
        }

        if (input.nombre) {
            const nombreExiste = await this.servicioRepository.buscarPorNombre(input.nombre);
            if (nombreExiste && nombreExiste.id !== id) throw new ConflictError(`El servicio ${input.nombre} ya existe`);
        }

        return this.servicioRepository.actualizar(id, input);
    }

    // Método para subir la imagen de un servicio
    async subirImagen(id: number, archivo: ArchivoInput): Promise<Servicio> {
        const servicio = await this.servicioRepository.buscarPorId(id);
        if (!servicio) throw new NotFoundError(`Servicio con id ${id} no encontrado`);
        if (!servicio.activo) throw new ConflictError(`El servicio con id ${id} está desactivado`);
        if (servicio.idImagen !== null) throw new ConflictError('El servicio ya tiene una imagen, usá actualizar para reemplazarla');

        const imagen = await this.storagePort.subir(archivo);
        return this.servicioRepository.actualizar(id, { imagenUrl: imagen.url, idImagen: imagen.publicId, nombreImagen: imagen.nombre });
    }

    // Método para actualizar la imagen de un servicio
    async actualizarImagen(id: number, archivo: ArchivoInput): Promise<Servicio> {
        const servicio = await this.servicioRepository.buscarPorId(id);
        if (!servicio) throw new NotFoundError(`Servicio con id ${id} no encontrado`);
        if (!servicio.activo) throw new ConflictError(`El servicio con id ${id} está desactivado`);
        if (!servicio.idImagen) throw new NotFoundError('El servicio no tiene imagen');

        await this.storagePort.eliminar(servicio.idImagen);
        const imagen = await this.storagePort.subir(archivo);
        return this.servicioRepository.actualizar(id, { imagenUrl: imagen.url, idImagen: imagen.publicId, nombreImagen: imagen.nombre });
    }

    // Método para eliminar la imagen de un servicio
    async eliminarImagen(id: number): Promise<void> {
        const servicio = await this.servicioRepository.buscarPorId(id);
        if (!servicio) throw new NotFoundError(`Servicio con id ${id} no encontrado`);
        if (!servicio.idImagen) throw new NotFoundError('El servicio no tiene imagen');

        await this.storagePort.eliminar(servicio.idImagen);
        await this.servicioRepository.actualizar(id, { imagenUrl: null, idImagen: null, nombreImagen: null });
    }


    // Método para reactivar un servicio
    async reactivar(id: number): Promise<void> {
        const existe = await this.servicioRepository.buscarPorId(id);
        if (!existe) throw new NotFoundError(`Servicio con id ${id} no encontrado`);
        if (existe.activo) throw new ConflictError(`Servicio con el id ${id} ya está activo`);
        return this.servicioRepository.reactivar(id);
    }

    // Método para desactivar un servicio
    async desactivar(id: number): Promise<void> {
        const existe = await this.servicioRepository.buscarPorId(id);
        if (!existe) throw new NotFoundError(`Servicio con id ${id} no encontrado`);
        if (!existe.activo) throw new ConflictError(`Servicio con el id ${id} ya está desactivado`);
        return this.servicioRepository.desactivar(id);
    }

}

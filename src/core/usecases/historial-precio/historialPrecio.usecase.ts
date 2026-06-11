import { IHistorialPrecioRepository } from "@core/ports/out/historial-precio/IHistorialPrecioRepository";
import { IHistorialPrecioUseCase } from "@core/ports/in/historial-precio/IHistorialPrecioUseCase";
import { BadRequestError } from "@shared/errors/HttpError";
import { HistorialPrecio, CrearHistorialPrecioInput } from "@core/domain/historial-precio/historialPrecio.entity";

export class HistorialPrecioUseCase implements IHistorialPrecioUseCase {

    constructor(private readonly historialPrecioRepository: IHistorialPrecioRepository) {}

    // Método para listar todos los precios de un servicio
    async listarPorServicio(idServicio: number): Promise<HistorialPrecio[]> {
        return this.historialPrecioRepository.listarPorServicio(idServicio);
    }

    // Método para obtener el precio actual de un servicio (el que tiene fecha_fin null)
    async obtenerPrecioActual(idServicio: number): Promise<number | null> {
        return this.historialPrecioRepository.buscarPrecioActual(idServicio);
    }

    // Método para registrar un nuevo precio para un servicio.
    // Valida que el precio sea positivo, cierra el precio anterior y crea el nuevo.
    async registrarPrecio(input: CrearHistorialPrecioInput): Promise<HistorialPrecio> {
        if (input.precio <= 0) throw new BadRequestError('El precio debe ser mayor a 0');
        await this.historialPrecioRepository.cerrarPrecioActual(input.idServicio);
        return this.historialPrecioRepository.crear(input);
    }

}

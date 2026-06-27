import { Servicio, CrearServicioInput, ActualizarServicioInput } from "@core/domain/servicio/servicio.entity";
import { ArchivoInput } from "@core/ports/out/storage/IStoragePort";

// Contrato que define las operaciones disponibles sobre los Servicios.
// El controller solo conoce esta interfaz, nunca la implementación concreta.
export interface IServicioUseCase {
    listar(): Promise<Servicio[]>;
    listarActivos(): Promise<Servicio[]>;
    obtenerPorId(id: number): Promise<Servicio>;
    crear(input: CrearServicioInput): Promise<Servicio>;
    actualizar(id: number, input: ActualizarServicioInput): Promise<Servicio>;
    desactivar(id: number): Promise<void>;
    reactivar(id: number): Promise<void>;
    subirImagen(id: number, archivo: ArchivoInput): Promise<Servicio>;
    actualizarImagen(id: number, archivo: ArchivoInput): Promise<Servicio>;
    eliminarImagen(id: number): Promise<void>;
}
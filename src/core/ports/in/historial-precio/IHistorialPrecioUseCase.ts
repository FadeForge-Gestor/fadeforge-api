import { HistorialPrecio, CrearHistorialPrecioInput } from "@core/domain/historial-precio/historialPrecio.entity";

// Contrato que define las operaciones disponibles sobre el historial de precios.
// El controller solo conoce esta interfaz, nunca la implementación concreta.
export interface IHistorialPrecioUseCase {
    listarPorServicio(idServicio: number): Promise<HistorialPrecio[]>;
    obtenerPrecioActual(idServicio: number): Promise<number | null>;
    registrarPrecio(input: CrearHistorialPrecioInput): Promise<HistorialPrecio>;
}

import { HistorialPrecio, CrearHistorialPrecioInput } from "@core/domain/historial-precio/historialPrecio.entity";

// Contrato que define las operaciones disponibles sobre el historial de precios.
// El caso de uso solo conoce esta interfaz, nunca Prisma directamente.
export interface IHistorialPrecioRepository {
    listarPorServicio(idServicio: number): Promise<HistorialPrecio[]>;
    buscarPrecioActual(idServicio: number): Promise<number | null>;
    cerrarPrecioActual(idServicio: number): Promise<void>;
    crear(input: CrearHistorialPrecioInput): Promise<HistorialPrecio>;
    reemplazarPrecio(input: CrearHistorialPrecioInput): Promise<HistorialPrecio>;
}

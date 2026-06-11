import { IHistorialPrecioRepository } from "@core/ports/out/historial-precio/IHistorialPrecioRepository";
import { HistorialPrecio, CrearHistorialPrecioInput } from "@core/domain/historial-precio/historialPrecio.entity";
import { prisma } from "../prisma.client";

export class HistorialPrecioPrismaRepository implements IHistorialPrecioRepository {

    private mapear(historial: {
        id: number;
        id_servicio: number;
        precio: { toNumber(): number };
        fecha_inicio: Date;
        fecha_fin: Date | null;
    }): HistorialPrecio {
        return {
            id: historial.id,
            idServicio: historial.id_servicio,
            precio: historial.precio.toNumber(),
            fechaInicio: historial.fecha_inicio,
            fechaFin: historial.fecha_fin,
        };
    }

    // Método para listar todos los precios de un servicio ordenados por fecha de inicio descendente
    async listarPorServicio(idServicio: number): Promise<HistorialPrecio[]> {
        const registros = await prisma.historial_precios.findMany({
            where: { id_servicio: idServicio },
            orderBy: { fecha_inicio: 'desc' },
        });
        return registros.map(r => this.mapear(r));
    }

    // Método para obtener el precio vigente (fecha_fin null) de un servicio
    async buscarPrecioActual(idServicio: number): Promise<number | null> {
        const historial = await prisma.historial_precios.findFirst({
            where: { id_servicio: idServicio, fecha_fin: null },
            orderBy: { fecha_inicio: 'desc' },
        });
        if (!historial) return null;
        return historial.precio.toNumber();
    }

    // Método para cerrar el precio vigente de un servicio (setear fecha_fin al momento actual)
    async cerrarPrecioActual(idServicio: number): Promise<void> {
        await prisma.historial_precios.updateMany({
            where: { id_servicio: idServicio, fecha_fin: null },
            data: { fecha_fin: new Date() },
        });
    }

    // Método para crear un nuevo registro de precio para un servicio
    async crear(input: CrearHistorialPrecioInput): Promise<HistorialPrecio> {
        const historial = await prisma.historial_precios.create({
            data: {
                id_servicio: input.idServicio,
                precio: input.precio,
            },
        });
        return this.mapear(historial);
    }

}

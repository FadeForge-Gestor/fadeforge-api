import { IDetalleCitaRepository } from "@core/ports/out/detalle-cita/IDetalleCitaRepository";
import { DetalleCita } from "@core/domain/detalle-cita/detalleCita.entity";
import { prisma } from "../prisma.client";

export class DetalleCitaPrismaRepository implements IDetalleCitaRepository {

    private mapear(d: {
        id: number;
        id_cita: number;
        id_servicio: number;
        precio_aplicado: { toNumber(): number };
        duracion_minutos: number;
    }): DetalleCita {
        return {
            id: d.id,
            idCita: d.id_cita,
            idServicio: d.id_servicio,
            precioAplicado: d.precio_aplicado.toNumber(),
            duracionMinutos: d.duracion_minutos,
        };
    }

    // Método para listar los detalles de una cita específica, ordenados por ID de forma ascendente
    async listarPorCita(idCita: number): Promise<DetalleCita[]> {
        const detalles = await prisma.detalle_cita.findMany({
            where: { id_cita: idCita },
            orderBy: { id: 'asc' },
        });
        return detalles.map(d => this.mapear(d));
    }

}

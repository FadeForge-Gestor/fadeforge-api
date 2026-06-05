import { DetalleCita } from "@core/domain/detalle-cita/detalleCita.entity";

export interface IDetalleCitaRepository {
    listarPorCita(idCita: number): Promise<DetalleCita[]>;
}

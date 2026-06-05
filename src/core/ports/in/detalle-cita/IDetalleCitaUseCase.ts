import { DetalleCita } from "@core/domain/detalle-cita/detalleCita.entity";

export interface IDetalleCitaUseCase {
    listarPorCita(idCita: number): Promise<DetalleCita[]>;
}

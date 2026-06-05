import { IDetalleCitaRepository } from "@core/ports/out/detalle-cita/IDetalleCitaRepository";
import { IDetalleCitaUseCase } from "@core/ports/in/detalle-cita/IDetalleCitaUseCase";
import { DetalleCita } from "@core/domain/detalle-cita/detalleCita.entity";

export class DetalleCitaUseCase implements IDetalleCitaUseCase {

    constructor(
        private readonly detalleCitaRepository: IDetalleCitaRepository
    ) {}

    async listarPorCita(idCita: number): Promise<DetalleCita[]> {
        return this.detalleCitaRepository.listarPorCita(idCita);
    }

}

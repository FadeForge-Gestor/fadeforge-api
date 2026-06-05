import { Request, Response, NextFunction } from 'express';
import { IDetalleCitaUseCase } from '@core/ports/in/detalle-cita/IDetalleCitaUseCase';
import { ListarPorCitaSchema } from './detalleCita.schema';
import { ok } from '@shared/utils/response';

export class DetalleCitaController {

    constructor(private readonly detalleCitaUseCase: IDetalleCitaUseCase) {}

    async listarPorCita(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { idCita } = ListarPorCitaSchema.parse(req.params);
            const detalles = await this.detalleCitaUseCase.listarPorCita(idCita);
            res.status(200).json(ok(detalles));
        } catch (error) {
            next(error);
        }
    }

}

import { Router } from 'express';
import { DetalleCitaController } from './detalleCita.controller';
import { DetalleCitaUseCase } from '@core/usecases/detalle-cita/detalleCita.usecase';
import { DetalleCitaPrismaRepository } from '@adapters/out/db/detalle-cita/detalleCita.prisma.repository';
import { authenticate } from '@middlewares/auth.middleware';

const router = Router();
const repositorio = new DetalleCitaPrismaRepository();
const casoDeUso = new DetalleCitaUseCase(repositorio);
const controller = new DetalleCitaController(casoDeUso);

// GET /detalle-cita/cita/:idCita
router.get(
    '/cita/:idCita',
    authenticate,
    (req, res, next) => controller.listarPorCita(req, res, next)
);

export default router;

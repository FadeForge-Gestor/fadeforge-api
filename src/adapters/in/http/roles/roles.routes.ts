import { Router } from 'express';
import { RolesController } from './roles.controller';
import { RolesUseCase } from '@core/usecases/roles/roles.usecase';
import { RolesPrismaRepository } from '@adapters/out/db/roles/roles.prisma.repository';
import { validateParams } from '@middlewares/validate.middleware';
import { idParamSchema } from './roles.schema';
import { authenticate, authorize } from '@middlewares/auth.middleware';
import { ROLES } from '@shared/constants/roles';

// Inyección de dependencias
const router = Router();
const repositorio = new RolesPrismaRepository();
const casoDeUso = new RolesUseCase(repositorio);
const controller = new RolesController(casoDeUso);

// Roles fijos (admin, empleado, cliente), sembrados por prisma/seed.ts.
// Este módulo es de solo lectura: no tiene sentido crear, actualizar ni dar de baja roles vía API.

// GET /roles — solo admins
router.get(
    '/',
    authenticate, authorize(ROLES.ADMIN),
    (req, res, next) => controller.listar(req, res, next)
);

// GET /roles/:id — solo admins
router.get(
    '/:id',
    authenticate, authorize(ROLES.ADMIN),
    validateParams(idParamSchema),
    (req, res, next) => controller.obtenerPorId(req, res, next)
);

export default router;

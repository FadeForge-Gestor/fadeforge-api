import { Router } from 'express';
import { RolesController } from './roles.controller';
import { RolesUseCase } from '@core/usecases/roles/roles.usecase';
import { RolesPrismaRepository } from '@adapters/out/db/roles/roles.prisma.repository';
import { validate } from '@middlewares/validate.middleware';
import { authenticate, authorize } from '@middlewares/auth.middleware';
import { crearRolSchema, actualizarRolSchema } from './roles.schema';

// Inyección de dependencias — el orden importa:
// repositorio → caso de uso → controller
const router = Router();
const repositorio = new RolesPrismaRepository();
const casoDeUso = new RolesUseCase(repositorio);
const controller = new RolesController(casoDeUso);

// GET /roles — solo usuarios autenticados pueden listar roles
router.get(
    '/',
    authenticate,
    (req, res, next) => controller.listar(req, res, next)
);

// GET /roles/:id — solo usuarios autenticados
router.get(
    '/:id',
    authenticate,
    (req, res, next) => controller.obtenerPorId(req, res, next)
);

// POST /roles — solo admins pueden crear roles
router.post(
    '/',
    authenticate,
    authorize('admin'),
    validate(crearRolSchema),
    (req, res, next) => controller.crear(req, res, next)
);

// PUT /roles/:id — solo admins pueden actualizar roles
router.put(
    '/:id',
    authenticate,
    authorize('admin'),
    validate(actualizarRolSchema),
    (req, res, next) => controller.actualizar(req, res, next)
);

// DELETE /roles/:id — solo admins pueden desactivar roles
router.delete(
    '/:id',
    authenticate,
    authorize('admin'),
    (req, res, next) => controller.eliminar(req, res, next)
);

export default router;

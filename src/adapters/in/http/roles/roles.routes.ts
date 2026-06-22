import { Router } from 'express';
import { RolesController } from './roles.controller';
import { RolesUseCase } from '@core/usecases/roles/roles.usecase';
import { RolesPrismaRepository } from '@adapters/out/db/roles/roles.prisma.repository';
import { validate, validateParams } from '@middlewares/validate.middleware';
import { crearRolSchema, actualizarRolSchema, idParamSchema } from './roles.schema';

// Inyección de dependencias
const router = Router();
const repositorio = new RolesPrismaRepository();
const casoDeUso = new RolesUseCase(repositorio);
const controller = new RolesController(casoDeUso);

// GET /roles — solo admins
router.get(
    '/',
    (req, res, next) => controller.listar(req, res, next)
);

// GET / rolesActivos - solo admins
router.get(
    '/activos',
    (req, res, next) => controller.listarActivos(req, res, next)
)

// GET /roles/:id — solo admins
router.get(
    '/:id',
    validateParams(idParamSchema),
    (req, res, next) => controller.obtenerPorId(req, res, next)
);

// POST /roles — solo admins pueden crear roles
router.post(
    '/',
    validate(crearRolSchema),
    (req, res, next) => controller.crear(req, res, next)
);

// PUT /roles/:id/reactivar — solo admins pueden reactivar roles
router.put(
    '/:id/reactivar',
    validateParams(idParamSchema),
    (req, res, next) => controller.reactivar(req, res, next)
);

// PUT /roles/:id/desactivar — solo admins pueden desactivar roles
router.put(
    '/:id/desactivar',
    validateParams(idParamSchema),
    (req, res, next) => controller.desactivar(req, res, next)
);

// PUT /roles/:id — solo admins pueden actualizar roles
router.put(
    '/:id',
    validateParams(idParamSchema),
    validate(actualizarRolSchema),
    (req, res, next) => controller.actualizar(req, res, next)
);

export default router;

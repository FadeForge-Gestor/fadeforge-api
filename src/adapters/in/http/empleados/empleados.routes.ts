import { Router } from "express";
import { EmpleadosController } from "./empleados.controller";
import { EmpleadosUseCase } from "@core/usecases/empleados/empleados.usecase";
import { UsuariosPrismaRepository } from "@adapters/out/db/usuarios/usuarios.prisma.repository";
import { EmpleadosPrismaRepository } from "@adapters/out/db/empleados/empleados.prisma.repository";
import { RolesPrismaRepository } from "@adapters/out/db/roles/roles.prisma.repository";
import { validate } from "@middlewares/validate.middleware";
import { authenticate, authorize } from "@middlewares/auth.middleware";
import { idempotency } from "@middlewares/idempotency.middleware";
import { IdempotencyMemoryRepository } from "@adapters/out/memory/idempotency/idempotency.memory.repository";
import { promoverEmpleadoSchema } from "./empleados.schema";
import { ROLES } from "@shared/constants/roles";

const router = Router();
const repositorio = new EmpleadosPrismaRepository();
const usuarioRepositorio = new UsuariosPrismaRepository();
const rolRepositorio = new RolesPrismaRepository();
const idempotencyRepo = new IdempotencyMemoryRepository();
const casoDeUso = new EmpleadosUseCase(repositorio, usuarioRepositorio, rolRepositorio);
const controller = new EmpleadosController(casoDeUso);

router.get(
    '/',
    authenticate, authorize(ROLES.ADMIN),
    (req, res, next) => controller.listar(req, res, next)
);

router.get(
    '/activos',
    authenticate, authorize(ROLES.ADMIN),
    (req, res, next) => controller.listarActivos(req, res, next)
);

router.get(
    '/:id',
    authenticate, authorize(ROLES.ADMIN),
    (req, res, next) => controller.obtenerPorId(req, res, next)
);

router.post(
    '/',
    authenticate, authorize(ROLES.ADMIN),
    idempotency(idempotencyRepo),
    validate(promoverEmpleadoSchema),
    (req, res, next) => controller.promover(req, res, next)
);

router.put(
    '/:id/desactivar',
    authenticate, authorize(ROLES.ADMIN),
    (req, res, next) => controller.desactivar(req, res, next)
);

router.put(
    '/:id/reactivar',
    authenticate, authorize(ROLES.ADMIN),
    (req, res, next) => controller.reactivar(req, res, next)
);

export default router;

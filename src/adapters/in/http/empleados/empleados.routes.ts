import { Router } from "express";
import { EmpleadosController } from "./empleados.controller";
import { EmpleadosUseCase } from "@core/usecases/empleados/empleados.usecase";
import { UsuariosPrismaRepository } from "@adapters/out/db/usuarios/usuarios.prisma.repository";
import { EmpleadosPrismaRepository } from "@adapters/out/db/empleados/empleados.prisma.repository";
import { validate } from "@middlewares/validate.middleware";
import { idempotency } from "@middlewares/idempotency.middleware";
import { IdempotencyMemoryRepository } from "@adapters/out/memory/idempotency/idempotency.memory.repository";
import { promoverEmpleadoSchema } from "./empleados.schema";

// Inyección de dependencias — el orden importa:
// repositorio → caso de uso → controller
const router = Router();
const repositorio = new EmpleadosPrismaRepository();
const usuarioRepositorio = new UsuariosPrismaRepository();
const idempotencyRepo = new IdempotencyMemoryRepository();
const casoDeUso = new EmpleadosUseCase(repositorio, usuarioRepositorio);
const controller = new EmpleadosController(casoDeUso);

// GET /empleados - solo admins
router.get(
    '/',
    (req, res, next) => controller.listar(req, res, next)
);

// GET /empleadosActivos - solo admins
router.get(
    '/activos',
    (req, res, next) => controller.listarActivos(req, res, next)
);

// GET /empleados/:id — solo admins
router.get(
    '/:id',
    (req, res, next) => controller.obtenerPorId(req, res, next)
);

// POST /empleados — solo admins pueden promover empleados
router.post(
    '/',
    idempotency(idempotencyRepo),
    validate(promoverEmpleadoSchema),
    (req, res, next) => controller.promover(req, res, next)
);

// PUT /empleados/:id — solo admins pueden desactivar usuarios
router.put(
    '/:id/desactivar',
    (req, res, next) => controller.desactivar(req, res, next)
);

// PUT /empleados/:id/reactivar — solo admins pueden reactivar empleados
router.put(
    '/:id/reactivar',
    (req, res, next) => controller.reactivar(req, res, next)
);

export default router;

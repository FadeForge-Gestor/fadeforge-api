import { Router } from "express";
import { EmpleadosController } from "./empleados.controller";
import { EmpleadosUseCase } from "@core/usecases/empleados/empleados.usecase";
import { UsuariosPrismaRepository } from "@adapters/out/db/usuarios/usuarios.prisma.repository";
import { EmpleadosPrismaRepository } from "@adapters/out/db/empleados/empleados.prisma.repository";
import { validate } from "@middlewares/validate.middleware";
import { authenticate, authorize } from "@middlewares/auth.middleware";
import { promoverEmpleadoSchema } from "./empleados.schema";
import { ROLES } from "@shared/constants/roles";

// Inyección de dependencias — el orden importa:
// repositorio → caso de uso → controller
const router = Router();
const repositorio = new EmpleadosPrismaRepository();
const usuarioRepositorio = new UsuariosPrismaRepository();
const casoDeUso = new EmpleadosUseCase(repositorio, usuarioRepositorio);
const controller = new EmpleadosController(casoDeUso);

// GET /empleados - solo admins
router.get(
    '/',
    authenticate,
    authorize(ROLES.ADMIN),
    (req, res, next) => controller.listar(req, res, next)
);

// GET /empleadosActivos - solo admins
router.get(
    '/activos',
    authenticate,
    authorize(ROLES.ADMIN),
    (req, res, next) => controller.listarActivos(req, res, next)
);

// GET /empleados/:id — solo admins
router.get(
    '/:id',
    authenticate,
    authorize(ROLES.ADMIN),
    (req, res, next) => controller.obtenerPorId(req, res, next)
);

// POST /empleados — solo admins pueden promover empleados
router.post(
    '/',
    authenticate,
    authorize(ROLES.ADMIN),
    validate(promoverEmpleadoSchema),
    (req, res, next) => controller.promover(req, res, next)
);

// PUT /empleados/:id — solo admins pueden desactivar usuarios
router.put(
    '/:id/desactivar',
    authenticate,
    authorize(ROLES.ADMIN),
    (req, res, next) => controller.desactivar(req, res, next)
);

export default router;
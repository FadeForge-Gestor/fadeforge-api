import { Router } from "express";
import { UsuariosController } from "./usuarios.controller";
import { UsuariosUseCase } from "@core/usecases/usuarios/usuarios.usecase";
import { UsuariosPrismaRepository } from "@adapters/out/db/usuarios/usuarios.prisma.repository";
import { RolesPrismaRepository } from "@adapters/out/db/roles/roles.prisma.repository";
import { validate } from "@middlewares/validate.middleware";
import { crearUsuarioSchema, actualizarUsuarioSchema } from "./usuarios.schema";

// Inyección de dependencias
const router = Router();
const repositorio = new UsuariosPrismaRepository();
const rolRepositorio = new RolesPrismaRepository();
const casoDeUso = new UsuariosUseCase(repositorio, rolRepositorio);
const controller = new UsuariosController(casoDeUso);

// GET /usuarios — solo admins
router.get(
    '/',
    (req, res, next) => controller.listar(req, res, next)
);

// GET /usuarios/:id — solo admins
router.get(
    '/:id',
    (req, res, next) => controller.obtenerPorId(req, res, next)
);

// POST /usuarios — solo admins pueden crear usuarios
router.post(
    '/',
    validate(crearUsuarioSchema),
    (req, res, next) => controller.crear(req, res, next)
);

// PUT /usuarios/:id — solo admins pueden actualizar usuarios
router.put(
    '/:id',
    validate(actualizarUsuarioSchema),
    (req, res, next) => controller.actualizar(req, res, next)
);

// PUT /usuarios/:id/desactivar — solo admins pueden desactivar usuarios
router.put(
    '/:id/desactivar',
    (req, res, next) => controller.desactivar(req, res, next)
);

export default router;

import { Router } from "express";
import { CredencialesController } from "./credenciales.controller";
import { CredencialUseCase } from "@core/usecases/credenciales/credenciales.usecase";
import { CredencialesPrismaRepository } from "@adapters/out/db/credenciales/credenciales.prisma.repository";
import { UsuariosPrismaRepository } from "@adapters/out/db/usuarios/usuarios.prisma.repository";
import { RolesPrismaRepository } from "@adapters/out/db/roles/roles.prisma.repository";
import { validate } from "@middlewares/validate.middleware";
import { authenticate, authorize } from "@middlewares/auth.middleware";
import { cambiarContrasenaSchema, cambiarCorreoSchema, resetContrasenaSchema } from "./credenciales.schema";
import { ROLES } from "@shared/constants/roles";

// Inyección de dependencias
const router = Router();
const repositorio = new CredencialesPrismaRepository();
const usuarioRepositorio = new UsuariosPrismaRepository();
const rolRepositorio = new RolesPrismaRepository();
const casoDeUso = new CredencialUseCase(repositorio, usuarioRepositorio, rolRepositorio);
const controller = new CredencialesController(casoDeUso);

// PUT /credenciales/contrasena — el propio usuario cambia su contraseña
router.put(
    '/contrasena',
    authenticate,
    validate(cambiarContrasenaSchema),
    (req, res, next) => controller.cambiarContrasena(req, res, next)
);

// PUT /credenciales/correo — el propio usuario cambia su correo
router.put(
    '/correo',
    authenticate,
    validate(cambiarCorreoSchema),
    (req, res, next) => controller.cambiarCorreo(req, res, next)
);

// PUT /credenciales/:id/reset — solo admin puede resetear la contraseña de un usuario
router.put(
    '/:id/reset',
    authenticate,
    authorize(ROLES.ADMIN),
    validate(resetContrasenaSchema),
    (req, res, next) => controller.resetContrasena(req, res, next)
);

export default router;
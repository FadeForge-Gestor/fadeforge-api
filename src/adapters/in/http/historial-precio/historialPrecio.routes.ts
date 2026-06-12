import { Router } from "express";
import { HistorialPrecioController } from "./historialPrecio.controller";
import { HistorialPrecioUseCase } from "@core/usecases/historial-precio/historialPrecio.usecase";
import { HistorialPrecioPrismaRepository } from "@adapters/out/db/historial-precio/historialPrecio.prisma.repository";
import { validate } from "@middlewares/validate.middleware";
import { authenticate, authorize } from "@middlewares/auth.middleware";
import { RegistrarPrecioSchema } from "./historialPrecio.schema";
import { ROLES } from "@shared/constants/roles";

// Inyección de dependencias 
const router = Router();
const repositorio = new HistorialPrecioPrismaRepository();
const casoDeUso = new HistorialPrecioUseCase(repositorio);
const controller = new HistorialPrecioController(casoDeUso);

// GET /historial-precios/:idServicio — lista todo el historial de precios del servicio
router.get(
    '/:idServicio',
    (req, res, next) => controller.listarPorServicio(req, res, next)
);

// GET /historial-precios/:idServicio/actual — obtiene el precio vigente del servicio
router.get(
    '/:idServicio/actual',
    (req, res, next) => controller.obtenerPrecioActual(req, res, next)
);

// POST /historial-precios — registra un nuevo precio para un servicio (solo admins)
router.post(
    '/',
    authenticate,
    authorize(ROLES.ADMIN),
    validate(RegistrarPrecioSchema),
    (req, res, next) => controller.registrarPrecio(req, res, next)
);

export default router;

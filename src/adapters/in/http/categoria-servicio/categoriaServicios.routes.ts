import { Router } from "express";
import { CategoriaServiciosController } from "./categoriaServicios.controller";
import { CategoriasServiciosUseCase } from "@core/usecases/categorias-servicios/categoriaServicios.usecase";
import { CategoriaServicioPrismaRepository } from "@adapters/out/db/categorias-servicios/categoriaServicios.prisma.repository";
import { validate } from "@middlewares/validate.middleware";
import { authenticate, authorize } from "@middlewares/auth.middleware";
import { CrearCategoriaServicioSchema, ActualizarCategoriaServicioSchema } from "./categoriaServicios.schema";
import { ROLES } from "@shared/constants/roles";

// Inyección de dependencias
const router = Router();
const repositorio = new CategoriaServicioPrismaRepository();
const casoDeUso = new CategoriasServiciosUseCase(repositorio);
const controller = new CategoriaServiciosController(casoDeUso);

// GET /categoriaServicios
router.get(
    '/',
    (req, res, next) => controller.listar(req, res, next)
);

// GET / categoriaServiciosActivos
router.get(
    '/activos',
    (req, res, next) => controller.listarActivos(req, res, next)
);

// GET / CategoriaServicio /:id
router.get(
    '/:id',
    (req, res, next) => controller.obtenerPorId(req, res, next)
);

// POST /CategoriaServicio — solo admins pueden crear una nueva categoría de servicio
router.post(
    '/',
    authenticate,
    authorize(ROLES.ADMIN),
    validate(CrearCategoriaServicioSchema),
    (req, res, next) => controller.crear(req, res, next)
);

// PUT /CategoriaServicio/:id — solo admins pueden actualizar una categoría de servicio
router.put(
    '/:id',
    authenticate,
    authorize(ROLES.ADMIN),
    validate(ActualizarCategoriaServicioSchema),
    (req, res, next) => controller.actualizar(req, res, next)
);

// PUT /CategoriaServicio/:id — solo admins pueden desactivar una categoría de servicio
router.put(
    '/:id/desactivar',
    authenticate,
    authorize(ROLES.ADMIN),
    (req, res, next) => controller.desactivar(req, res, next)
);

// PUT /categoriaServicios/:id/reactivar — solo admins pueden reactivar categorías
router.put(
    '/:id/reactivar',
    authenticate,
    authorize(ROLES.ADMIN),
    (req, res, next) => controller.reactivar(req, res, next)
);

export default router;


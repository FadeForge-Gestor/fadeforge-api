import { Router } from 'express';
import { ServiciosController } from './Servicios.controller';
import { ServiciosUseCase } from '@core/usecases/servicios/servicios.usecase';
import { ServiciosPrismaRepository } from '@adapters/out/db/servicios/servicios.prisma.repository';
import { CategoriaServicioPrismaRepository } from '@adapters/out/db/categorias-servicios/categoriaServicios.prisma.repository';
import { validate } from "@middlewares/validate.middleware";
import { authenticate, authorize } from "@middlewares/auth.middleware";
import { CrearServicioSchema, ActualizarServicioSchema } from "./Servicios.schema";
import { ROLES } from "@shared/constants/roles";

// Inyección de dependencias — el orden importa:
// repositorio → caso de uso → controller
const router = Router();
const repositorio = new ServiciosPrismaRepository();
const categoriaRepositorio = new CategoriaServicioPrismaRepository();
const casoDeUso = new ServiciosUseCase(repositorio, categoriaRepositorio);
const controller = new ServiciosController(casoDeUso);

// GET /servicios
router.get(
    '/',
    (req, res, next) => controller.listar(req, res, next)
);

// GET / serviciosActivos
router.get(
    '/activos',
    (req, res, next) => controller.listarActivos(req, res, next)
);

// GET / servicio /:id
router.get(
    '/:id',
    (req, res, next) => controller.obtenerPorId(req, res, next)
);

// POST /servicio — solo admins pueden crear un nuevo servicio
router.post(
    '/',
    authenticate,
    authorize(ROLES.ADMIN),
    validate(CrearServicioSchema),
    (req, res, next) => controller.crear(req, res, next)
);

// PUT /servicio/:id — solo admins pueden actualizar un servicio
router.put(
    '/:id',
    authenticate,
    authorize(ROLES.ADMIN),
    validate(ActualizarServicioSchema),
    (req, res, next) => controller.actualizar(req, res, next)
);

// PUT /servicio/:id — solo admins pueden desactivar un servicio
router.put(
    '/:id/desactivar',
    authenticate,
    authorize(ROLES.ADMIN),
    (req, res, next) => controller.desactivar(req, res, next)
);

export default router;

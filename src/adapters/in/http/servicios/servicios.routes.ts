import { Router } from 'express';
import { ServiciosController } from './servicios.controller';
import { ServiciosUseCase } from '@core/usecases/servicios/servicios.usecase';
import { ServiciosPrismaRepository } from '@adapters/out/db/servicios/servicios.prisma.repository';
import { CategoriaServicioPrismaRepository } from '@adapters/out/db/categorias-servicios/categoriaServicios.prisma.repository';
import { CloudinaryStorageAdapter } from '@adapters/out/cloudinary/cloudinary.storage.adapter';
import { validate } from "@middlewares/validate.middleware";
import { authenticate, authorize } from "@middlewares/auth.middleware";
import { idempotency } from "@middlewares/idempotency.middleware";
import { upload } from "@middlewares/upload.middleware";
import { IdempotencyMemoryRepository } from "@adapters/out/memory/idempotency/idempotency.memory.repository";
import { CrearServicioSchema, ActualizarServicioSchema } from "./servicios.schema";
import { ROLES } from "@shared/constants/roles";

// Inyección de dependencias
const router = Router();
const repositorio = new ServiciosPrismaRepository();
const categoriaRepositorio = new CategoriaServicioPrismaRepository();
const storageAdapter = new CloudinaryStorageAdapter();
const casoDeUso = new ServiciosUseCase(repositorio, categoriaRepositorio, storageAdapter);
const controller = new ServiciosController(casoDeUso);
const idempotencyRepo = new IdempotencyMemoryRepository();

// GET /servicios
router.get(
    '/',
    authenticate,
    authorize(ROLES.ADMIN),
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
    idempotency(idempotencyRepo),
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

// PUT /servicios/:id/reactivar — solo admins pueden reactivar servicios
router.put(
    '/:id/reactivar',
    authenticate,
    authorize(ROLES.ADMIN),
    (req, res, next) => controller.reactivar(req, res, next)
);

// POST /servicios/:id/imagen
router.post(
    '/:id/imagen',
    authenticate,
    authorize(ROLES.ADMIN),
    upload.single('imagen'),
    (req, res, next) => controller.subirImagen(req, res, next)
);

// PUT /servicios/:id/imagen
router.put(
    '/:id/imagen',
    authenticate,
    authorize(ROLES.ADMIN),
    upload.single('imagen'),
    (req, res, next) => controller.actualizarImagen(req, res, next)
);

// DELETE /servicios/:id/imagen
router.delete(
    '/:id/imagen',
    authenticate,
    authorize(ROLES.ADMIN),
    (req, res, next) => controller.eliminarImagen(req, res, next)
);

export default router;

import { Router } from 'express';
import { CitasController } from './citas.controller';
import { CitasUseCase } from '@core/usecases/citas/citas.usecase';
import { CitasPrismaRepository } from '@adapters/out/db/citas/citas.prisma.repository';
import { UsuariosPrismaRepository } from '@adapters/out/db/usuarios/usuarios.prisma.repository';
import { EmpleadosPrismaRepository } from '@adapters/out/db/empleados/empleados.prisma.repository';
import { ServiciosPrismaRepository } from '@adapters/out/db/servicios/servicios.prisma.repository';
import { validate, validateQuery } from '@middlewares/validate.middleware';
import { authenticate, authorize } from '@middlewares/auth.middleware';
import { CrearCitaSchema, ActualizarCitaSchema, CambiarEstadoCitaSchema, RangoFechaSchema } from './citas.schema';
import { ROLES } from '@shared/constants/roles';

const router = Router();
const citasRepo = new CitasPrismaRepository();
const usuariosRepo = new UsuariosPrismaRepository();
const empleadosRepo = new EmpleadosPrismaRepository();
const serviciosRepo = new ServiciosPrismaRepository();
const casoDeUso = new CitasUseCase(citasRepo, usuariosRepo, empleadosRepo, serviciosRepo);
const controller = new CitasController(casoDeUso);

// GET /citas?desde=&hasta= — solo personal interno puede ver el listado global
router.get(
    '/',
    authenticate,
    authorize(ROLES.ADMIN, ROLES.EMPLEADO),
    validateQuery(RangoFechaSchema),
    (req, res, next) => controller.listarPorRangoFecha(req, res, next)
);

// GET /citas/folio/:folio — antes que /:id para evitar conflicto de rutas
router.get(
    '/folio/:folio',
    authenticate,
    (req, res, next) => controller.obtenerPorFolio(req, res, next)
);

// GET /citas/cliente/:idCliente
router.get(
    '/cliente/:idCliente',
    authenticate,
    (req, res, next) => controller.listarPorCliente(req, res, next)
);

// GET /citas/:id
router.get(
    '/:id',
    authenticate,
    (req, res, next) => controller.obtenerPorId(req, res, next)
);

// POST /citas — cualquier usuario autenticado puede crear una cita
router.post(
    '/',
    authenticate,
    validate(CrearCitaSchema),
    (req, res, next) => controller.crear(req, res, next)
);

// PUT /citas/:id — cualquier usuario autenticado puede editar su cita
router.put(
    '/:id',
    authenticate,
    validate(ActualizarCitaSchema),
    (req, res, next) => controller.actualizar(req, res, next)
);

// PATCH /citas/:id/estado — solo personal interno puede cambiar el estado
router.patch(
    '/:id/estado',
    authenticate,
    authorize(ROLES.ADMIN, ROLES.EMPLEADO),
    validate(CambiarEstadoCitaSchema),
    (req, res, next) => controller.cambiarEstado(req, res, next)
);

export default router;

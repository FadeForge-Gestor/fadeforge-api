import { CitasUseCase } from '@core/usecases/citas/citas.usecase';
import { ICitaRepository } from '@core/ports/out/citas/ICitaRepository';
import { IUsuarioRepository } from '@core/ports/out/usuarios/IUsuarioRepository';
import { IEmpleadoRepository } from '@core/ports/out/empleados/IEmpleadoRepository';
import { IServicioRepository } from '@core/ports/out/servicios/IServicioRepository';
import { Cita } from '@core/domain/cita/cita.entity';
import { DetalleCita } from '@core/domain/detalle-cita/detalleCita.entity';
import { Usuario } from '@core/domain/usuario/usuario.entity';
import { EmpleadoDetalle } from '@core/domain/empleado/empleado.entity';
import { Servicio } from '@core/domain/servicio/servicio.entity';
import { NotFoundError, ConflictError } from '@shared/errors/HttpError';

const detalleFake: DetalleCita = {
    id: 1,
    idCita: 1,
    idServicio: 1,
    precioAplicado: 250,
    duracionMinutos: 30,
};

const citaFake: Cita = {
    id: 1,
    folio: 'CIT-00001',
    idCliente: 5,
    idEmpleado: 2,
    fechaInicio: new Date('2026-06-10T10:00:00.000Z'),
    fechaFin: new Date('2026-06-10T10:30:00.000Z'),
    estado: 'nueva',
    motivoCancelado: null,
    canceladoPor: null,
    fechaCreacion: new Date(),
    fechaModificacion: new Date(),
    subtotal: 250,
    iva: 40,
    total: 290,
    detalle: [detalleFake],
};

const usuarioFake: Usuario = {
    id: 5,
    nombre: 'Juan',
    aPaterno: 'Pérez',
    aMaterno: null,
    telefono: '5551234567',
    idRol: 1,
    activo: true,
    fechaCreacion: new Date(),
    fechaModificacion: new Date(),
};

const empleadoFake: EmpleadoDetalle = {
    id: 2,
    idUsuario: 3,
    nombreCompleto: 'María García',
    correo: 'maria@example.com',
    activo: true,
    fechaCreacion: new Date(),
    fechaModificacion: new Date(),
};

const servicioFake: Servicio = {
    id: 1,
    nombre: 'Corte de cabello',
    descripcion: null,
    duracionMinutos: 30,
    idCategoria: 1,
    imagenUrl: null,
    idImagen: null,
    nombreImagen: null,
    activo: true,
    fechaCreacion: new Date(),
    fechaModificacion: new Date(),
};

const actorAdmin = { id: 1, rol: 'admin' };
const actorCliente = { id: 5, rol: 'cliente' };
const actorClienteAjeno = { id: 99, rol: 'cliente' };

const mockCitaRepo: jest.Mocked<ICitaRepository> = {
    listarPorRangoFecha: jest.fn(),
    buscarPorId: jest.fn(),
    buscarPorFolio: jest.fn(),
    buscarPorCliente: jest.fn(),
    crear: jest.fn(),
    actualizar: jest.fn(),
    cambiarEstado: jest.fn(),
    verificarSolapamientoEmpleado: jest.fn(),
};

const mockUsuarioRepo: jest.Mocked<IUsuarioRepository> = {
    listarTodos: jest.fn(),
    buscarPorId: jest.fn(),
    buscarPorCorreo: jest.fn(),
    crear: jest.fn(),
    actualizar: jest.fn(),
    desactivar: jest.fn(),
    reactivar: jest.fn(),
};

const mockEmpleadoRepo: jest.Mocked<IEmpleadoRepository> = {
    listarTodos: jest.fn(),
    listarActivos: jest.fn(),
    buscarPorId: jest.fn(),
    buscarPorIdUsuario: jest.fn(),
    promover: jest.fn(),
    desactivar: jest.fn(),
    reactivar: jest.fn(),
};

const mockServicioRepo: jest.Mocked<IServicioRepository> = {
    listarTodos: jest.fn(),
    listarActivos: jest.fn(),
    buscarPorId: jest.fn(),
    buscarPorIds: jest.fn(),
    buscarPorNombre: jest.fn(),
    crear: jest.fn(),
    actualizar: jest.fn(),
    desactivar: jest.fn(),
    reactivar: jest.fn(),
    buscarPrecioActual: jest.fn(),
    buscarPreciosActuales: jest.fn(),
};

describe('CitasUseCase', () => {

    let useCase: CitasUseCase;

    beforeEach(() => {
        jest.clearAllMocks();
        useCase = new CitasUseCase(mockCitaRepo, mockUsuarioRepo, mockEmpleadoRepo, mockServicioRepo);
    });

    describe('listarPorRangoFecha', () => {

        it('debe retornar las citas en el rango indicado', async () => {
            const desde = new Date('2026-06-01');
            const hasta = new Date('2026-06-30');
            mockCitaRepo.listarPorRangoFecha.mockResolvedValue([citaFake]);

            const result = await useCase.listarPorRangoFecha(desde, hasta);

            expect(mockCitaRepo.listarPorRangoFecha).toHaveBeenCalledWith(desde, hasta);
            expect(result).toEqual([citaFake]);
        });
    });

    describe('obtenerPorId', () => {

        it('debe retornar la cita si existe', async () => {
            mockCitaRepo.buscarPorId.mockResolvedValue(citaFake);

            const result = await useCase.obtenerPorId(1, actorAdmin);

            expect(result).toEqual(citaFake);
        });

        it('debe lanzar NotFoundError si la cita no existe', async () => {
            mockCitaRepo.buscarPorId.mockResolvedValue(null);

            await expect(useCase.obtenerPorId(99, actorAdmin)).rejects.toThrow(NotFoundError);
        });

        it('debe lanzar NotFoundError si el cliente intenta ver una cita ajena', async () => {
            mockCitaRepo.buscarPorId.mockResolvedValue(citaFake);

            await expect(useCase.obtenerPorId(1, actorClienteAjeno)).rejects.toThrow(NotFoundError);
        });

        it('debe retornar la cita si el cliente es el dueño', async () => {
            mockCitaRepo.buscarPorId.mockResolvedValue(citaFake);

            const result = await useCase.obtenerPorId(1, actorCliente);

            expect(result).toEqual(citaFake);
        });
    });

    describe('obtenerPorFolio', () => {

        it('debe retornar la cita si el folio existe', async () => {
            mockCitaRepo.buscarPorFolio.mockResolvedValue(citaFake);

            const result = await useCase.obtenerPorFolio('CIT-00001', actorAdmin);

            expect(result).toEqual(citaFake);
        });

        it('debe lanzar NotFoundError si el folio no existe', async () => {
            mockCitaRepo.buscarPorFolio.mockResolvedValue(null);

            await expect(useCase.obtenerPorFolio('CIT-99999', actorAdmin)).rejects.toThrow(NotFoundError);
        });

        it('debe lanzar NotFoundError si el cliente intenta ver una cita ajena por folio', async () => {
            mockCitaRepo.buscarPorFolio.mockResolvedValue(citaFake);

            await expect(useCase.obtenerPorFolio('CIT-00001', actorClienteAjeno)).rejects.toThrow(NotFoundError);
        });

        it('debe retornar la cita si el cliente es el dueño', async () => {
            mockCitaRepo.buscarPorFolio.mockResolvedValue(citaFake);

            const result = await useCase.obtenerPorFolio('CIT-00001', actorCliente);

            expect(result).toEqual(citaFake);
        });
    });

    describe('listarPorCliente', () => {

        it('debe retornar las citas del cliente', async () => {
            mockCitaRepo.buscarPorCliente.mockResolvedValue([citaFake]);

            const result = await useCase.listarPorCliente(5, actorAdmin);

            expect(mockCitaRepo.buscarPorCliente).toHaveBeenCalledWith(5);
            expect(result).toEqual([citaFake]);
        });

        it('debe lanzar NotFoundError si el cliente intenta ver citas de otro cliente', async () => {
            await expect(useCase.listarPorCliente(5, actorClienteAjeno)).rejects.toThrow(NotFoundError);

            expect(mockCitaRepo.buscarPorCliente).not.toHaveBeenCalled();
        });

        it('debe retornar las citas si el cliente consulta las suyas', async () => {
            mockCitaRepo.buscarPorCliente.mockResolvedValue([citaFake]);

            const result = await useCase.listarPorCliente(5, actorCliente);

            expect(result).toEqual([citaFake]);
        });
    });

    describe('crear', () => {

        const fechaFutura = new Date(Date.now() + 3600000);

        it('debe lanzar ConflictError si el actor es admin y no se proporciona idCliente', async () => {
            await expect(useCase.crear({ idEmpleado: 2, fechaInicio: fechaFutura, servicios: [{ idServicio: 1 }] } as any, actorAdmin))
                .rejects.toThrow(ConflictError);

            expect(mockUsuarioRepo.buscarPorId).not.toHaveBeenCalled();
        });

        it('debe usar el id del actor si el actor es cliente (ignora idCliente del input)', async () => {
            mockUsuarioRepo.buscarPorId.mockResolvedValue(usuarioFake);
            mockEmpleadoRepo.buscarPorId.mockResolvedValue(empleadoFake);
            mockServicioRepo.buscarPorIds.mockResolvedValue([servicioFake]);
            mockServicioRepo.buscarPreciosActuales.mockResolvedValue(new Map([[1, 250]]));
            mockCitaRepo.verificarSolapamientoEmpleado.mockResolvedValue(false);
            mockCitaRepo.crear.mockResolvedValue(citaFake);

            await useCase.crear({ idCliente: 99, idEmpleado: 2, fechaInicio: fechaFutura, servicios: [{ idServicio: 1 }] }, actorCliente);

            expect(mockCitaRepo.crear).toHaveBeenCalledWith(expect.objectContaining({ idCliente: actorCliente.id }));
        });

        it('debe usar el idCliente del input si el actor es admin', async () => {
            mockUsuarioRepo.buscarPorId.mockResolvedValue(usuarioFake);
            mockEmpleadoRepo.buscarPorId.mockResolvedValue(empleadoFake);
            mockServicioRepo.buscarPorIds.mockResolvedValue([servicioFake]);
            mockServicioRepo.buscarPreciosActuales.mockResolvedValue(new Map([[1, 250]]));
            mockCitaRepo.verificarSolapamientoEmpleado.mockResolvedValue(false);
            mockCitaRepo.crear.mockResolvedValue(citaFake);

            await useCase.crear({ idCliente: 5, idEmpleado: 2, fechaInicio: fechaFutura, servicios: [{ idServicio: 1 }] }, actorAdmin);

            expect(mockCitaRepo.crear).toHaveBeenCalledWith(expect.objectContaining({ idCliente: 5 }));
        });

        it('debe lanzar ConflictError si no se envían servicios', async () => {
            await expect(useCase.crear({ idCliente: 5, idEmpleado: 2, fechaInicio: fechaFutura, servicios: [] }, actorAdmin))
                .rejects.toThrow(ConflictError);
        });

        it('debe lanzar ConflictError si la fecha de inicio es en el pasado', async () => {
            const fechaPasada = new Date(Date.now() - 3600000);

            await expect(useCase.crear({ idCliente: 5, idEmpleado: 2, fechaInicio: fechaPasada, servicios: [{ idServicio: 1 }] }, actorAdmin))
                .rejects.toThrow(ConflictError);
        });

        it('debe lanzar NotFoundError si el cliente no existe', async () => {
            mockUsuarioRepo.buscarPorId.mockResolvedValue(null);

            await expect(useCase.crear({ idCliente: 99, idEmpleado: 2, fechaInicio: fechaFutura, servicios: [{ idServicio: 1 }] }, actorAdmin))
                .rejects.toThrow(NotFoundError);
        });

        it('debe lanzar ConflictError si el cliente está desactivado', async () => {
            mockUsuarioRepo.buscarPorId.mockResolvedValue({ ...usuarioFake, activo: false });

            await expect(useCase.crear({ idCliente: 5, idEmpleado: 2, fechaInicio: fechaFutura, servicios: [{ idServicio: 1 }] }, actorAdmin))
                .rejects.toThrow(ConflictError);
        });

        it('debe lanzar NotFoundError si el empleado no existe', async () => {
            mockUsuarioRepo.buscarPorId.mockResolvedValue(usuarioFake);
            mockEmpleadoRepo.buscarPorId.mockResolvedValue(null);

            await expect(useCase.crear({ idCliente: 5, idEmpleado: 99, fechaInicio: fechaFutura, servicios: [{ idServicio: 1 }] }, actorAdmin))
                .rejects.toThrow(NotFoundError);
        });

        it('debe lanzar ConflictError si el empleado está desactivado', async () => {
            mockUsuarioRepo.buscarPorId.mockResolvedValue(usuarioFake);
            mockEmpleadoRepo.buscarPorId.mockResolvedValue({ ...empleadoFake, activo: false });

            await expect(useCase.crear({ idCliente: 5, idEmpleado: 2, fechaInicio: fechaFutura, servicios: [{ idServicio: 1 }] }, actorAdmin))
                .rejects.toThrow(ConflictError);
        });

        it('debe lanzar NotFoundError si un servicio no existe', async () => {
            mockUsuarioRepo.buscarPorId.mockResolvedValue(usuarioFake);
            mockEmpleadoRepo.buscarPorId.mockResolvedValue(empleadoFake);
            mockServicioRepo.buscarPorIds.mockResolvedValue([]);
            mockServicioRepo.buscarPreciosActuales.mockResolvedValue(new Map());

            await expect(useCase.crear({ idCliente: 5, idEmpleado: 2, fechaInicio: fechaFutura, servicios: [{ idServicio: 99 }] }, actorAdmin))
                .rejects.toThrow(NotFoundError);
        });

        it('debe lanzar ConflictError si un servicio está desactivado', async () => {
            mockUsuarioRepo.buscarPorId.mockResolvedValue(usuarioFake);
            mockEmpleadoRepo.buscarPorId.mockResolvedValue(empleadoFake);
            mockServicioRepo.buscarPorIds.mockResolvedValue([{ ...servicioFake, activo: false }]);
            mockServicioRepo.buscarPreciosActuales.mockResolvedValue(new Map());

            await expect(useCase.crear({ idCliente: 5, idEmpleado: 2, fechaInicio: fechaFutura, servicios: [{ idServicio: 1 }] }, actorAdmin))
                .rejects.toThrow(ConflictError);
        });

        it('debe lanzar ConflictError si un servicio no tiene precio registrado', async () => {
            mockUsuarioRepo.buscarPorId.mockResolvedValue(usuarioFake);
            mockEmpleadoRepo.buscarPorId.mockResolvedValue(empleadoFake);
            mockServicioRepo.buscarPorIds.mockResolvedValue([servicioFake]);
            mockServicioRepo.buscarPreciosActuales.mockResolvedValue(new Map());

            await expect(useCase.crear({ idCliente: 5, idEmpleado: 2, fechaInicio: fechaFutura, servicios: [{ idServicio: 1 }] }, actorAdmin))
                .rejects.toThrow(ConflictError);
        });

        it('debe crear la cita con subtotal, iva y total calculados correctamente', async () => {
            mockUsuarioRepo.buscarPorId.mockResolvedValue(usuarioFake);
            mockEmpleadoRepo.buscarPorId.mockResolvedValue(empleadoFake);
            mockServicioRepo.buscarPorIds.mockResolvedValue([servicioFake]);
            mockServicioRepo.buscarPreciosActuales.mockResolvedValue(new Map([[1, 250]]));
            mockCitaRepo.verificarSolapamientoEmpleado.mockResolvedValue(false);
            mockCitaRepo.crear.mockResolvedValue(citaFake);

            const result = await useCase.crear({ idCliente: 5, idEmpleado: 2, fechaInicio: fechaFutura, servicios: [{ idServicio: 1 }] }, actorAdmin);

            expect(mockCitaRepo.crear).toHaveBeenCalledWith(expect.objectContaining({
                idCliente: 5,
                idEmpleado: 2,
                subtotal: 250,
                iva: 40,
                total: 290,
            }));
            expect(result).toEqual(citaFake);
        });

        it('debe calcular fechaFin sumando la duración de todos los servicios', async () => {
            mockUsuarioRepo.buscarPorId.mockResolvedValue(usuarioFake);
            mockEmpleadoRepo.buscarPorId.mockResolvedValue(empleadoFake);
            mockServicioRepo.buscarPorIds.mockResolvedValue([servicioFake]);
            mockServicioRepo.buscarPreciosActuales.mockResolvedValue(new Map([[1, 250]]));
            mockCitaRepo.verificarSolapamientoEmpleado.mockResolvedValue(false);
            mockCitaRepo.crear.mockResolvedValue(citaFake);

            const fechaInicio = new Date(Date.now() + 3600000);
            await useCase.crear({ idCliente: 5, idEmpleado: 2, fechaInicio, servicios: [{ idServicio: 1 }] }, actorAdmin);

            const fechaFinEsperada = new Date(fechaInicio.getTime() + 30 * 60 * 1000);
            expect(mockCitaRepo.crear).toHaveBeenCalledWith(expect.objectContaining({
                fechaFin: fechaFinEsperada,
            }));
        });

        it('debe lanzar ConflictError si el empleado ya tiene una cita en ese horario', async () => {
            mockUsuarioRepo.buscarPorId.mockResolvedValue(usuarioFake);
            mockEmpleadoRepo.buscarPorId.mockResolvedValue(empleadoFake);
            mockServicioRepo.buscarPorIds.mockResolvedValue([servicioFake]);
            mockServicioRepo.buscarPreciosActuales.mockResolvedValue(new Map([[1, 250]]));
            mockCitaRepo.verificarSolapamientoEmpleado.mockResolvedValue(true);

            await expect(useCase.crear({ idCliente: 5, idEmpleado: 2, fechaInicio: fechaFutura, servicios: [{ idServicio: 1 }] }, actorAdmin))
                .rejects.toThrow(ConflictError);

            expect(mockCitaRepo.crear).not.toHaveBeenCalled();
        });
    });

    describe('actualizar', () => {

        it('debe lanzar NotFoundError si la cita no existe', async () => {
            mockCitaRepo.buscarPorId.mockResolvedValue(null);

            await expect(useCase.actualizar(99, { idEmpleado: 3 }, actorAdmin)).rejects.toThrow(NotFoundError);
        });

        it('debe lanzar ConflictError si la cita está cancelada', async () => {
            mockCitaRepo.buscarPorId.mockResolvedValue({ ...citaFake, estado: 'cancelada' });

            await expect(useCase.actualizar(1, { idEmpleado: 3 }, actorAdmin)).rejects.toThrow(ConflictError);
        });

        it('debe lanzar ConflictError si la cita está finalizada', async () => {
            mockCitaRepo.buscarPorId.mockResolvedValue({ ...citaFake, estado: 'finalizada' });

            await expect(useCase.actualizar(1, { idEmpleado: 3 }, actorAdmin)).rejects.toThrow(ConflictError);
        });

        it('debe lanzar NotFoundError si el nuevo empleado no existe', async () => {
            mockCitaRepo.buscarPorId.mockResolvedValue(citaFake);
            mockEmpleadoRepo.buscarPorId.mockResolvedValue(null);

            await expect(useCase.actualizar(1, { idEmpleado: 99 }, actorAdmin)).rejects.toThrow(NotFoundError);
        });

        it('debe lanzar ConflictError si el nuevo empleado está desactivado', async () => {
            mockCitaRepo.buscarPorId.mockResolvedValue(citaFake);
            mockEmpleadoRepo.buscarPorId.mockResolvedValue({ ...empleadoFake, activo: false });

            await expect(useCase.actualizar(1, { idEmpleado: 2 }, actorAdmin)).rejects.toThrow(ConflictError);
        });

        it('debe actualizar si todo es válido', async () => {
            const citaActualizada = { ...citaFake, idEmpleado: 3 };
            mockCitaRepo.buscarPorId.mockResolvedValue(citaFake);
            mockEmpleadoRepo.buscarPorId.mockResolvedValue(empleadoFake);
            mockCitaRepo.verificarSolapamientoEmpleado.mockResolvedValue(false);
            mockCitaRepo.actualizar.mockResolvedValue(citaActualizada);

            const result = await useCase.actualizar(1, { idEmpleado: 3 }, actorAdmin);

            expect(mockCitaRepo.actualizar).toHaveBeenCalledWith(1, { idEmpleado: 3 });
            expect(result.idEmpleado).toBe(3);
        });

        it('debe lanzar ConflictError si hay solapamiento al cambiar empleado', async () => {
            mockCitaRepo.buscarPorId.mockResolvedValue(citaFake);
            mockEmpleadoRepo.buscarPorId.mockResolvedValue(empleadoFake);
            mockCitaRepo.verificarSolapamientoEmpleado.mockResolvedValue(true);

            await expect(useCase.actualizar(1, { idEmpleado: 3 }, actorAdmin)).rejects.toThrow(ConflictError);

            expect(mockCitaRepo.actualizar).not.toHaveBeenCalled();
        });

        it('debe lanzar ConflictError si hay solapamiento al cambiar fechaInicio', async () => {
            const nuevaFecha = new Date(Date.now() + 7200000);
            mockCitaRepo.buscarPorId.mockResolvedValue(citaFake);
            mockCitaRepo.verificarSolapamientoEmpleado.mockResolvedValue(true);

            await expect(useCase.actualizar(1, { fechaInicio: nuevaFecha }, actorAdmin)).rejects.toThrow(ConflictError);

            expect(mockCitaRepo.actualizar).not.toHaveBeenCalled();
        });

        it('debe verificar solapamiento usando los valores existentes para campos no provistos', async () => {
            const nuevaFecha = new Date(Date.now() + 7200000);
            mockCitaRepo.buscarPorId.mockResolvedValue(citaFake);
            mockCitaRepo.verificarSolapamientoEmpleado.mockResolvedValue(false);
            mockCitaRepo.actualizar.mockResolvedValue({ ...citaFake, fechaInicio: nuevaFecha });

            await useCase.actualizar(1, { fechaInicio: nuevaFecha }, actorAdmin);

            expect(mockCitaRepo.verificarSolapamientoEmpleado).toHaveBeenCalledWith(
                citaFake.idEmpleado,
                nuevaFecha,
                citaFake.fechaFin,
                1
            );
        });

        it('no debe verificar solapamiento si el input no toca empleado ni fechas', async () => {
            mockCitaRepo.buscarPorId.mockResolvedValue(citaFake);
            mockCitaRepo.actualizar.mockResolvedValue(citaFake);

            await useCase.actualizar(1, { subtotal: 300 }, actorAdmin);

            expect(mockCitaRepo.verificarSolapamientoEmpleado).not.toHaveBeenCalled();
        });

        it('debe lanzar NotFoundError si el cliente intenta actualizar una cita ajena', async () => {
            mockCitaRepo.buscarPorId.mockResolvedValue(citaFake);

            await expect(useCase.actualizar(1, { idEmpleado: 3 }, actorClienteAjeno)).rejects.toThrow(NotFoundError);

            expect(mockCitaRepo.actualizar).not.toHaveBeenCalled();
        });
    });

    describe('cambiarEstado', () => {

        it('debe lanzar NotFoundError si la cita no existe', async () => {
            mockCitaRepo.buscarPorId.mockResolvedValue(null);

            await expect(useCase.cambiarEstado(99, 'pendiente')).rejects.toThrow(NotFoundError);
        });

        it('debe lanzar ConflictError si la cita está en un estado terminal', async () => {
            mockCitaRepo.buscarPorId.mockResolvedValue({ ...citaFake, estado: 'finalizada' });

            await expect(useCase.cambiarEstado(1, 'cancelada')).rejects.toThrow(ConflictError);
        });

        it('debe lanzar ConflictError si la transición de estado no es válida', async () => {
            mockCitaRepo.buscarPorId.mockResolvedValue({ ...citaFake, estado: 'nueva' });

            await expect(useCase.cambiarEstado(1, 'finalizada')).rejects.toThrow(ConflictError);
        });

        it('debe lanzar ConflictError si se cancela sin motivo', async () => {
            mockCitaRepo.buscarPorId.mockResolvedValue({ ...citaFake, estado: 'nueva' });

            await expect(useCase.cambiarEstado(1, 'cancelada')).rejects.toThrow(ConflictError);
        });

        it('debe cambiar el estado de nueva a pendiente', async () => {
            const citaActualizada = { ...citaFake, estado: 'pendiente' as const };
            mockCitaRepo.buscarPorId.mockResolvedValue(citaFake);
            mockCitaRepo.cambiarEstado.mockResolvedValue(citaActualizada);

            const result = await useCase.cambiarEstado(1, 'pendiente');

            expect(mockCitaRepo.cambiarEstado).toHaveBeenCalledWith(1, { estado: 'pendiente', motivoCancelado: undefined, canceladoPor: undefined });
            expect(result.estado).toBe('pendiente');
        });

        it('debe cancelar la cita con motivo cuando el estado lo permite', async () => {
            const citaActualizada = { ...citaFake, estado: 'cancelada' as const, motivoCancelado: 'Solicitud del cliente' };
            mockCitaRepo.buscarPorId.mockResolvedValue(citaFake);
            mockCitaRepo.cambiarEstado.mockResolvedValue(citaActualizada);

            const result = await useCase.cambiarEstado(1, 'cancelada', 'Solicitud del cliente', 1);

            expect(mockCitaRepo.cambiarEstado).toHaveBeenCalledWith(1, {
                estado: 'cancelada',
                motivoCancelado: 'Solicitud del cliente',
                canceladoPor: 1,
            });
            expect(result.estado).toBe('cancelada');
        });
    });
});

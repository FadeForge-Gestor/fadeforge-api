import { CitasUseCase } from '@core/usecases/citas/citas.usecase';
import { ICitaRepository } from '@core/ports/out/citas/ICitaRepository';
import { IUsuarioRepository } from '@core/ports/out/usuarios/IUsuarioRepository';
import { IEmpleadoRepository } from '@core/ports/out/empleados/IEmpleadoRepository';
import { IServicioRepository } from '@core/ports/out/servicios/IServicioRepository';
import { Cita } from '@core/domain/cita/cita.entity';
import { DetalleCita } from '@core/domain/detalle-cita/detalleCita.entity';
import { Usuario } from '@core/domain/usuario/usuario.entity';
import { Empleado } from '@core/domain/empleado/empleado.entity';
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

const empleadoFake: Empleado = {
    id: 2,
    idUsuario: 3,
    nombreCompletoEmpleado: 'María García',
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
    activo: true,
    fechaCreacion: new Date(),
    fechaModificacion: new Date(),
};

const mockCitaRepo: jest.Mocked<ICitaRepository> = {
    listarPorRangoFecha: jest.fn(),
    buscarPorId: jest.fn(),
    buscarPorFolio: jest.fn(),
    buscarPorCliente: jest.fn(),
    crear: jest.fn(),
    actualizar: jest.fn(),
    cambiarEstado: jest.fn(),
};

const mockUsuarioRepo: jest.Mocked<IUsuarioRepository> = {
    listarTodos: jest.fn(),
    buscarPorId: jest.fn(),
    buscarPorCorreo: jest.fn(),
    crear: jest.fn(),
    actualizar: jest.fn(),
    desactivar: jest.fn(),
};

const mockEmpleadoRepo: jest.Mocked<IEmpleadoRepository> = {
    listarTodos: jest.fn(),
    listarActivos: jest.fn(),
    buscarPorId: jest.fn(),
    buscarPorIdUsuario: jest.fn(),
    promover: jest.fn(),
    desactivar: jest.fn(),
};

const mockServicioRepo: jest.Mocked<IServicioRepository> = {
    listarTodos: jest.fn(),
    listarActivos: jest.fn(),
    buscarPorId: jest.fn(),
    buscarPorNombre: jest.fn(),
    crear: jest.fn(),
    actualizar: jest.fn(),
    desactivar: jest.fn(),
    buscarPrecioActual: jest.fn(),
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

            const result = await useCase.obtenerPorId(1);

            expect(result).toEqual(citaFake);
        });

        it('debe lanzar NotFoundError si la cita no existe', async () => {
            mockCitaRepo.buscarPorId.mockResolvedValue(null);

            await expect(useCase.obtenerPorId(99)).rejects.toThrow(NotFoundError);
        });
    });

    describe('obtenerPorFolio', () => {

        it('debe retornar la cita si el folio existe', async () => {
            mockCitaRepo.buscarPorFolio.mockResolvedValue(citaFake);

            const result = await useCase.obtenerPorFolio('CIT-00001');

            expect(result).toEqual(citaFake);
        });

        it('debe lanzar NotFoundError si el folio no existe', async () => {
            mockCitaRepo.buscarPorFolio.mockResolvedValue(null);

            await expect(useCase.obtenerPorFolio('CIT-99999')).rejects.toThrow(NotFoundError);
        });
    });

    describe('listarPorCliente', () => {

        it('debe retornar las citas del cliente', async () => {
            mockCitaRepo.buscarPorCliente.mockResolvedValue([citaFake]);

            const result = await useCase.listarPorCliente(5);

            expect(mockCitaRepo.buscarPorCliente).toHaveBeenCalledWith(5);
            expect(result).toEqual([citaFake]);
        });
    });

    describe('crear', () => {

        const fechaFutura = new Date(Date.now() + 3600000);

        it('debe lanzar ConflictError si no se envían servicios', async () => {
            await expect(useCase.crear({ idCliente: 5, idEmpleado: 2, fechaInicio: fechaFutura, servicios: [] }))
                .rejects.toThrow(ConflictError);
        });

        it('debe lanzar ConflictError si la fecha de inicio es en el pasado', async () => {
            const fechaPasada = new Date(Date.now() - 3600000);

            await expect(useCase.crear({ idCliente: 5, idEmpleado: 2, fechaInicio: fechaPasada, servicios: [{ idServicio: 1 }] }))
                .rejects.toThrow(ConflictError);
        });

        it('debe lanzar NotFoundError si el cliente no existe', async () => {
            mockUsuarioRepo.buscarPorId.mockResolvedValue(null);

            await expect(useCase.crear({ idCliente: 99, idEmpleado: 2, fechaInicio: fechaFutura, servicios: [{ idServicio: 1 }] }))
                .rejects.toThrow(NotFoundError);
        });

        it('debe lanzar ConflictError si el cliente está desactivado', async () => {
            mockUsuarioRepo.buscarPorId.mockResolvedValue({ ...usuarioFake, activo: false });

            await expect(useCase.crear({ idCliente: 5, idEmpleado: 2, fechaInicio: fechaFutura, servicios: [{ idServicio: 1 }] }))
                .rejects.toThrow(ConflictError);
        });

        it('debe lanzar NotFoundError si el empleado no existe', async () => {
            mockUsuarioRepo.buscarPorId.mockResolvedValue(usuarioFake);
            mockEmpleadoRepo.buscarPorId.mockResolvedValue(null);

            await expect(useCase.crear({ idCliente: 5, idEmpleado: 99, fechaInicio: fechaFutura, servicios: [{ idServicio: 1 }] }))
                .rejects.toThrow(NotFoundError);
        });

        it('debe lanzar ConflictError si el empleado está desactivado', async () => {
            mockUsuarioRepo.buscarPorId.mockResolvedValue(usuarioFake);
            mockEmpleadoRepo.buscarPorId.mockResolvedValue({ ...empleadoFake, activo: false });

            await expect(useCase.crear({ idCliente: 5, idEmpleado: 2, fechaInicio: fechaFutura, servicios: [{ idServicio: 1 }] }))
                .rejects.toThrow(ConflictError);
        });

        it('debe lanzar NotFoundError si un servicio no existe', async () => {
            mockUsuarioRepo.buscarPorId.mockResolvedValue(usuarioFake);
            mockEmpleadoRepo.buscarPorId.mockResolvedValue(empleadoFake);
            mockServicioRepo.buscarPorId.mockResolvedValue(null);

            await expect(useCase.crear({ idCliente: 5, idEmpleado: 2, fechaInicio: fechaFutura, servicios: [{ idServicio: 99 }] }))
                .rejects.toThrow(NotFoundError);
        });

        it('debe lanzar ConflictError si un servicio está desactivado', async () => {
            mockUsuarioRepo.buscarPorId.mockResolvedValue(usuarioFake);
            mockEmpleadoRepo.buscarPorId.mockResolvedValue(empleadoFake);
            mockServicioRepo.buscarPorId.mockResolvedValue({ ...servicioFake, activo: false });

            await expect(useCase.crear({ idCliente: 5, idEmpleado: 2, fechaInicio: fechaFutura, servicios: [{ idServicio: 1 }] }))
                .rejects.toThrow(ConflictError);
        });

        it('debe lanzar ConflictError si un servicio no tiene precio registrado', async () => {
            mockUsuarioRepo.buscarPorId.mockResolvedValue(usuarioFake);
            mockEmpleadoRepo.buscarPorId.mockResolvedValue(empleadoFake);
            mockServicioRepo.buscarPorId.mockResolvedValue(servicioFake);
            mockServicioRepo.buscarPrecioActual.mockResolvedValue(null);

            await expect(useCase.crear({ idCliente: 5, idEmpleado: 2, fechaInicio: fechaFutura, servicios: [{ idServicio: 1 }] }))
                .rejects.toThrow(ConflictError);
        });

        it('debe crear la cita con subtotal, iva y total calculados correctamente', async () => {
            mockUsuarioRepo.buscarPorId.mockResolvedValue(usuarioFake);
            mockEmpleadoRepo.buscarPorId.mockResolvedValue(empleadoFake);
            mockServicioRepo.buscarPorId.mockResolvedValue(servicioFake);
            mockServicioRepo.buscarPrecioActual.mockResolvedValue(250);
            mockCitaRepo.crear.mockResolvedValue(citaFake);

            const result = await useCase.crear({ idCliente: 5, idEmpleado: 2, fechaInicio: fechaFutura, servicios: [{ idServicio: 1 }] });

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
            mockServicioRepo.buscarPorId.mockResolvedValue(servicioFake);
            mockServicioRepo.buscarPrecioActual.mockResolvedValue(250);
            mockCitaRepo.crear.mockResolvedValue(citaFake);

            const fechaInicio = new Date(Date.now() + 3600000);
            await useCase.crear({ idCliente: 5, idEmpleado: 2, fechaInicio, servicios: [{ idServicio: 1 }] });

            const fechaFinEsperada = new Date(fechaInicio.getTime() + 30 * 60 * 1000);
            expect(mockCitaRepo.crear).toHaveBeenCalledWith(expect.objectContaining({
                fechaFin: fechaFinEsperada,
            }));
        });
    });

    describe('actualizar', () => {

        it('debe lanzar NotFoundError si la cita no existe', async () => {
            mockCitaRepo.buscarPorId.mockResolvedValue(null);

            await expect(useCase.actualizar(99, { idEmpleado: 3 })).rejects.toThrow(NotFoundError);
        });

        it('debe lanzar ConflictError si la cita está cancelada', async () => {
            mockCitaRepo.buscarPorId.mockResolvedValue({ ...citaFake, estado: 'cancelada' });

            await expect(useCase.actualizar(1, { idEmpleado: 3 })).rejects.toThrow(ConflictError);
        });

        it('debe lanzar ConflictError si la cita está finalizada', async () => {
            mockCitaRepo.buscarPorId.mockResolvedValue({ ...citaFake, estado: 'finalizada' });

            await expect(useCase.actualizar(1, { idEmpleado: 3 })).rejects.toThrow(ConflictError);
        });

        it('debe lanzar NotFoundError si el nuevo empleado no existe', async () => {
            mockCitaRepo.buscarPorId.mockResolvedValue(citaFake);
            mockEmpleadoRepo.buscarPorId.mockResolvedValue(null);

            await expect(useCase.actualizar(1, { idEmpleado: 99 })).rejects.toThrow(NotFoundError);
        });

        it('debe lanzar ConflictError si el nuevo empleado está desactivado', async () => {
            mockCitaRepo.buscarPorId.mockResolvedValue(citaFake);
            mockEmpleadoRepo.buscarPorId.mockResolvedValue({ ...empleadoFake, activo: false });

            await expect(useCase.actualizar(1, { idEmpleado: 2 })).rejects.toThrow(ConflictError);
        });

        it('debe actualizar si todo es válido', async () => {
            const citaActualizada = { ...citaFake, idEmpleado: 3 };
            mockCitaRepo.buscarPorId.mockResolvedValue(citaFake);
            mockEmpleadoRepo.buscarPorId.mockResolvedValue(empleadoFake);
            mockCitaRepo.actualizar.mockResolvedValue(citaActualizada);

            const result = await useCase.actualizar(1, { idEmpleado: 3 });

            expect(mockCitaRepo.actualizar).toHaveBeenCalledWith(1, { idEmpleado: 3 });
            expect(result.idEmpleado).toBe(3);
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

import { EmpleadosUseCase } from '@core/usecases/empleados/empleados.usecase';
import { IEmpleadoRepository } from '@core/ports/out/empleados/IEmpleadoRepository';
import { IUsuarioRepository } from '@core/ports/out/usuarios/IUsuarioRepository';
import { Empleado, EmpleadoDetalle, PromoverEmpleadoInput } from '@core/domain/empleado/empleado.entity';
import { Usuario } from '@core/domain/usuario/usuario.entity';
import { NotFoundError, ConflictError } from '@shared/errors/HttpError';

const empleadoFake: EmpleadoDetalle = {
    id: 1,
    idUsuario: 5,
    nombreCompleto: 'Juan Pérez García',
    correo: 'juan@test.com',
    activo: true,
    fechaCreacion: new Date(),
    fechaModificacion: new Date(),
};

const usuarioFake: Usuario = {
    id: 5,
    nombre: 'Juan',
    aPaterno: 'Pérez',
    aMaterno: 'García',
    telefono: '1234567890',
    idRol: 2,
    activo: true,
    fechaCreacion: new Date(),
    fechaModificacion: new Date(),
};

const inputPromover: PromoverEmpleadoInput = {
    idUsuario: 5,
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

const mockUsuarioRepo: jest.Mocked<IUsuarioRepository> = {
    listarTodos: jest.fn(),
    buscarPorId: jest.fn(),
    buscarPorCorreo: jest.fn(),
    crear: jest.fn(),
    actualizar: jest.fn(),
    desactivar: jest.fn(),
    reactivar: jest.fn(),
};

describe('EmpleadosUseCase', () => {

    let useCase: EmpleadosUseCase;

    beforeEach(() => {
        jest.clearAllMocks();
        useCase = new EmpleadosUseCase(mockEmpleadoRepo, mockUsuarioRepo);
    });

    describe('obtenerPorId', () => {

        it('debe retornar el empleado si existe', async () => {
            mockEmpleadoRepo.buscarPorId.mockResolvedValue(empleadoFake);

            const result = await useCase.obtenerPorId(1);

            expect(result).toEqual(empleadoFake);
        });

        it('debe lanzar NotFoundError si el empleado no existe', async () => {
            mockEmpleadoRepo.buscarPorId.mockResolvedValue(null);

            await expect(useCase.obtenerPorId(99)).rejects.toThrow(NotFoundError);
        });
    });

    describe('promover', () => {

        it('debe lanzar NotFoundError si el usuario no existe', async () => {
            mockUsuarioRepo.buscarPorId.mockResolvedValue(null);

            await expect(useCase.promover(inputPromover)).rejects.toThrow(NotFoundError);
        });

        it('debe lanzar ConflictError si el usuario está desactivado', async () => {
            mockUsuarioRepo.buscarPorId.mockResolvedValue({ ...usuarioFake, activo: false });

            await expect(useCase.promover(inputPromover)).rejects.toThrow(ConflictError);
        });

        it('debe lanzar ConflictError si el usuario ya es empleado activo', async () => {
            mockUsuarioRepo.buscarPorId.mockResolvedValue(usuarioFake);
            mockEmpleadoRepo.buscarPorIdUsuario.mockResolvedValue(empleadoFake); // activo: true

            await expect(useCase.promover(inputPromover)).rejects.toThrow(ConflictError);
        });

        it('debe lanzar ConflictError si el usuario ya fue empleado pero está inactivo', async () => {
            mockUsuarioRepo.buscarPorId.mockResolvedValue(usuarioFake);
            mockEmpleadoRepo.buscarPorIdUsuario.mockResolvedValue({ ...empleadoFake, activo: false });

            await expect(useCase.promover(inputPromover)).rejects.toThrow(ConflictError);
        });

        it('debe promover el usuario si todas las validaciones pasan', async () => {
            mockUsuarioRepo.buscarPorId.mockResolvedValue(usuarioFake);
            mockEmpleadoRepo.buscarPorIdUsuario.mockResolvedValue(null);
            mockEmpleadoRepo.promover.mockResolvedValue(empleadoFake);

            const result = await useCase.promover(inputPromover);

            expect(mockEmpleadoRepo.promover).toHaveBeenCalledWith(inputPromover);
            expect(result).toEqual(empleadoFake);
        });
    });

    describe('desactivar', () => {

        it('debe lanzar NotFoundError si el empleado no existe', async () => {
            mockEmpleadoRepo.buscarPorId.mockResolvedValue(null);

            await expect(useCase.desactivar(99)).rejects.toThrow(NotFoundError);
        });

        it('debe lanzar ConflictError si el empleado ya está desactivado', async () => {
            mockEmpleadoRepo.buscarPorId.mockResolvedValue({ ...empleadoFake, activo: false });

            await expect(useCase.desactivar(1)).rejects.toThrow(ConflictError);
        });

        it('debe llamar desactivar cuando el empleado existe y está activo', async () => {
            mockEmpleadoRepo.buscarPorId.mockResolvedValue(empleadoFake);
            mockEmpleadoRepo.desactivar.mockResolvedValue();

            await useCase.desactivar(1);

            expect(mockEmpleadoRepo.desactivar).toHaveBeenCalledWith(1);
        });
    });

    describe('reactivar', () => {

        it('debe lanzar NotFoundError si el empleado no existe', async () => {
            mockEmpleadoRepo.buscarPorId.mockResolvedValue(null);
            await expect(useCase.reactivar(99)).rejects.toThrow(NotFoundError);
        });

        it('debe lanzar ConflictError si el empleado ya está activo', async () => {
            mockEmpleadoRepo.buscarPorId.mockResolvedValue(empleadoFake); // activo: true
            await expect(useCase.reactivar(1)).rejects.toThrow(ConflictError);
        });

        it('debe llamar reactivar cuando el empleado existe y está inactivo', async () => {
            mockEmpleadoRepo.buscarPorId.mockResolvedValue({ ...empleadoFake, activo: false });
            mockEmpleadoRepo.reactivar.mockResolvedValue();
            await useCase.reactivar(1);
            expect(mockEmpleadoRepo.reactivar).toHaveBeenCalledWith(1);
        });
    });
});

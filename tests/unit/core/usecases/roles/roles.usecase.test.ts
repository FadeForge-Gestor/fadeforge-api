import { RolesUseCase } from '@core/usecases/roles/roles.usecase';
import { IRolRepository } from '@core/ports/out/roles/IRolRepository';
import { Rol } from '@core/domain/rol/rol.entity';
import { NotFoundError, ConflictError } from '@shared/errors/HttpError';

const rolFake: Rol = {
    id: 1,
    clave: 'admin',
    nombre: 'Administrador',
    descripcion: null,
    activo: true,
    fechaCreacion: new Date(),
    fechaModificacion: new Date(),
};

const mockRepo: jest.Mocked<IRolRepository> = {
    listarTodos: jest.fn(),
    listarActivos: jest.fn(),
    buscarPorId: jest.fn(),
    buscarPorNombre: jest.fn(),
    buscarPorClave: jest.fn(),
    crear: jest.fn(),
    actualizar: jest.fn(),
    desactivar: jest.fn(),
    reactivar: jest.fn(),
};

describe('RolesUseCase', () => {

    let useCase: RolesUseCase;

    beforeEach(() => {
        jest.clearAllMocks();
        useCase = new RolesUseCase(mockRepo);
    });

    describe('obtenerPorId', () => {

        it('debe retornar el rol si existe', async () => {
            mockRepo.buscarPorId.mockResolvedValue(rolFake);

            const result = await useCase.obtenerPorId(1);

            expect(result).toEqual(rolFake);
        });

        it('debe lanzar NotFoundError si el rol no existe', async () => {
            mockRepo.buscarPorId.mockResolvedValue(null);

            await expect(useCase.obtenerPorId(99)).rejects.toThrow(NotFoundError);
        });
    });

    describe('crear', () => {

        it('debe lanzar ConflictError si el nombre ya existe', async () => {
            mockRepo.buscarPorNombre.mockResolvedValue(rolFake);

            await expect(useCase.crear({ clave: 'admin', nombre: 'Administrador' })).rejects.toThrow(ConflictError);
        });

        it('debe lanzar ConflictError si la clave ya existe', async () => {
            mockRepo.buscarPorNombre.mockResolvedValue(null);
            mockRepo.buscarPorClave.mockResolvedValue(rolFake);

            await expect(useCase.crear({ clave: 'admin', nombre: 'Nuevo' })).rejects.toThrow(ConflictError);
        });

        it('debe crear el rol si nombre y clave no existen', async () => {
            mockRepo.buscarPorNombre.mockResolvedValue(null);
            mockRepo.buscarPorClave.mockResolvedValue(null);
            mockRepo.crear.mockResolvedValue(rolFake);

            const result = await useCase.crear({ clave: 'admin', nombre: 'Administrador' });

            expect(mockRepo.crear).toHaveBeenCalledTimes(1);
            expect(result).toEqual(rolFake);
        });
    });

    describe('actualizar', () => {

        it('debe lanzar NotFoundError si el rol no existe', async () => {
            mockRepo.buscarPorId.mockResolvedValue(null);

            await expect(useCase.actualizar(99, { nombre: 'Nuevo' })).rejects.toThrow(NotFoundError);
        });

        it('debe lanzar ConflictError si el rol está desactivado', async () => {
            mockRepo.buscarPorId.mockResolvedValue({ ...rolFake, activo: false });

            await expect(useCase.actualizar(1, { nombre: 'Nuevo' })).rejects.toThrow(ConflictError);
        });

        it('debe lanzar ConflictError si el nombre ya lo usa otro rol', async () => {
            mockRepo.buscarPorId.mockResolvedValue(rolFake);
            mockRepo.buscarPorNombre.mockResolvedValue({ ...rolFake, id: 2 });

            await expect(useCase.actualizar(1, { nombre: 'Administrador' })).rejects.toThrow(ConflictError);
        });

        it('debe lanzar ConflictError si la clave ya la usa otro rol', async () => {
            mockRepo.buscarPorId.mockResolvedValue(rolFake);
            mockRepo.buscarPorNombre.mockResolvedValue(null);
            mockRepo.buscarPorClave.mockResolvedValue({ ...rolFake, id: 2 });

            await expect(useCase.actualizar(1, { clave: 'admin' })).rejects.toThrow(ConflictError);
        });

        it('debe actualizar si todo es válido', async () => {
            mockRepo.buscarPorId.mockResolvedValue(rolFake);
            mockRepo.buscarPorNombre.mockResolvedValue(null);
            mockRepo.buscarPorClave.mockResolvedValue(null);
            mockRepo.actualizar.mockResolvedValue({ ...rolFake, nombre: 'Nuevo' });

            const result = await useCase.actualizar(1, { nombre: 'Nuevo' });

            expect(mockRepo.actualizar).toHaveBeenCalledWith(1, { nombre: 'Nuevo' });
            expect(result.nombre).toBe('Nuevo');
        });
    });

    describe('desactivar', () => {

        it('debe lanzar NotFoundError si el rol no existe', async () => {
            mockRepo.buscarPorId.mockResolvedValue(null);

            await expect(useCase.desactivar(99)).rejects.toThrow(NotFoundError);
        });

        it('debe lanzar ConflictError si el rol ya está desactivado', async () => {
            mockRepo.buscarPorId.mockResolvedValue({ ...rolFake, activo: false });

            await expect(useCase.desactivar(1)).rejects.toThrow(ConflictError);
        });

        it('debe llamar desactivar cuando el rol existe y está activo', async () => {
            mockRepo.buscarPorId.mockResolvedValue(rolFake);
            mockRepo.desactivar.mockResolvedValue();

            await useCase.desactivar(1);

            expect(mockRepo.desactivar).toHaveBeenCalledWith(1);
        });
    });

    describe('reactivar', () => {

        it('debe lanzar NotFoundError si el rol no existe', async () => {
            mockRepo.buscarPorId.mockResolvedValue(null);

            await expect(useCase.reactivar(99)).rejects.toThrow(NotFoundError);
        });

        it('debe lanzar ConflictError si el rol ya está activo', async () => {
            mockRepo.buscarPorId.mockResolvedValue(rolFake);

            await expect(useCase.reactivar(1)).rejects.toThrow(ConflictError);
        });

        it('debe llamar reactivar cuando el rol existe y está inactivo', async () => {
            mockRepo.buscarPorId.mockResolvedValue({ ...rolFake, activo: false });
            mockRepo.reactivar.mockResolvedValue();

            await useCase.reactivar(1);

            expect(mockRepo.reactivar).toHaveBeenCalledWith(1);
        });
    });

    describe('listar', () => {

        it('debe retornar todos los roles', async () => {
            mockRepo.listarTodos.mockResolvedValue([rolFake]);

            const result = await useCase.listar();

            expect(mockRepo.listarTodos).toHaveBeenCalled();
            expect(result).toEqual([rolFake]);
        });
    });

    describe('listarActivos', () => {

        it('debe retornar los roles activos', async () => {
            mockRepo.listarActivos.mockResolvedValue([rolFake]);

            const result = await useCase.listarActivos();

            expect(mockRepo.listarActivos).toHaveBeenCalled();
            expect(result).toEqual([rolFake]);
        });
    });
});

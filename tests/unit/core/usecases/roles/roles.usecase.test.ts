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
};

const mockRepo: jest.Mocked<IRolRepository> = {
    listarTodos: jest.fn(),
    buscarPorId: jest.fn(),
    crear: jest.fn(),
    actualizar: jest.fn(),
    desactivar: jest.fn(),
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

    describe('eliminar', () => {

        it('debe lanzar NotFoundError si el rol no existe', async () => {
            mockRepo.buscarPorId.mockResolvedValue(null);

            await expect(useCase.eliminar(99)).rejects.toThrow(NotFoundError);
        });

        it('debe lanzar ConflictError si el rol ya está desactivado', async () => {
            mockRepo.buscarPorId.mockResolvedValue({ ...rolFake, activo: false });

            await expect(useCase.eliminar(1)).rejects.toThrow(ConflictError);
        });

        it('debe llamar desactivar cuando el rol existe y está activo', async () => {
            mockRepo.buscarPorId.mockResolvedValue(rolFake);
            mockRepo.desactivar.mockResolvedValue();

            await useCase.eliminar(1);

            expect(mockRepo.desactivar).toHaveBeenCalledWith(1);
        });
    });
});

import { RolesUseCase } from '@core/usecases/roles/roles.usecase';
import { IRolRepository } from '@core/ports/out/roles/IRolRepository';
import { Rol } from '@core/domain/rol/rol.entity';
import { NotFoundError } from '@shared/errors/HttpError';

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
    buscarPorId: jest.fn(),
    buscarPorClave: jest.fn(),
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

    describe('listar', () => {

        it('debe retornar todos los roles', async () => {
            mockRepo.listarTodos.mockResolvedValue([rolFake]);

            const result = await useCase.listar();

            expect(mockRepo.listarTodos).toHaveBeenCalled();
            expect(result).toEqual([rolFake]);
        });
    });

});

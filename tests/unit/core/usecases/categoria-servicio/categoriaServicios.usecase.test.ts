import { CategoriasServiciosUseCase } from '@core/usecases/categorias-servicios/categoriaServicios.usecase';
import { ICategoriaServicioRepository } from '@core/ports/out/categoria-servicio/ICategoriaServicioRepository';
import { CategoriaServicio } from '@core/domain/categoria-servicio/categoriaServicio.entity';
import { NotFoundError, ConflictError } from '@shared/errors/HttpError';

const categoriaFake: CategoriaServicio = {
    id: 1,
    nombre: 'Cortes',
    descripcion: null,
    activo: true,
    fechaCreacion: new Date(),
    fechaModificacion: new Date(),
};

const mockRepo: jest.Mocked<ICategoriaServicioRepository> = {
    listarTodos: jest.fn(),
    listarActivos: jest.fn(),
    buscarPorId: jest.fn(),
    buscarPorNombre: jest.fn(),
    crear: jest.fn(),
    actualizar: jest.fn(),
    desactivar: jest.fn(),
};

describe('CategoriasServiciosUseCase', () => {

    let useCase: CategoriasServiciosUseCase;

    beforeEach(() => {
        jest.clearAllMocks();
        useCase = new CategoriasServiciosUseCase(mockRepo);
    });

    describe('obtenerPorId', () => {

        it('debe retornar la categoría si existe', async () => {
            mockRepo.buscarPorId.mockResolvedValue(categoriaFake);

            const result = await useCase.obtenerPorId(1);

            expect(result).toEqual(categoriaFake);
        });

        it('debe lanzar NotFoundError si la categoría no existe', async () => {
            mockRepo.buscarPorId.mockResolvedValue(null);

            await expect(useCase.obtenerPorId(99)).rejects.toThrow(NotFoundError);
        });
    });

    describe('crear', () => {

        it('debe lanzar ConflictError si el nombre ya existe', async () => {
            mockRepo.buscarPorNombre.mockResolvedValue(categoriaFake);

            await expect(useCase.crear({ nombre: 'Cortes' })).rejects.toThrow(ConflictError);
        });

        it('debe crear la categoría si el nombre no existe', async () => {
            mockRepo.buscarPorNombre.mockResolvedValue(null);
            mockRepo.crear.mockResolvedValue(categoriaFake);

            const result = await useCase.crear({ nombre: 'Cortes' });

            expect(mockRepo.crear).toHaveBeenCalledTimes(1);
            expect(result).toEqual(categoriaFake);
        });
    });

    describe('actualizar', () => {

        it('debe lanzar NotFoundError si la categoría no existe', async () => {
            mockRepo.buscarPorId.mockResolvedValue(null);

            await expect(useCase.actualizar(99, { nombre: 'Nuevo' })).rejects.toThrow(NotFoundError);
        });

        it('debe lanzar ConflictError si la categoría está desactivada', async () => {
            mockRepo.buscarPorId.mockResolvedValue({ ...categoriaFake, activo: false });

            await expect(useCase.actualizar(1, { nombre: 'Nuevo' })).rejects.toThrow(ConflictError);
        });

        it('debe lanzar ConflictError si el nombre ya lo usa otra categoría', async () => {
            mockRepo.buscarPorId.mockResolvedValue(categoriaFake);
            mockRepo.buscarPorNombre.mockResolvedValue({ ...categoriaFake, id: 2 });

            await expect(useCase.actualizar(1, { nombre: 'Cortes' })).rejects.toThrow(ConflictError);
        });

        it('debe actualizar si todo es válido', async () => {
            mockRepo.buscarPorId.mockResolvedValue(categoriaFake);
            mockRepo.buscarPorNombre.mockResolvedValue(null);
            mockRepo.actualizar.mockResolvedValue({ ...categoriaFake, nombre: 'Coloración' });

            const result = await useCase.actualizar(1, { nombre: 'Coloración' });

            expect(mockRepo.actualizar).toHaveBeenCalledWith(1, { nombre: 'Coloración' });
            expect(result.nombre).toBe('Coloración');
        });
    });

    describe('desactivar', () => {

        it('debe lanzar NotFoundError si la categoría no existe', async () => {
            mockRepo.buscarPorId.mockResolvedValue(null);

            await expect(useCase.desactivar(99)).rejects.toThrow(NotFoundError);
        });

        it('debe lanzar ConflictError si la categoría ya está desactivada', async () => {
            mockRepo.buscarPorId.mockResolvedValue({ ...categoriaFake, activo: false });

            await expect(useCase.desactivar(1)).rejects.toThrow(ConflictError);
        });

        it('debe llamar desactivar cuando la categoría existe y está activa', async () => {
            mockRepo.buscarPorId.mockResolvedValue(categoriaFake);
            mockRepo.desactivar.mockResolvedValue();

            await useCase.desactivar(1);

            expect(mockRepo.desactivar).toHaveBeenCalledWith(1);
        });
    });
});

import { HistorialPrecioUseCase } from '@core/usecases/historial-precio/historialPrecio.usecase';
import { IHistorialPrecioRepository } from '@core/ports/out/historial-precio/IHistorialPrecioRepository';
import { HistorialPrecio } from '@core/domain/historial-precio/historialPrecio.entity';
import { BadRequestError } from '@shared/errors/HttpError';

const historialFake: HistorialPrecio = {
    id: 1,
    idServicio: 3,
    precio: 1500,
    fechaInicio: new Date(),
    fechaFin: null,
};

const mockRepo: jest.Mocked<IHistorialPrecioRepository> = {
    listarPorServicio: jest.fn(),
    buscarPrecioActual: jest.fn(),
    cerrarPrecioActual: jest.fn(),
    crear: jest.fn(),
};

describe('HistorialPrecioUseCase', () => {

    let useCase: HistorialPrecioUseCase;

    beforeEach(() => {
        jest.clearAllMocks();
        useCase = new HistorialPrecioUseCase(mockRepo);
    });

    describe('listarPorServicio', () => {

        it('debe retornar el historial de precios del servicio', async () => {
            mockRepo.listarPorServicio.mockResolvedValue([historialFake]);

            const result = await useCase.listarPorServicio(3);

            expect(mockRepo.listarPorServicio).toHaveBeenCalledWith(3);
            expect(result).toEqual([historialFake]);
        });

        it('debe retornar un array vacío si el servicio no tiene historial', async () => {
            mockRepo.listarPorServicio.mockResolvedValue([]);

            const result = await useCase.listarPorServicio(99);

            expect(result).toEqual([]);
        });
    });

    describe('obtenerPrecioActual', () => {

        it('debe retornar el precio actual si existe', async () => {
            mockRepo.buscarPrecioActual.mockResolvedValue(1500);

            const result = await useCase.obtenerPrecioActual(3);

            expect(mockRepo.buscarPrecioActual).toHaveBeenCalledWith(3);
            expect(result).toBe(1500);
        });

        it('debe retornar null si el servicio no tiene precio vigente', async () => {
            mockRepo.buscarPrecioActual.mockResolvedValue(null);

            const result = await useCase.obtenerPrecioActual(99);

            expect(result).toBeNull();
        });
    });

    describe('registrarPrecio', () => {

        it('debe lanzar BadRequestError si el precio es 0', async () => {
            await expect(useCase.registrarPrecio({ idServicio: 3, precio: 0 }))
                .rejects.toThrow(BadRequestError);
        });

        it('debe lanzar BadRequestError si el precio es negativo', async () => {
            await expect(useCase.registrarPrecio({ idServicio: 3, precio: -100 }))
                .rejects.toThrow(BadRequestError);
        });

        it('debe cerrar el precio anterior antes de crear el nuevo', async () => {
            mockRepo.cerrarPrecioActual.mockResolvedValue(undefined);
            mockRepo.crear.mockResolvedValue(historialFake);

            await useCase.registrarPrecio({ idServicio: 3, precio: 1500 });

            const cerrarOrder = mockRepo.cerrarPrecioActual.mock.invocationCallOrder[0];
            const crearOrder = mockRepo.crear.mock.invocationCallOrder[0];
            expect(cerrarOrder).toBeLessThan(crearOrder);
        });

        it('debe llamar cerrarPrecioActual con el idServicio correcto', async () => {
            mockRepo.cerrarPrecioActual.mockResolvedValue(undefined);
            mockRepo.crear.mockResolvedValue(historialFake);

            await useCase.registrarPrecio({ idServicio: 3, precio: 1500 });

            expect(mockRepo.cerrarPrecioActual).toHaveBeenCalledWith(3);
        });

        it('debe retornar el nuevo historial creado', async () => {
            mockRepo.cerrarPrecioActual.mockResolvedValue(undefined);
            mockRepo.crear.mockResolvedValue(historialFake);

            const result = await useCase.registrarPrecio({ idServicio: 3, precio: 1500 });

            expect(mockRepo.crear).toHaveBeenCalledWith({ idServicio: 3, precio: 1500 });
            expect(result).toEqual(historialFake);
        });
    });
});

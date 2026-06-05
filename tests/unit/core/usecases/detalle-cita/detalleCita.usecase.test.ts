import { DetalleCitaUseCase } from '@core/usecases/detalle-cita/detalleCita.usecase';
import { IDetalleCitaRepository } from '@core/ports/out/detalle-cita/IDetalleCitaRepository';
import { DetalleCita } from '@core/domain/detalle-cita/detalleCita.entity';

const detalleFake: DetalleCita = {
    id: 1,
    idCita: 1,
    idServicio: 1,
    precioAplicado: 250,
    duracionMinutos: 30,
};

const mockRepo: jest.Mocked<IDetalleCitaRepository> = {
    listarPorCita: jest.fn(),
};

describe('DetalleCitaUseCase', () => {

    let useCase: DetalleCitaUseCase;

    beforeEach(() => {
        jest.clearAllMocks();
        useCase = new DetalleCitaUseCase(mockRepo);
    });

    describe('listarPorCita', () => {

        it('debe retornar los detalles de una cita', async () => {
            mockRepo.listarPorCita.mockResolvedValue([detalleFake]);

            const result = await useCase.listarPorCita(1);

            expect(mockRepo.listarPorCita).toHaveBeenCalledWith(1);
            expect(result).toEqual([detalleFake]);
        });

        it('debe retornar un array vacío si la cita no tiene detalles', async () => {
            mockRepo.listarPorCita.mockResolvedValue([]);

            const result = await useCase.listarPorCita(99);

            expect(result).toEqual([]);
        });
    });
});

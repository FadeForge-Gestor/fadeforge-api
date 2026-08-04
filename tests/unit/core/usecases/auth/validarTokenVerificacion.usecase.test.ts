import { ValidarTokenVerificacionUseCase } from '@core/usecases/auth/validarTokenVerificacion.usecase';
import { ITokenVerificacionRepository } from '@core/ports/out/email/ITokenVerificacionRepository';

const mockTokenVerificacionRepo: jest.Mocked<ITokenVerificacionRepository> = {
    crear: jest.fn(),
    buscarPorToken: jest.fn(),
    buscarTokenValido: jest.fn(),
    eliminarPorIdUsuario: jest.fn(),
    contarEnviosHoy: jest.fn(),
};

describe('ValidarTokenVerificacionUseCase', () => {
    let useCase: ValidarTokenVerificacionUseCase;

    beforeEach(() => {
        jest.clearAllMocks();
        useCase = new ValidarTokenVerificacionUseCase(mockTokenVerificacionRepo);
    });

    it('debe devolver { valido: true } con un token válido y no expirado', async () => {
        const futuro = new Date();
        futuro.setHours(futuro.getHours() + 1);

        mockTokenVerificacionRepo.buscarTokenValido.mockResolvedValue({
            idUsuario: 1,
            expiraEn: futuro,
        });

        const resultado = await useCase.validar('token-plano-123');

        expect(resultado).toEqual({ valido: true });
        expect(mockTokenVerificacionRepo.buscarTokenValido).toHaveBeenCalledWith('token-plano-123');
    });

    it('debe devolver { valido: false } con un token expirado', async () => {
        const pasado = new Date();
        pasado.setHours(pasado.getHours() - 1);

        mockTokenVerificacionRepo.buscarTokenValido.mockResolvedValue({
            idUsuario: 1,
            expiraEn: pasado,
        });

        const resultado = await useCase.validar('token-expirado');

        expect(resultado).toEqual({ valido: false });
    });

    it('debe devolver { valido: false } con un token inexistente', async () => {
        mockTokenVerificacionRepo.buscarTokenValido.mockResolvedValue(null);

        const resultado = await useCase.validar('token-inexistente');

        expect(resultado).toEqual({ valido: false });
    });

    it('NUNCA debe mutar: no elimina tokens ni actualiza email_verificado (read-only)', async () => {
        const futuro = new Date();
        futuro.setHours(futuro.getHours() + 1);

        mockTokenVerificacionRepo.buscarTokenValido.mockResolvedValue({
            idUsuario: 1,
            expiraEn: futuro,
        });

        await useCase.validar('token-plano-123');

        expect(mockTokenVerificacionRepo.eliminarPorIdUsuario).not.toHaveBeenCalled();
        expect(mockTokenVerificacionRepo.buscarPorToken).not.toHaveBeenCalled();
    });
});

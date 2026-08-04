import { ConfirmarEmailUseCase } from '@core/usecases/auth/confirmarEmail.usecase';
import { ITokenVerificacionRepository } from '@core/ports/out/email/ITokenVerificacionRepository';
import { ICredencialRepository } from '@core/ports/out/credenciales/ICredencialRepository';
import { BadRequestError } from '@shared/errors/HttpError';

const mockTokenVerificacionRepo: jest.Mocked<ITokenVerificacionRepository> = {
    crear: jest.fn(),
    buscarPorToken: jest.fn(),
    buscarTokenValido: jest.fn(),
    eliminarPorIdUsuario: jest.fn(),
    contarEnviosHoy: jest.fn(),
};

const mockCredencialRepo: jest.Mocked<ICredencialRepository> = {
    buscarPorIdUsuario: jest.fn(),
    buscarPorCorreo: jest.fn(),
    actualizarContrasena: jest.fn(),
    actualizarCorreo: jest.fn(),
    actualizarEmailVerificado: jest.fn(),
};

describe('ConfirmarEmailUseCase', () => {
    let useCase: ConfirmarEmailUseCase;

    beforeEach(() => {
        jest.clearAllMocks();
        useCase = new ConfirmarEmailUseCase(mockTokenVerificacionRepo, mockCredencialRepo);
    });

    it('debe marcar email como verificado con token válido', async () => {
        const futuro = new Date();
        futuro.setHours(futuro.getHours() + 1);

        mockTokenVerificacionRepo.buscarPorToken.mockResolvedValue({
            idUsuario: 1,
            expiraEn: futuro,
        });

        await useCase.confirmar('token-plano-123');

        expect(mockTokenVerificacionRepo.buscarPorToken).toHaveBeenCalledWith('token-plano-123');
        expect(mockTokenVerificacionRepo.eliminarPorIdUsuario).toHaveBeenCalledWith(1);
        expect(mockCredencialRepo.actualizarEmailVerificado).toHaveBeenCalledWith(1, true);
    });

    it('debe lanzar BadRequestError si el token no existe', async () => {
        mockTokenVerificacionRepo.buscarPorToken.mockResolvedValue(null);

        await expect(useCase.confirmar('token-inexistente')).rejects.toThrow(BadRequestError);
    });

    it('debe lanzar BadRequestError si el token expiró', async () => {
        const pasado = new Date();
        pasado.setHours(pasado.getHours() - 1);

        mockTokenVerificacionRepo.buscarPorToken.mockResolvedValue({
            idUsuario: 1,
            expiraEn: pasado,
        });

        await expect(useCase.confirmar('token-expirado')).rejects.toThrow(BadRequestError);
        expect(mockTokenVerificacionRepo.eliminarPorIdUsuario).toHaveBeenCalledWith(1);
    });

    it('debe lanzar BadRequestError al reutilizar un token ya consumido (un solo uso)', async () => {
        const futuro = new Date();
        futuro.setHours(futuro.getHours() + 1);

        // Primer POST exitoso: el token existe y se consume (se elimina en BD).
        mockTokenVerificacionRepo.buscarPorToken.mockResolvedValueOnce({
            idUsuario: 1,
            expiraEn: futuro,
        });
        // Reintento con el mismo token: ya no existe en BD → inválido.
        mockTokenVerificacionRepo.buscarPorToken.mockResolvedValueOnce(null);

        await useCase.confirmar('token-plano-123');
        await expect(useCase.confirmar('token-plano-123')).rejects.toThrow(BadRequestError);
    });
});

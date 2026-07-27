import bcrypt from 'bcrypt';
import { ConfirmarEmailUseCase } from '@core/usecases/auth/confirmarEmail.usecase';
import { ITokenVerificacionRepository } from '@core/ports/out/email/ITokenVerificacionRepository';
import { ICredencialRepository } from '@core/ports/out/credenciales/ICredencialRepository';
import { BadRequestError } from '@shared/errors/HttpError';

jest.mock('bcrypt');

const mockedBcrypt = jest.mocked(bcrypt);

const mockTokenVerificacionRepo: jest.Mocked<ITokenVerificacionRepository> = {
    crear: jest.fn(),
    buscarPorTokenHash: jest.fn(),
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

        mockedBcrypt.hash = jest.fn().mockResolvedValue('hash_token' as never);
        mockTokenVerificacionRepo.buscarPorTokenHash.mockResolvedValue({
            idUsuario: 1,
            expiraEn: futuro,
        });

        await useCase.confirmar('token-plano-123');

        expect(mockTokenVerificacionRepo.eliminarPorIdUsuario).toHaveBeenCalledWith(1);
        expect(mockCredencialRepo.actualizarEmailVerificado).toHaveBeenCalledWith(1, true);
    });

    it('debe lanzar BadRequestError si el token no existe', async () => {
        mockedBcrypt.hash = jest.fn().mockResolvedValue('hash_token' as never);
        mockTokenVerificacionRepo.buscarPorTokenHash.mockResolvedValue(null);

        await expect(useCase.confirmar('token-inexistente')).rejects.toThrow(BadRequestError);
    });

    it('debe lanzar BadRequestError si el token expiró', async () => {
        const pasado = new Date();
        pasado.setHours(pasado.getHours() - 1);

        mockedBcrypt.hash = jest.fn().mockResolvedValue('hash_token' as never);
        mockTokenVerificacionRepo.buscarPorTokenHash.mockResolvedValue({
            idUsuario: 1,
            expiraEn: pasado,
        });

        await expect(useCase.confirmar('token-expirado')).rejects.toThrow(BadRequestError);
        expect(mockTokenVerificacionRepo.eliminarPorIdUsuario).toHaveBeenCalledWith(1);
    });
});

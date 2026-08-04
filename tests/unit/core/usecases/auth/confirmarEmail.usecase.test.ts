import { ConfirmarEmailUseCase } from '@core/usecases/auth/confirmarEmail.usecase';
import { ITokenVerificacionRepository } from '@core/ports/out/email/ITokenVerificacionRepository';
import { ICredencialRepository } from '@core/ports/out/credenciales/ICredencialRepository';
import { IUsuarioRepository } from '@core/ports/out/usuarios/IUsuarioRepository';
import { IEmailService } from '@core/ports/out/email/IEmailService';
import { Usuario } from '@core/domain/usuario/usuario.entity';
import { CredencialRaw } from '@core/domain/credencial/credencial.entity';
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

const mockUsuarioRepo: jest.Mocked<IUsuarioRepository> = {
    listarTodos: jest.fn(),
    buscarPorId: jest.fn(),
    buscarPorCorreo: jest.fn(),
    crear: jest.fn(),
    actualizar: jest.fn(),
    desactivar: jest.fn(),
    reactivar: jest.fn(),
};

const mockEmailService: jest.Mocked<IEmailService> = {
    enviarVerificacion: jest.fn(),
    enviarBienvenida: jest.fn(),
};

const usuarioFake: Usuario = {
    id: 1,
    nombre: 'Vicente',
    aPaterno: 'Code',
    aMaterno: null,
    telefono: '12345678',
    idRol: 3,
    activo: true,
    fechaCreacion: new Date(),
    fechaModificacion: new Date(),
};

const credencialFake: CredencialRaw = {
    idUsuario: 1,
    correo: 'vicente@example.com',
    hashContrasena: 'hash-plano',
    emailVerificado: true,
};

describe('ConfirmarEmailUseCase', () => {
    let useCase: ConfirmarEmailUseCase;

    beforeEach(() => {
        jest.clearAllMocks();
        useCase = new ConfirmarEmailUseCase(
            mockTokenVerificacionRepo,
            mockCredencialRepo,
            mockUsuarioRepo,
            mockEmailService,
        );
    });

    it('debe marcar email como verificado con token válido', async () => {
        const futuro = new Date();
        futuro.setHours(futuro.getHours() + 1);

        mockTokenVerificacionRepo.buscarPorToken.mockResolvedValue({
            idUsuario: 1,
            expiraEn: futuro,
        });
        mockUsuarioRepo.buscarPorId.mockResolvedValue(usuarioFake);
        mockCredencialRepo.buscarPorIdUsuario.mockResolvedValue(credencialFake);

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
        mockUsuarioRepo.buscarPorId.mockResolvedValue(usuarioFake);
        mockCredencialRepo.buscarPorIdUsuario.mockResolvedValue(credencialFake);
        // Reintento con el mismo token: ya no existe en BD → inválido.
        mockTokenVerificacionRepo.buscarPorToken.mockResolvedValueOnce(null);

        await useCase.confirmar('token-plano-123');
        await expect(useCase.confirmar('token-plano-123')).rejects.toThrow(BadRequestError);
        // La bienvenida se envía una sola vez (solo el primer consumo envía).
        expect(mockEmailService.enviarBienvenida).toHaveBeenCalledTimes(1);
    });

    it('debe enviar la bienvenida con el correo de la credencial y el nombre del usuario tras verificar', async () => {
        const futuro = new Date();
        futuro.setHours(futuro.getHours() + 1);

        mockTokenVerificacionRepo.buscarPorToken.mockResolvedValue({
            idUsuario: 1,
            expiraEn: futuro,
        });
        mockUsuarioRepo.buscarPorId.mockResolvedValue(usuarioFake);
        mockCredencialRepo.buscarPorIdUsuario.mockResolvedValue(credencialFake);

        await useCase.confirmar('token-plano-123');

        expect(mockEmailService.enviarBienvenida).toHaveBeenCalledTimes(1);
        expect(mockEmailService.enviarBienvenida).toHaveBeenCalledWith(
            credencialFake.correo,
            usuarioFake.nombre,
        );
    });

    it('debe enviar la bienvenida DESPUÉS de que la verificación quedó persistida', async () => {
        const futuro = new Date();
        futuro.setHours(futuro.getHours() + 1);

        mockTokenVerificacionRepo.buscarPorToken.mockResolvedValue({
            idUsuario: 1,
            expiraEn: futuro,
        });
        mockUsuarioRepo.buscarPorId.mockResolvedValue(usuarioFake);
        mockCredencialRepo.buscarPorIdUsuario.mockResolvedValue(credencialFake);

        await useCase.confirmar('token-plano-123');

        const orden = [
            mockTokenVerificacionRepo.eliminarPorIdUsuario.mock.invocationCallOrder[0],
            mockCredencialRepo.actualizarEmailVerificado.mock.invocationCallOrder[0],
            mockEmailService.enviarBienvenida.mock.invocationCallOrder[0],
        ];
        expect(orden).toEqual([...orden].sort((a, b) => a - b));
    });

    it('no debe lanzar si el envío de la bienvenida falla (side-effect, la verificación ya quedó hecha)', async () => {
        const futuro = new Date();
        futuro.setHours(futuro.getHours() + 1);

        mockTokenVerificacionRepo.buscarPorToken.mockResolvedValue({
            idUsuario: 1,
            expiraEn: futuro,
        });
        mockUsuarioRepo.buscarPorId.mockResolvedValue(usuarioFake);
        mockCredencialRepo.buscarPorIdUsuario.mockResolvedValue(credencialFake);
        mockEmailService.enviarBienvenida.mockRejectedValue(new Error('Resend caído'));

        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

        await expect(useCase.confirmar('token-plano-123')).resolves.toBeUndefined();
        expect(mockCredencialRepo.actualizarEmailVerificado).toHaveBeenCalledWith(1, true);
        expect(consoleErrorSpy).toHaveBeenCalled();

        consoleErrorSpy.mockRestore();
    });

    it('no debe enviar la bienvenida si el usuario no existe (defensivo, la verificación no se revierte)', async () => {
        const futuro = new Date();
        futuro.setHours(futuro.getHours() + 1);

        mockTokenVerificacionRepo.buscarPorToken.mockResolvedValue({
            idUsuario: 1,
            expiraEn: futuro,
        });
        mockUsuarioRepo.buscarPorId.mockResolvedValue(null);
        mockCredencialRepo.buscarPorIdUsuario.mockResolvedValue(credencialFake);

        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

        await expect(useCase.confirmar('token-plano-123')).resolves.toBeUndefined();
        expect(mockEmailService.enviarBienvenida).not.toHaveBeenCalled();

        consoleErrorSpy.mockRestore();
    });
});

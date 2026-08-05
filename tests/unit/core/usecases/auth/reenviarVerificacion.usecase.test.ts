import { ReenviarVerificacionUseCase } from '@core/usecases/auth/reenviarVerificacion.usecase';
import { ITokenVerificacionRepository } from '@core/ports/out/email/ITokenVerificacionRepository';
import { IEmailService } from '@core/ports/out/email/IEmailService';
import { IUsuarioRepository } from '@core/ports/out/usuarios/IUsuarioRepository';
import { ICredencialRepository } from '@core/ports/out/credenciales/ICredencialRepository';
import { Usuario } from '@core/domain/usuario/usuario.entity';
import { CredencialRaw } from '@core/domain/credencial/credencial.entity';
import { NotFoundError, BadRequestError, TooManyRequestsError } from '@shared/errors/HttpError';

const usuarioFake: Usuario = {
    id: 1,
    nombre: 'Juan',
    aPaterno: 'Pérez',
    aMaterno: null,
    telefono: '5512345678',
    idRol: 3,
    activo: true,
    fechaCreacion: new Date(),
    fechaModificacion: new Date(),
};

const credencialFake: CredencialRaw = {
    idUsuario: 1,
    correo: 'juan@test.com',
    hashContrasena: 'hash',
    emailVerificado: false,
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

const mockCredencialRepo: jest.Mocked<ICredencialRepository> = {
    buscarPorIdUsuario: jest.fn(),
    buscarPorCorreo: jest.fn(),
    actualizarContrasena: jest.fn(),
    actualizarCorreo: jest.fn(),
    actualizarEmailVerificado: jest.fn(),
};

const mockTokenVerificacionRepo: jest.Mocked<ITokenVerificacionRepository> = {
    crear: jest.fn(),
    buscarPorToken: jest.fn(),
    buscarTokenValido: jest.fn(),
    eliminarPorIdUsuario: jest.fn(),
    contarEnviosHoy: jest.fn(),
};

const mockEmailService: jest.Mocked<IEmailService> = {
    enviarVerificacion: jest.fn(),
    enviarBienvenida: jest.fn(),
};

describe('ReenviarVerificacionUseCase', () => {
    let useCase: ReenviarVerificacionUseCase;

    beforeEach(() => {
        jest.clearAllMocks();
        useCase = new ReenviarVerificacionUseCase(
            mockTokenVerificacionRepo,
            mockEmailService,
            mockUsuarioRepo,
            mockCredencialRepo,
        );
    });

    it('debe reenviar verificación exitosamente', async () => {
        mockUsuarioRepo.buscarPorCorreo.mockResolvedValue(usuarioFake);
        mockCredencialRepo.buscarPorIdUsuario.mockResolvedValue(credencialFake);
        mockTokenVerificacionRepo.contarEnviosHoy.mockResolvedValue(0);

        await useCase.reenviar('juan@test.com');

        expect(mockTokenVerificacionRepo.eliminarPorIdUsuario).toHaveBeenCalledWith(1);
        expect(mockTokenVerificacionRepo.crear).toHaveBeenCalledWith(
            1,
            expect.any(String),
            expect.any(Date)
        );
        // El token que se persiste es el mismo que llega al correo (el hashing es del repo).
        const tokenPersistido = mockTokenVerificacionRepo.crear.mock.calls[0][1];
        expect(mockEmailService.enviarVerificacion).toHaveBeenCalledWith(
            'juan@test.com',
            tokenPersistido
        );
    });

    it('debe lanzar NotFoundError si el correo no existe', async () => {
        mockUsuarioRepo.buscarPorCorreo.mockResolvedValue(null);

        await expect(useCase.reenviar('noexiste@test.com')).rejects.toThrow(NotFoundError);
    });

    it('debe lanzar BadRequestError si el correo ya está verificado', async () => {
        mockUsuarioRepo.buscarPorCorreo.mockResolvedValue(usuarioFake);
        mockCredencialRepo.buscarPorIdUsuario.mockResolvedValue({
            ...credencialFake,
            emailVerificado: true,
        });

        await expect(useCase.reenviar('juan@test.com')).rejects.toThrow(BadRequestError);
    });

    it('debe lanzar TooManyRequestsError si se alcanzó el límite de reenvíos', async () => {
        mockUsuarioRepo.buscarPorCorreo.mockResolvedValue(usuarioFake);
        mockCredencialRepo.buscarPorIdUsuario.mockResolvedValue(credencialFake);
        mockTokenVerificacionRepo.contarEnviosHoy.mockResolvedValue(3);

        await expect(useCase.reenviar('juan@test.com')).rejects.toThrow(TooManyRequestsError);
    });

    it('debe loguear el error de envío de email sin romper el reenvío (ya no se traga en silencio)', async () => {
        mockUsuarioRepo.buscarPorCorreo.mockResolvedValue(usuarioFake);
        mockCredencialRepo.buscarPorIdUsuario.mockResolvedValue(credencialFake);
        mockTokenVerificacionRepo.contarEnviosHoy.mockResolvedValue(0);
        mockEmailService.enviarVerificacion.mockRejectedValue(new Error('Resend caído'));

        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

        await useCase.reenviar('juan@test.com');

        expect(consoleErrorSpy).toHaveBeenCalledWith(
            expect.stringContaining('Error al enviar el correo de verificación a juan@test.com'),
            expect.any(Error)
        );
        consoleErrorSpy.mockRestore();
    });
});

import { CredencialUseCase } from '@core/usecases/credenciales/credenciales.usecase';
import { ICredencialRepository, CredencialRaw } from '@core/ports/out/credenciales/ICredencialRepository';
import { CambiarContrasenaInput, CambiarCorreoInput, ResetContrasenaInput } from '@core/domain/credencial/credencial.entity';
import { NotFoundError, UnauthorizedError, ConflictError } from '@shared/errors/HttpError';
import bcrypt from 'bcrypt';

jest.mock('bcrypt');

const credencialFake: CredencialRaw = {
    idUsuario: 1,
    correo: 'juan@test.com',
    hashContrasena: 'hash_secreto',
};

const mockRepo: jest.Mocked<ICredencialRepository> = {
    buscarPorIdUsuario: jest.fn(),
    buscarPorCorreo: jest.fn(),
    actualizarContrasena: jest.fn(),
    actualizarCorreo: jest.fn(),
};

describe('CredencialUseCase', () => {

    let useCase: CredencialUseCase;

    beforeEach(() => {
        jest.clearAllMocks();
        useCase = new CredencialUseCase(mockRepo);
    });

    describe('cambiarContrasena', () => {

        const input: CambiarContrasenaInput = {
            contrasenaActual: 'secreto123',
            nuevaContrasena: 'nuevo456',
        };

        it('debe lanzar NotFoundError si la credencial no existe', async () => {
            mockRepo.buscarPorIdUsuario.mockResolvedValue(null);

            await expect(useCase.cambiarContrasena(1, input)).rejects.toThrow(NotFoundError);
        });

        it('debe lanzar UnauthorizedError si la contraseña actual es incorrecta', async () => {
            mockRepo.buscarPorIdUsuario.mockResolvedValue(credencialFake);
            (bcrypt.compare as jest.Mock).mockResolvedValue(false);

            await expect(useCase.cambiarContrasena(1, input)).rejects.toThrow(UnauthorizedError);
        });

        it('debe actualizar la contraseña si la credencial existe y la contraseña es válida', async () => {
            mockRepo.buscarPorIdUsuario.mockResolvedValue(credencialFake);
            (bcrypt.compare as jest.Mock).mockResolvedValue(true);
            (bcrypt.hash as jest.Mock).mockResolvedValue('nuevo_hash');
            mockRepo.actualizarContrasena.mockResolvedValue();

            await useCase.cambiarContrasena(1, input);

            expect(mockRepo.actualizarContrasena).toHaveBeenCalledWith(1, 'nuevo_hash');
        });
    });

    describe('cambiarCorreo', () => {

        const input: CambiarCorreoInput = {
            contrasenaActual: 'secreto123',
            nuevoCorreo: 'nuevo@test.com',
        };

        it('debe lanzar NotFoundError si la credencial no existe', async () => {
            mockRepo.buscarPorIdUsuario.mockResolvedValue(null);

            await expect(useCase.cambiarCorreo(1, input)).rejects.toThrow(NotFoundError);
        });

        it('debe lanzar UnauthorizedError si la contraseña actual es incorrecta', async () => {
            mockRepo.buscarPorIdUsuario.mockResolvedValue(credencialFake);
            (bcrypt.compare as jest.Mock).mockResolvedValue(false);

            await expect(useCase.cambiarCorreo(1, input)).rejects.toThrow(UnauthorizedError);
        });

        it('debe lanzar ConflictError si el nuevo correo ya está registrado', async () => {
            mockRepo.buscarPorIdUsuario.mockResolvedValue(credencialFake);
            (bcrypt.compare as jest.Mock).mockResolvedValue(true);
            mockRepo.buscarPorCorreo.mockResolvedValue(credencialFake);

            await expect(useCase.cambiarCorreo(1, input)).rejects.toThrow(ConflictError);
        });

        it('debe actualizar el correo si todo es válido', async () => {
            mockRepo.buscarPorIdUsuario.mockResolvedValue(credencialFake);
            (bcrypt.compare as jest.Mock).mockResolvedValue(true);
            mockRepo.buscarPorCorreo.mockResolvedValue(null);
            mockRepo.actualizarCorreo.mockResolvedValue();

            await useCase.cambiarCorreo(1, input);

            expect(mockRepo.actualizarCorreo).toHaveBeenCalledWith(1, 'nuevo@test.com');
        });
    });

    describe('resetearContrasena', () => {

        const input: ResetContrasenaInput = {
            nuevaContrasena: 'reset456',
        };

        it('debe lanzar NotFoundError si la credencial no existe', async () => {
            mockRepo.buscarPorIdUsuario.mockResolvedValue(null);

            await expect(useCase.resetearContrasena(1, input)).rejects.toThrow(NotFoundError);
        });

        it('debe actualizar la contraseña si la credencial existe', async () => {
            mockRepo.buscarPorIdUsuario.mockResolvedValue(credencialFake);
            (bcrypt.hash as jest.Mock).mockResolvedValue('hash_reset');
            mockRepo.actualizarContrasena.mockResolvedValue();

            await useCase.resetearContrasena(1, input);

            expect(mockRepo.actualizarContrasena).toHaveBeenCalledWith(1, 'hash_reset');
        });
    });
});

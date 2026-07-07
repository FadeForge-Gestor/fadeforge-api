import { CredencialUseCase } from '@core/usecases/credenciales/credenciales.usecase';
import { ICredencialRepository, CredencialRaw } from '@core/ports/out/credenciales/ICredencialRepository';
import { IUsuarioRepository } from '@core/ports/out/usuarios/IUsuarioRepository';
import { IRolRepository } from '@core/ports/out/roles/IRolRepository';
import { CambiarContrasenaInput, CambiarCorreoInput, ResetContrasenaInput } from '@core/domain/credencial/credencial.entity';
import { Usuario } from '@core/domain/usuario/usuario.entity';
import { Rol } from '@core/domain/rol/rol.entity';
import { NotFoundError, UnauthorizedError, ConflictError } from '@shared/errors/HttpError';
import bcrypt from 'bcrypt';

jest.mock('bcrypt');

const credencialFake: CredencialRaw = {
    idUsuario: 1,
    correo: 'juan@test.com',
    hashContrasena: 'hash_secreto',
};

const usuarioFake: Usuario = {
    id: 1,
    nombre: 'Juan',
    aPaterno: 'Pérez',
    aMaterno: 'García',
    telefono: '1234567890',
    idRol: 2,
    activo: true,
    fechaCreacion: new Date(),
    fechaModificacion: new Date(),
};

const rolClienteFake: Rol = {
    id: 2,
    clave: 'cliente',
    nombre: 'Cliente',
    descripcion: null,
    fechaCreacion: new Date(),
    fechaModificacion: new Date(),
};

const rolAdminFake: Rol = {
    id: 1,
    clave: 'admin',
    nombre: 'Administrador',
    descripcion: null,
    fechaCreacion: new Date(),
    fechaModificacion: new Date(),
};

const mockRepo: jest.Mocked<ICredencialRepository> = {
    buscarPorIdUsuario: jest.fn(),
    buscarPorCorreo: jest.fn(),
    actualizarContrasena: jest.fn(),
    actualizarCorreo: jest.fn(),
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

const mockRolRepo: jest.Mocked<IRolRepository> = {
    listarTodos: jest.fn(),
    buscarPorId: jest.fn(),
    buscarPorClave: jest.fn(),
};

describe('CredencialUseCase', () => {

    let useCase: CredencialUseCase;

    beforeEach(() => {
        jest.clearAllMocks();
        useCase = new CredencialUseCase(mockRepo, mockUsuarioRepo, mockRolRepo);
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

        it('debe lanzar NotFoundError si el usuario no existe', async () => {
            mockRepo.buscarPorIdUsuario.mockResolvedValue(credencialFake);
            mockUsuarioRepo.buscarPorId.mockResolvedValue(null);

            await expect(useCase.resetearContrasena(1, input)).rejects.toThrow(NotFoundError);
            expect(mockRepo.actualizarContrasena).not.toHaveBeenCalled();
        });

        it('debe lanzar ConflictError si el usuario objetivo es administrador', async () => {
            mockRepo.buscarPorIdUsuario.mockResolvedValue(credencialFake);
            mockUsuarioRepo.buscarPorId.mockResolvedValue({ ...usuarioFake, idRol: 1 });
            mockRolRepo.buscarPorId.mockResolvedValue(rolAdminFake);

            await expect(useCase.resetearContrasena(1, input)).rejects.toThrow(ConflictError);
            expect(mockRepo.actualizarContrasena).not.toHaveBeenCalled();
        });

        it('debe actualizar la contraseña si la credencial existe', async () => {
            mockRepo.buscarPorIdUsuario.mockResolvedValue(credencialFake);
            mockUsuarioRepo.buscarPorId.mockResolvedValue(usuarioFake);
            mockRolRepo.buscarPorId.mockResolvedValue(rolClienteFake);
            (bcrypt.hash as jest.Mock).mockResolvedValue('hash_reset');
            mockRepo.actualizarContrasena.mockResolvedValue();

            await useCase.resetearContrasena(1, input);

            expect(mockRepo.actualizarContrasena).toHaveBeenCalledWith(1, 'hash_reset');
        });
    });
});

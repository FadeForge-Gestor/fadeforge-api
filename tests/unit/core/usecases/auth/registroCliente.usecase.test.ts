import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { RegistroClienteUseCase } from '@core/usecases/auth/registroCliente.usecase';
import { IUsuarioRepository } from '@core/ports/out/usuarios/IUsuarioRepository';
import { IRolRepository } from '@core/ports/out/roles/IRolRepository';
import { Usuario } from '@core/domain/usuario/usuario.entity';
import { Rol } from '@core/domain/rol/rol.entity';
import { BadRequestError, ConflictError, NotFoundError } from '@shared/errors/HttpError';
import { ROLES } from '@shared/constants/roles';

jest.mock('bcrypt');
jest.mock('jsonwebtoken');

const mockedBcrypt = jest.mocked(bcrypt);
const mockedJwt = jest.mocked(jwt);

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

const rolClienteFake: Rol = {
    id: 3,
    clave: ROLES.CLIENTE,
    nombre: 'Cliente',
    descripcion: null,
    activo: true,
    fechaCreacion: new Date(),
    fechaModificacion: new Date(),
};

const inputRegistro = {
    nombre: 'Juan',
    aPaterno: 'Pérez',
    telefono: '5512345678',
    correo: 'juan@test.com',
    contrasena: 'Secreto123!',
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
    listarActivos: jest.fn(),
    buscarPorId: jest.fn(),
    buscarPorNombre: jest.fn(),
    buscarPorClave: jest.fn(),
    crear: jest.fn(),
    actualizar: jest.fn(),
    desactivar: jest.fn(),
    reactivar: jest.fn(),
};

describe('RegistroClienteUseCase', () => {

    let useCase: RegistroClienteUseCase;

    beforeEach(() => {
        jest.clearAllMocks();
        useCase = new RegistroClienteUseCase(mockUsuarioRepo, mockRolRepo);
    });

    it('debe lanzar BadRequestError si la contraseña no cumple los requisitos', async () => {
        await expect(useCase.registrar({ ...inputRegistro, contrasena: 'debil' }))
            .rejects.toThrow(BadRequestError);
    });

    it('debe lanzar ConflictError si el correo ya está registrado', async () => {
        mockUsuarioRepo.buscarPorCorreo.mockResolvedValue(usuarioFake);

        await expect(useCase.registrar(inputRegistro)).rejects.toThrow(ConflictError);
    });

    it('debe lanzar NotFoundError si el rol cliente no está configurado', async () => {
        mockUsuarioRepo.buscarPorCorreo.mockResolvedValue(null);
        mockRolRepo.buscarPorClave.mockResolvedValue(null);

        await expect(useCase.registrar(inputRegistro)).rejects.toThrow(NotFoundError);
    });

    it('nunca debe pasar la contraseña en texto plano al repositorio', async () => {
        mockUsuarioRepo.buscarPorCorreo.mockResolvedValue(null);
        mockRolRepo.buscarPorClave.mockResolvedValue(rolClienteFake);
        mockedBcrypt.hash = jest.fn().mockResolvedValue('hash_secreto' as never);
        mockUsuarioRepo.crear.mockResolvedValue(usuarioFake);
        mockedJwt.sign = jest.fn().mockReturnValue('jwt-token-falso' as never);

        await useCase.registrar(inputRegistro);

        expect(mockUsuarioRepo.crear).toHaveBeenCalledWith(
            expect.objectContaining({ hashContrasena: 'hash_secreto' })
        );
        expect(mockUsuarioRepo.crear).not.toHaveBeenCalledWith(
            expect.objectContaining({ contrasena: expect.anything() })
        );
    });

    it('debe asignar siempre el rol cliente sin importar el input', async () => {
        mockUsuarioRepo.buscarPorCorreo.mockResolvedValue(null);
        mockRolRepo.buscarPorClave.mockResolvedValue(rolClienteFake);
        mockedBcrypt.hash = jest.fn().mockResolvedValue('hash_secreto' as never);
        mockUsuarioRepo.crear.mockResolvedValue(usuarioFake);
        mockedJwt.sign = jest.fn().mockReturnValue('jwt-token-falso' as never);

        await useCase.registrar(inputRegistro);

        expect(mockRolRepo.buscarPorClave).toHaveBeenCalledWith(ROLES.CLIENTE);
        expect(mockUsuarioRepo.crear).toHaveBeenCalledWith(
            expect.objectContaining({ idRol: rolClienteFake.id })
        );
    });

    it('debe retornar token y datos del usuario al registrarse exitosamente', async () => {
        mockUsuarioRepo.buscarPorCorreo.mockResolvedValue(null);
        mockRolRepo.buscarPorClave.mockResolvedValue(rolClienteFake);
        mockedBcrypt.hash = jest.fn().mockResolvedValue('hash_secreto' as never);
        mockUsuarioRepo.crear.mockResolvedValue(usuarioFake);
        mockedJwt.sign = jest.fn().mockReturnValue('jwt-token-falso' as never);

        const result = await useCase.registrar(inputRegistro);

        expect(result.token).toBe('jwt-token-falso');
        expect(result.usuario).toEqual({
            id: usuarioFake.id,
            correo: inputRegistro.correo,
            rol: ROLES.CLIENTE,
        });
    });
});

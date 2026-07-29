import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { RegistroClienteUseCase } from '@core/usecases/auth/registroCliente.usecase';
import { IUsuarioRepository } from '@core/ports/out/usuarios/IUsuarioRepository';
import { IRolRepository } from '@core/ports/out/roles/IRolRepository';
import { IEmailService } from '@core/ports/out/email/IEmailService';
import { ITokenVerificacionRepository } from '@core/ports/out/email/ITokenVerificacionRepository';
import { Usuario } from '@core/domain/usuario/usuario.entity';
import { Rol } from '@core/domain/rol/rol.entity';
import { BadRequestError, ConflictError, NotFoundError } from '@shared/errors/HttpError';
import { ROLES } from '@shared/constants/roles';
import { env } from '@config/env';

jest.mock('bcrypt');
jest.mock('jsonwebtoken');
jest.mock('@config/env', () => ({
    env: {
        JWT_SECRET: 'test-secret',
        JWT_EXPIRES_IN: '1d',
        EMAIL_VERIFICATION_ENABLED: true,
        EMAIL_VERIFICATION_EXPIRES_IN_HOURS: 24,
        FRONTEND_URL: 'http://localhost:3000',
    },
}));

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
    buscarPorId: jest.fn(),
    buscarPorClave: jest.fn(),
};

const mockEmailService: jest.Mocked<IEmailService> = {
    enviarVerificacion: jest.fn(),
};

const mockTokenVerificacionRepo: jest.Mocked<ITokenVerificacionRepository> = {
    crear: jest.fn(),
    buscarPorTokenHash: jest.fn(),
    eliminarPorIdUsuario: jest.fn(),
    contarEnviosHoy: jest.fn(),
};

describe('RegistroClienteUseCase', () => {

    let useCaseSinVerificacion: RegistroClienteUseCase;
    let useCaseConVerificacion: RegistroClienteUseCase;

    beforeAll(() => {
        useCaseSinVerificacion = new RegistroClienteUseCase(
            mockUsuarioRepo,
            mockRolRepo,
            mockEmailService,
            mockTokenVerificacionRepo,
        );
        useCaseConVerificacion = new RegistroClienteUseCase(
            mockUsuarioRepo,
            mockRolRepo,
            mockEmailService,
            mockTokenVerificacionRepo,
        );
    });

    describe('sin verificación de email', () => {

        beforeEach(() => {
            jest.clearAllMocks();
            env.EMAIL_VERIFICATION_ENABLED = false;
        });

        it('debe lanzar BadRequestError si la contraseña no cumple los requisitos', async () => {
            await expect(useCaseSinVerificacion.registrar({ ...inputRegistro, contrasena: 'debil' }))
                .rejects.toThrow(BadRequestError);
        });

        it('debe lanzar ConflictError si el correo ya está registrado', async () => {
            mockUsuarioRepo.buscarPorCorreo.mockResolvedValue(usuarioFake);

            await expect(useCaseSinVerificacion.registrar(inputRegistro)).rejects.toThrow(ConflictError);
        });

        it('debe lanzar NotFoundError si el rol cliente no está configurado', async () => {
            mockUsuarioRepo.buscarPorCorreo.mockResolvedValue(null);
            mockRolRepo.buscarPorClave.mockResolvedValue(null);

            await expect(useCaseSinVerificacion.registrar(inputRegistro)).rejects.toThrow(NotFoundError);
        });

        it('nunca debe pasar la contraseña en texto plano al repositorio', async () => {
            mockUsuarioRepo.buscarPorCorreo.mockResolvedValue(null);
            mockRolRepo.buscarPorClave.mockResolvedValue(rolClienteFake);
            mockedBcrypt.hash = jest.fn().mockResolvedValue('hash_secreto' as never);
            mockUsuarioRepo.crear.mockResolvedValue(usuarioFake);
            mockedJwt.sign = jest.fn().mockReturnValue('jwt-token-falso' as never);

            await useCaseSinVerificacion.registrar(inputRegistro);

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

            await useCaseSinVerificacion.registrar(inputRegistro);

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

            const result = await useCaseSinVerificacion.registrar(inputRegistro);

            expect(result.token).toBe('jwt-token-falso');
            expect(result.usuario).toEqual({
                id: usuarioFake.id,
                correo: inputRegistro.correo,
                rol: ROLES.CLIENTE,
            });
        });
    });

    describe('con verificación de email habilitada', () => {

        beforeEach(() => {
            jest.clearAllMocks();
            env.EMAIL_VERIFICATION_ENABLED = true;
        });

        it('debe generar token, hashear y enviar email en vez de retornar JWT', async () => {
            mockUsuarioRepo.buscarPorCorreo.mockResolvedValue(null);
            mockRolRepo.buscarPorClave.mockResolvedValue(rolClienteFake);
            mockedBcrypt.hash = jest.fn()
                .mockResolvedValueOnce('hash_password' as never)
                .mockResolvedValueOnce('hash_token' as never);
            mockUsuarioRepo.crear.mockResolvedValue(usuarioFake);

            const result = await useCaseConVerificacion.registrar(inputRegistro);

            expect(result.token).toBeUndefined();
            expect(result.mensaje).toBe('Te enviamos un correo de verificación. Revisa tu bandeja de entrada.');
            expect(result.usuario).toEqual({
                id: usuarioFake.id,
                correo: inputRegistro.correo,
                rol: ROLES.CLIENTE,
            });
            expect(mockTokenVerificacionRepo.crear).toHaveBeenCalledWith(
                usuarioFake.id,
                'hash_token',
                expect.any(Date)
            );
            expect(mockEmailService.enviarVerificacion).toHaveBeenCalledWith(
                inputRegistro.correo,
                expect.any(String)
            );
        });

        it('debe registrar el usuario aunque falle el envío de email', async () => {
            mockUsuarioRepo.buscarPorCorreo.mockResolvedValue(null);
            mockRolRepo.buscarPorClave.mockResolvedValue(rolClienteFake);
            mockedBcrypt.hash = jest.fn()
                .mockResolvedValueOnce('hash_password' as never)
                .mockResolvedValueOnce('hash_token' as never);
            mockUsuarioRepo.crear.mockResolvedValue(usuarioFake);
            mockEmailService.enviarVerificacion.mockRejectedValue(new Error('Resend caído'));

            const result = await useCaseConVerificacion.registrar(inputRegistro);

            expect(result.usuario).toBeDefined();
            expect(result.token).toBeUndefined();
            expect(mockUsuarioRepo.crear).toHaveBeenCalled();
        });
    });
});

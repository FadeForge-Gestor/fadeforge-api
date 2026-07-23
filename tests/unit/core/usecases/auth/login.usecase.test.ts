import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { LoginUseCase } from '@core/usecases/auth/login.usecase';
import { IAuthRepository, CredencialesAuth } from '@core/ports/out/auth/IAuthRepository';
import { ILoginSecurityRepository } from '@core/ports/out/login-security/ILoginSecurityRepository';
import { UnauthorizedError, TooManyRequestsError } from '@shared/errors/HttpError';

jest.mock('bcrypt');
jest.mock('jsonwebtoken');

const mockedBcrypt = jest.mocked(bcrypt);
const mockedJwt = jest.mocked(jwt);

const credencialesFake: CredencialesAuth = {
    correo: 'test@test.com',
    hashContrasena: '$2b$10$hasheado',
    idUsuario: 1,
    claveRol: 'cliente',
};

const mockAuthRepo: jest.Mocked<IAuthRepository> = {
    buscarPorCorreo: jest.fn(),
};

const mockSecurityRepo: jest.Mocked<ILoginSecurityRepository> = {
    registrarIntentoFallido: jest.fn(),
    resetIntentos: jest.fn(),
    estaBloqueado: jest.fn(),
    obtenerEstado: jest.fn(),
};

describe('LoginUseCase', () => {

    let useCase: LoginUseCase;

    beforeEach(() => {
        jest.clearAllMocks();
        useCase = new LoginUseCase(mockAuthRepo, mockSecurityRepo);
    });

    it('debe lanzar UnauthorizedError si el correo no existe', async () => {
        mockSecurityRepo.estaBloqueado.mockResolvedValue(false);
        mockAuthRepo.buscarPorCorreo.mockResolvedValue(null);
        mockSecurityRepo.registrarIntentoFallido.mockResolvedValue({
            correo: 'noexiste@test.com',
            intentosFallidos: 1,
            bloqueadoHasta: null,
            tiempoRestanteMs: null,
        });

        await expect(
            useCase.login({ correo: 'noexiste@test.com', contrasena: '123456' })
        ).rejects.toThrow(UnauthorizedError);
    });

    it('debe registrar intento fallido cuando el correo no existe', async () => {
        mockSecurityRepo.estaBloqueado.mockResolvedValue(false);
        mockAuthRepo.buscarPorCorreo.mockResolvedValue(null);
        mockSecurityRepo.registrarIntentoFallido.mockResolvedValue({
            correo: 'noexiste@test.com',
            intentosFallidos: 1,
            bloqueadoHasta: null,
            tiempoRestanteMs: null,
        });

        await expect(
            useCase.login({ correo: 'noexiste@test.com', contrasena: '123456' })
        ).rejects.toThrow();

        expect(mockSecurityRepo.registrarIntentoFallido).toHaveBeenCalledWith('noexiste@test.com');
    });

    it('debe lanzar UnauthorizedError si la contraseña es incorrecta', async () => {
        mockSecurityRepo.estaBloqueado.mockResolvedValue(false);
        mockAuthRepo.buscarPorCorreo.mockResolvedValue(credencialesFake);
        mockedBcrypt.compare = jest.fn().mockResolvedValue(false as never);
        mockSecurityRepo.registrarIntentoFallido.mockResolvedValue({
            correo: 'test@test.com',
            intentosFallidos: 1,
            bloqueadoHasta: null,
            tiempoRestanteMs: null,
        });

        await expect(
            useCase.login({ correo: 'test@test.com', contrasena: 'incorrecta' })
        ).rejects.toThrow(UnauthorizedError);
    });

    it('debe registrar intento fallido cuando la contraseña es incorrecta', async () => {
        mockSecurityRepo.estaBloqueado.mockResolvedValue(false);
        mockAuthRepo.buscarPorCorreo.mockResolvedValue(credencialesFake);
        mockedBcrypt.compare = jest.fn().mockResolvedValue(false as never);
        mockSecurityRepo.registrarIntentoFallido.mockResolvedValue({
            correo: 'test@test.com',
            intentosFallidos: 1,
            bloqueadoHasta: null,
            tiempoRestanteMs: null,
        });

        await expect(
            useCase.login({ correo: 'test@test.com', contrasena: 'incorrecta' })
        ).rejects.toThrow();

        expect(mockSecurityRepo.registrarIntentoFallido).toHaveBeenCalledWith('test@test.com');
    });

    it('debe retornar token y usuario cuando las credenciales son válidas', async () => {
        mockSecurityRepo.estaBloqueado.mockResolvedValue(false);
        mockAuthRepo.buscarPorCorreo.mockResolvedValue(credencialesFake);
        mockedBcrypt.compare = jest.fn().mockResolvedValue(true as never);
        mockedJwt.sign = jest.fn().mockReturnValue('jwt-token-falso' as never);
        mockSecurityRepo.resetIntentos.mockResolvedValue(undefined);

        const result = await useCase.login({ correo: 'test@test.com', contrasena: '123456' });

        expect(result.token).toBe('jwt-token-falso');
    });

    it('debe retornar los datos del usuario correctamente', async () => {
        mockSecurityRepo.estaBloqueado.mockResolvedValue(false);
        mockAuthRepo.buscarPorCorreo.mockResolvedValue(credencialesFake);
        mockedBcrypt.compare = jest.fn().mockResolvedValue(true as never);
        mockedJwt.sign = jest.fn().mockReturnValue('jwt-token-falso' as never);
        mockSecurityRepo.resetIntentos.mockResolvedValue(undefined);

        const result = await useCase.login({ correo: 'test@test.com', contrasena: '123456' });

        expect(result.usuario).toEqual({
            id: credencialesFake.idUsuario,
            correo: credencialesFake.correo,
            rol: credencialesFake.claveRol,
        });
    });

    it('debe resetear intentos cuando el login es exitoso', async () => {
        mockSecurityRepo.estaBloqueado.mockResolvedValue(false);
        mockAuthRepo.buscarPorCorreo.mockResolvedValue(credencialesFake);
        mockedBcrypt.compare = jest.fn().mockResolvedValue(true as never);
        mockedJwt.sign = jest.fn().mockReturnValue('jwt-token-falso' as never);
        mockSecurityRepo.resetIntentos.mockResolvedValue(undefined);

        await useCase.login({ correo: 'test@test.com', contrasena: '123456' });

        expect(mockSecurityRepo.resetIntentos).toHaveBeenCalledWith('test@test.com');
    });

    it('debe lanzar TooManyRequestsError si la cuenta está bloqueada', async () => {
        mockSecurityRepo.estaBloqueado.mockResolvedValue(true);
        mockSecurityRepo.obtenerEstado.mockResolvedValue({
            correo: 'test@test.com',
            intentosFallidos: 5,
            bloqueadoHasta: new Date(Date.now() + 10 * 60 * 1000),
            tiempoRestanteMs: 10 * 60 * 1000,
        });

        await expect(
            useCase.login({ correo: 'test@test.com', contrasena: '123456' })
        ).rejects.toThrow(TooManyRequestsError);
    });

    it('debe incluir tiempo restante en el mensaje de cuenta bloqueada', async () => {
        mockSecurityRepo.estaBloqueado.mockResolvedValue(true);
        mockSecurityRepo.obtenerEstado.mockResolvedValue({
            correo: 'test@test.com',
            intentosFallidos: 5,
            bloqueadoHasta: new Date(Date.now() + 10 * 60 * 1000),
            tiempoRestanteMs: 10 * 60 * 1000,
        });

        try {
            await useCase.login({ correo: 'test@test.com', contrasena: '123456' });
        } catch (error) {
            expect(error).toBeInstanceOf(TooManyRequestsError);
            expect((error as TooManyRequestsError).message).toContain('10 minuto(s)');
        }
    });

    it('debe normalizar el correo a lowercase', async () => {
        mockSecurityRepo.estaBloqueado.mockResolvedValue(false);
        mockAuthRepo.buscarPorCorreo.mockResolvedValue(credencialesFake);
        mockedBcrypt.compare = jest.fn().mockResolvedValue(true as never);
        mockedJwt.sign = jest.fn().mockReturnValue('jwt-token-falso' as never);
        mockSecurityRepo.resetIntentos.mockResolvedValue(undefined);

        await useCase.login({ correo: 'Test@TEST.COM', contrasena: '123456' });

        expect(mockSecurityRepo.estaBloqueado).toHaveBeenCalledWith('test@test.com');
        expect(mockAuthRepo.buscarPorCorreo).toHaveBeenCalledWith('test@test.com');
    });

    it('debe registrar intento fallido con correo normalizado', async () => {
        mockSecurityRepo.estaBloqueado.mockResolvedValue(false);
        mockAuthRepo.buscarPorCorreo.mockResolvedValue(null);
        mockSecurityRepo.registrarIntentoFallido.mockResolvedValue({
            correo: 'test@test.com',
            intentosFallidos: 1,
            bloqueadoHasta: null,
            tiempoRestanteMs: null,
        });

        await expect(
            useCase.login({ correo: 'TEST@Test.COM', contrasena: '123456' })
        ).rejects.toThrow();

        expect(mockSecurityRepo.registrarIntentoFallido).toHaveBeenCalledWith('test@test.com');
    });
});

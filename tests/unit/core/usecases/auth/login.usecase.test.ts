import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { LoginUseCase } from '@core/usecases/auth/login.usecase';
import { IAuthRepository, CredencialesAuth } from '@core/ports/out/auth/IAuthRepository';
import { UnauthorizedError } from '@shared/errors/HttpError';

jest.mock('bcrypt');
jest.mock('jsonwebtoken');

const mockedBcrypt = jest.mocked(bcrypt);
const mockedJwt = jest.mocked(jwt);

// Datos reutilizables que simulan lo que devolvería la base de datos
const credencialesFake: CredencialesAuth = {
    correo: 'test@test.com',
    hashContrasena: '$2b$10$hasheado',
    idUsuario: 1,
    idRol: 2,
};

// El repositorio no es un módulo externo sino una clase inyectada —
// se mockea creando un objeto que implementa la interfaz con funciones falsas
const mockRepo: jest.Mocked<IAuthRepository> = {
    buscarPorCorreo: jest.fn(),
};

describe('LoginUseCase', () => {

    let useCase: LoginUseCase;

    beforeEach(() => {
        jest.clearAllMocks();
        // Se inyecta el repositorio falso igual que en producción
        useCase = new LoginUseCase(mockRepo);
    });

    it('debe lanzar UnauthorizedError si el correo no existe', async () => {
        // El repositorio retorna null — usuario no encontrado
        mockRepo.buscarPorCorreo.mockResolvedValue(null);

        await expect(
            useCase.login({ correo: 'noexiste@test.com', contrasena: '123456' })
        ).rejects.toThrow(UnauthorizedError);
    });

    it('debe lanzar UnauthorizedError si la contraseña es incorrecta', async () => {
        mockRepo.buscarPorCorreo.mockResolvedValue(credencialesFake);
        // bcrypt.compare retorna false — contraseña no coincide con el hash
        mockedBcrypt.compare = jest.fn().mockResolvedValue(false as never);

        await expect(
            useCase.login({ correo: 'test@test.com', contrasena: 'incorrecta' })
        ).rejects.toThrow(UnauthorizedError);
    });

    it('debe retornar token y usuario cuando las credenciales son válidas', async () => {
        mockRepo.buscarPorCorreo.mockResolvedValue(credencialesFake);
        mockedBcrypt.compare = jest.fn().mockResolvedValue(true as never);
        mockedJwt.sign = jest.fn().mockReturnValue('jwt-token-falso' as never);

        const result = await useCase.login({ correo: 'test@test.com', contrasena: '123456' });

        expect(result.token).toBe('jwt-token-falso');
    });

    it('debe retornar los datos del usuario correctamente', async () => {
        mockRepo.buscarPorCorreo.mockResolvedValue(credencialesFake);
        mockedBcrypt.compare = jest.fn().mockResolvedValue(true as never);
        mockedJwt.sign = jest.fn().mockReturnValue('jwt-token-falso' as never);

        const result = await useCase.login({ correo: 'test@test.com', contrasena: '123456' });

        expect(result.usuario).toEqual({
            id: credencialesFake.idUsuario,
            correo: credencialesFake.correo,
            rol: credencialesFake.idRol,
        });
    });
});

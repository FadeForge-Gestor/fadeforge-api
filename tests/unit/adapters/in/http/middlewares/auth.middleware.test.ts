import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { authenticate, authorize } from '@middlewares/auth.middleware';
import { UnauthorizedError, ForbiddenError } from '@shared/errors/HttpError';

jest.mock('@config/env', () => ({
    env: { JWT_SECRET: 'test-secret' }
}));

// Mockeamos jsonwebtoken completo para controlar qué retorna jwt.verify en cada test
jest.mock('jsonwebtoken');
const mockedJwt = jest.mocked(jwt);

describe('authenticate', () => {

    let next: jest.MockedFunction<NextFunction>;

    beforeEach(() => {
        next = jest.fn();
    });

    it('debe llamar next(UnauthorizedError) si no hay header Authorization', () => {
        const req = { headers: {} } as Request;

        authenticate(req, {} as Response, next);

        expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
    });

    it('debe llamar next(UnauthorizedError) si el header no tiene formato Bearer', () => {
        const req = { headers: { authorization: 'Basic abc123' } } as Request;

        authenticate(req, {} as Response, next);

        expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
    });

    it('debe asignar req.user y llamar next() cuando el token es válido', () => {
        const payload = { id: 1, correo: 'test@test.com', rol: 2 };
        // Simulamos que jwt.verify retorna el payload correctamente
        mockedJwt.verify = jest.fn().mockReturnValue(payload);

        const req = {
            headers: { authorization: 'Bearer token-valido' }
        } as Request;

        authenticate(req, {} as Response, next);

        expect(req.user).toEqual(payload);
        expect(next).toHaveBeenCalledWith();
    });

    it('debe llamar next(UnauthorizedError) cuando jwt.verify lanza una excepción', () => {
        // Simulamos que jwt.verify lanza error (token expirado, firma inválida, etc.)
        mockedJwt.verify = jest.fn().mockImplementation(() => {
            throw new Error('Token expirado');
        });

        const req = {
            headers: { authorization: 'Bearer token-invalido' }
        } as Request;

        authenticate(req, {} as Response, next);

        expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
    });
});

describe('authorize', () => {

    let next: jest.MockedFunction<NextFunction>;

    beforeEach(() => {
        next = jest.fn();
    });

    it('debe llamar next() cuando el usuario tiene un rol permitido', () => {
        const req = {
            user: { id: 1, correo: 'test@test.com', rol: 1 }
        } as Request;

        authorize(1, 2)(req, {} as Response, next);

        expect(next).toHaveBeenCalledWith();
    });

    it('debe llamar next(ForbiddenError) cuando el usuario no tiene el rol requerido', () => {
        const req = {
            user: { id: 1, correo: 'test@test.com', rol: 3 }
        } as Request;

        authorize(1, 2)(req, {} as Response, next);

        expect(next).toHaveBeenCalledWith(expect.any(ForbiddenError));
    });

    it('debe llamar next(ForbiddenError) cuando no hay usuario en req', () => {
        const req = {} as Request;

        authorize(1)(req, {} as Response, next);

        expect(next).toHaveBeenCalledWith(expect.any(ForbiddenError));
    });
});

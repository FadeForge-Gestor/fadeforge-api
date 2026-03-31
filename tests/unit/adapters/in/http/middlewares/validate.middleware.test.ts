import { Request, Response, NextFunction } from 'express';
import { validate } from '@middlewares/validate.middleware';
import { loginSchema } from '@adapters/in/http/auth/auth.schema';
import { BadRequestError } from '@shared/errors/HttpError';

// Pruebas unitarias para el middleware de validación con Zod
// Se simulan req, res y next sin levantar un servidor real
describe('validate middleware', () => {

    // next es una función falsa que registra si fue llamada y con qué argumentos
    let next: jest.MockedFunction<NextFunction>;

    beforeEach(() => {
        // Se reinicia el mock antes de cada test para que no haya contaminación entre tests
        next = jest.fn();
    });

    it('debe llamar next() sin argumentos cuando el body es válido', () => {
        const req = {
            body: { correo: 'test@test.com', contrasena: '123456' }
        } as Request;
        const res = {} as Response;

        validate(loginSchema)(req, res, next);

        expect(next).toHaveBeenCalledWith();
    });

    it('debe mutar req.body con los datos parseados por Zod', () => {
        const req = {
            body: { correo: 'test@test.com', contrasena: '123456' }
        } as Request;
        const res = {} as Response;

        validate(loginSchema)(req, res, next);

        expect(req.body).toEqual({ correo: 'test@test.com', contrasena: '123456' });
    });

    it('debe llamar next(BadRequestError) cuando el correo es inválido', () => {
        const req = {
            body: { correo: 'no-es-un-correo', contrasena: '123456' }
        } as Request;
        const res = {} as Response;

        validate(loginSchema)(req, res, next);

        expect(next).toHaveBeenCalledWith(expect.any(BadRequestError));
    });

    it('debe llamar next(BadRequestError) cuando la contraseña es muy corta', () => {
        const req = {
            body: { correo: 'test@test.com', contrasena: '123' }
        } as Request;
        const res = {} as Response;

        validate(loginSchema)(req, res, next);

        expect(next).toHaveBeenCalledWith(expect.any(BadRequestError));
    });

    it('debe llamar next(BadRequestError) cuando el body está vacío', () => {
        const req = { body: {} } as Request;
        const res = {} as Response;

        validate(loginSchema)(req, res, next);

        expect(next).toHaveBeenCalledWith(expect.any(BadRequestError));
    });
});

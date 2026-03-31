import { Request, Response, NextFunction } from 'express';
import { errorMiddleware } from '@middlewares/error.middleware';
import { BadRequestError, UnauthorizedError } from '@shared/errors/HttpError';

// Mockeamos env para que el middleware no llame console.error en los tests
jest.mock('@config/env', () => ({
    env: { NODE_ENV: 'production' }
}));

// Pruebas unitarias para el middleware global de manejo de errores
describe('errorMiddleware', () => {

    let res: { status: jest.Mock; json: jest.Mock };

    beforeEach(() => {
        // status().json() es una cadena — mockReturnThis hace que status() retorne el mismo objeto res
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };
    });

    it('debe responder con el statusCode del HttpError', () => {
        const error = new BadRequestError();

        errorMiddleware(error, {} as Request, res as unknown as Response, jest.fn() as NextFunction);

        expect(res.status).toHaveBeenCalledWith(400);
    });

    it('debe responder con name y message del HttpError', () => {
        const error = new UnauthorizedError('Token inválido');

        errorMiddleware(error, {} as Request, res as unknown as Response, jest.fn() as NextFunction);

        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            ok: false,
            name: 'UnauthorizedError',
            message: 'Token inválido',
        }));
    });

    it('debe responder con 500 ante un error genérico', () => {
        const error = new Error('algo inesperado');

        errorMiddleware(error, {} as Request, res as unknown as Response, jest.fn() as NextFunction);

        expect(res.status).toHaveBeenCalledWith(500);
    });

    it('debe responder con InternalServerError ante un error genérico', () => {
        const error = new Error('algo inesperado');

        errorMiddleware(error, {} as Request, res as unknown as Response, jest.fn() as NextFunction);

        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            ok: false,
            name: 'InternalServerError',
        }));
    });
});

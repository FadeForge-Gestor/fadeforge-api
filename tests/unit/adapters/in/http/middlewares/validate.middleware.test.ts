import { Request, Response, NextFunction } from 'express';
import { validate, validateParams, validateQuery } from '@middlewares/validate.middleware';
import { loginSchema } from '@adapters/in/http/auth/auth.schema';
import { RangoFechaSchema } from '@adapters/in/http/citas/citas.schema';
import { idParamSchema } from '@adapters/in/http/roles/roles.schema';
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

    it('debe llamar next(BadRequestError) cuando la contraseña está vacía', () => {
        const req = {
            body: { correo: 'test@test.com', contrasena: '' }
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

describe('validateParams', () => {

    let next: jest.MockedFunction<NextFunction>;

    beforeEach(() => {
        next = jest.fn();
    });

    it('debe llamar next() sin argumentos cuando el param es válido', () => {
        const req = {
            params: { id: '5' },
            validatedParams: undefined,
        } as unknown as Request;
        const res = {} as Response;

        validateParams(idParamSchema)(req, res, next);

        expect(next).toHaveBeenCalledWith();
    });

    it('debe mutar req.validatedParams con los datos parseados por Zod', () => {
        const req = {
            params: { id: '5' },
            validatedParams: undefined,
        } as unknown as Request;
        const res = {} as Response;

        validateParams(idParamSchema)(req, res, next);

        expect(req.validatedParams).toEqual({ id: 5 });
    });

    it('debe llamar next(BadRequestError) cuando el param no es un número', () => {
        const req = {
            params: { id: 'abc' },
            validatedParams: undefined,
        } as unknown as Request;
        const res = {} as Response;

        validateParams(idParamSchema)(req, res, next);

        expect(next).toHaveBeenCalledWith(expect.any(BadRequestError));
    });

    it('debe llamar next(BadRequestError) cuando el id es cero o negativo', () => {
        const req = {
            params: { id: '0' },
            validatedParams: undefined,
        } as unknown as Request;
        const res = {} as Response;

        validateParams(idParamSchema)(req, res, next);

        expect(next).toHaveBeenCalledWith(expect.any(BadRequestError));
    });
});

describe('validateQuery', () => {

    let next: jest.MockedFunction<NextFunction>;

    beforeEach(() => {
        next = jest.fn();
    });

    it('debe llamar next() sin argumentos cuando el query es válido', () => {
        const req = {
            query: { desde: '2026-06-01', hasta: '2026-06-30' },
            validatedQuery: undefined,
        } as unknown as Request;
        const res = {} as Response;

        validateQuery(RangoFechaSchema)(req, res, next);

        expect(next).toHaveBeenCalledWith();
    });

    it('debe mutar req.validatedQuery con los datos parseados por Zod', () => {
        const req = {
            query: { desde: '2026-06-01', hasta: '2026-06-30' },
            validatedQuery: undefined,
        } as unknown as Request;
        const res = {} as Response;

        validateQuery(RangoFechaSchema)(req, res, next);

        expect(req.validatedQuery).toMatchObject({
            desde: expect.any(Date),
            hasta: expect.any(Date),
        });
    });

    it('debe llamar next(BadRequestError) cuando el query está vacío', () => {
        const req = {
            query: {},
            validatedQuery: undefined,
        } as unknown as Request;
        const res = {} as Response;

        validateQuery(RangoFechaSchema)(req, res, next);

        expect(next).toHaveBeenCalledWith(expect.any(BadRequestError));
    });

    it('debe llamar next(BadRequestError) cuando las fechas son inválidas', () => {
        const req = {
            query: { desde: 'no-es-fecha', hasta: 'tampoco' },
            validatedQuery: undefined,
        } as unknown as Request;
        const res = {} as Response;

        validateQuery(RangoFechaSchema)(req, res, next);

        expect(next).toHaveBeenCalledWith(expect.any(BadRequestError));
    });

    it('debe llamar next(BadRequestError) cuando desde es posterior a hasta', () => {
        const req = {
            query: { desde: '2026-06-30', hasta: '2026-06-01' },
            validatedQuery: undefined,
        } as unknown as Request;
        const res = {} as Response;

        validateQuery(RangoFechaSchema)(req, res, next);

        expect(next).toHaveBeenCalledWith(expect.any(BadRequestError));
    });
});

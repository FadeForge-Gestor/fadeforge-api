import { HttpError, BadRequestError, UnauthorizedError, ForbiddenError, NotFoundError, ConflictError, InternalServerError } from '@shared/errors/HttpError';

// Pruebas unitarias para las clases de error HTTP
describe('HttpError', () => {

    it('debe guardar statusCode y message correctamente', () => {
        const error = new HttpError(404, 'No encontrado');

        expect(error.statusCode).toBe(404);
        expect(error.message).toBe('No encontrado');
    });

    it('debe ser instancia de Error', () => {
        const error = new HttpError(500, 'Error');

        expect(error).toBeInstanceOf(Error);
    });
});

// Pruebas unitarias para las clases de error específicos
describe('BadRequestError', () => {

    it('debe tener statusCode 400', () => {
        const error = new BadRequestError();

        expect(error.statusCode).toBe(400);
    });

    it('debe usar el mensaje por defecto si no se pasa uno', () => {
        const error = new BadRequestError();

        expect(error.message).toBe('Solicitud inválida');
    });

    it('debe usar el mensaje personalizado si se pasa uno', () => {
        const error = new BadRequestError('Datos incorrectos');

        expect(error.message).toBe('Datos incorrectos');
    });
});

// Pruebas unitarias para las demás clases de error HTTP
describe('UnauthorizedError', () => {
    it('debe tener statusCode 401', () => {
        expect(new UnauthorizedError().statusCode).toBe(401);
    });
});

// Pruebas unitarias para ForbiddenError, NotFoundError, ConflictError e InternalServerError
describe('ForbiddenError', () => {
    it('debe tener statusCode 403', () => {
        expect(new ForbiddenError().statusCode).toBe(403);
    });
});

describe('NotFoundError', () => {
    it('debe tener statusCode 404', () => {
        expect(new NotFoundError().statusCode).toBe(404);
    });
});

describe('ConflictError', () => {
    it('debe tener statusCode 409', () => {
        expect(new ConflictError().statusCode).toBe(409);
    });
});

describe('InternalServerError', () => {
    it('debe tener statusCode 500', () => {
        expect(new InternalServerError().statusCode).toBe(500);
    });
});
